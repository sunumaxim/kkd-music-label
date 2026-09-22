// KKD Music — Client Firebase Firestore & Authentication
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getAuth, 
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
  signOut as fbSignOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Paramètres de redirection pour les emails Firebase (valide.kkdmusic.com)
export const ACTION_CODE_SETTINGS = {
  url: 'https://valide.kkdmusic.com/login?fromAction=true',
  handleCodeInApp: true,
};

// Initialisation unique de Firebase
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialisation conditionnelle d'Analytics pour la production et le navigateur
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.debug('Firebase Analytics is not supported in this environment:', err?.message);
  });
}

// Initialisation de Firestore avec l'ID de base de données dédié
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Configuration explicite de la persistance de session dans le navigateur
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.debug('Firebase persistence configuration notice:', err?.message);
  });
}

// Fonction universelle d'envoi et d'enregistrement des notifications dans Firestore
export async function sendAppNotification({
  userId,
  userEmail,
  title,
  message,
  type = 'info', // 'inscription' | 'validation' | 'modification' | 'info'
}) {
  const notifData = {
    user_id: userId || '',
    user_email: userEmail || 'all',
    title: title || 'Notification KKD Music',
    message: message || '',
    type: type,
    read: false,
    created_at: new Date().toISOString(),
    created_date: new Date().toISOString(),
  };

  try {
    await firestoreService.addDocument('notifications', notifData);
  } catch (err) {
    console.warn('[Firestore] Failed to save notification:', err?.message);
  }

  // Notifier l'interface locale en temps réel
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kkd:new_notification', { detail: notifData }));
  }
  return notifData;
}

// Opérations d'authentification renforcées
export const firebaseAuthService = {
  // Connexion Google
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      return await this.syncFirebaseUserToFirestore(fbUser);
    } catch (error) {
      const errorCode = error?.code || '';
      if (errorCode === 'auth/popup-closed-by-user') {
        console.info('[FirebaseAuth] Google Sign-In popup was closed by user before completing sign-in.');
        const customErr = new Error('La fenêtre de connexion Google a été fermée avant la finalisation.');
        customErr.code = 'auth/popup-closed-by-user';
        customErr.isCancelled = true;
        throw customErr;
      }
      if (errorCode === 'auth/cancelled-popup-request') {
        console.info('[FirebaseAuth] Previous Google Sign-In popup request was cancelled.');
        const customErr = new Error('La tentative de connexion précédente a été annulée.');
        customErr.code = 'auth/cancelled-popup-request';
        customErr.isCancelled = true;
        throw customErr;
      }
      if (errorCode === 'auth/popup-blocked') {
        console.warn('[FirebaseAuth] Google Sign-In popup was blocked by browser.');
        const customErr = new Error('La fenêtre de connexion a été bloquée par le navigateur. Veuillez autoriser les pop-ups ou ouvrir l’application dans un nouvel onglet.');
        customErr.code = 'auth/popup-blocked';
        throw customErr;
      }
      if (errorCode === 'auth/operation-not-allowed') {
        console.warn('[FirebaseAuth] Google Sign-In provider is disabled in Firebase Console (Authentication > Sign-in method > Google).');
        const customErr = new Error("L'authentification Google n'est pas activée dans la console Firebase (Authentication > Sign-in method > Google).");
        customErr.code = 'auth/operation-not-allowed';
        throw customErr;
      }
      console.error('Firebase Google Sign-In Error:', error);
      throw error;
    }
  },

  // Connexion Email & Mot de passe
  async loginWithEmail(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      return await this.syncFirebaseUserToFirestore(cred.user);
    } catch (error) {
      if (error?.code === 'auth/operation-not-allowed') {
        const customErr = new Error("La connexion par e-mail/mot de passe n'est pas activée dans la console Firebase (Authentication > Sign-in method > E-mail/Mot de passe).");
        customErr.code = 'auth/operation-not-allowed';
        throw customErr;
      }
      console.warn('Firebase Email Sign-In Error:', error?.message || error);
      throw error;
    }
  },

  // Inscription Email & Mot de passe
  async registerWithEmail(email, password, fullName = '') {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (fullName && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: fullName });
      }
      const userData = await this.syncFirebaseUserToFirestore(cred.user, { full_name: fullName });
      
      // Notification d'inscription
      await sendAppNotification({
        userId: cred.user.uid,
        userEmail: cred.user.email,
        title: 'Bienvenue sur KKD Music !',
        message: `Votre compte a été créé avec succès pour ${fullName || cred.user.email}. Bienvenue sur la plateforme officielle de streaming et distribution !`,
        type: 'inscription'
      });

      // Tentative d'envoi d'email de validation avec redirection personnalisée valide.kkdmusic.com
      try {
        await sendEmailVerification(cred.user, ACTION_CODE_SETTINGS);
      } catch (evErr) {
        console.info('[Firebase Auth] sendEmailVerification notice:', evErr?.message);
      }

      return userData;
    } catch (error) {
      if (error?.code === 'auth/operation-not-allowed') {
        const customErr = new Error("L'inscription par e-mail/mot de passe n'est pas activée dans la console Firebase (Authentication > Sign-in method > E-mail/Mot de passe).");
        customErr.code = 'auth/operation-not-allowed';
        throw customErr;
      }
      console.warn('Firebase Register Error:', error?.message || error);
      throw error;
    }
  },

  // Préparation du RecaptchaVerifier invisible pour l'authentification par SMS
  initPhoneVerifier(containerId = 'phone-recaptcha-container') {
    if (typeof window === 'undefined') return null;
    try {
      if (window.phoneRecaptchaVerifier) {
        try { window.phoneRecaptchaVerifier.clear(); } catch (_) {}
      }
      window.phoneRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.info('[Firebase Phone Auth] Recaptcha résolu automatiquement');
        },
        'expired-callback': () => {
          console.warn('[Firebase Phone Auth] Recaptcha expiré');
        }
      });
      return window.phoneRecaptchaVerifier;
    } catch (err) {
      console.warn('[Firebase Phone Auth] initPhoneVerifier warning:', err);
      return null;
    }
  },

  // Envoi du code SMS pour la connexion par téléphone
  async sendPhoneOtp(phoneNumber, containerId = 'phone-recaptcha-container') {
    try {
      const cleanPhone = (phoneNumber || '').trim().replace(/\s+/g, '');
      if (!cleanPhone.startsWith('+')) {
        throw new Error('Le numéro de téléphone doit inclure l’indicatif international (ex: +221 pour le Sénégal, +33 pour la France).');
      }
      const verifier = this.initPhoneVerifier(containerId);
      if (!verifier) {
        throw new Error('Impossible d’initialiser le module de vérification SMS.');
      }
      const confirmationResult = await signInWithPhoneNumber(auth, cleanPhone, verifier);
      return confirmationResult;
    } catch (error) {
      console.error('[Firebase sendPhoneOtp error]:', error);
      if (error?.code === 'auth/operation-not-allowed') {
        throw new Error("L'authentification par SMS (Téléphone) n'est pas activée dans la console Firebase (Authentication > Sign-in method > Téléphone).");
      }
      if (error?.code === 'auth/invalid-phone-number') {
        throw new Error('Format de numéro de téléphone invalide. Utilisez le format international (ex: +221 77 123 45 67).');
      }
      if (error?.code === 'auth/too-many-requests') {
        throw new Error('Trop de demandes de SMS en peu de temps. Veuillez patienter avant de réessayer.');
      }
      if (error?.code === 'auth/quota-exceeded') {
        throw new Error('Quota de SMS Firebase atteint pour ce projet.');
      }
      throw error;
    }
  },

  // Validation du code SMS et connexion
  async verifyPhoneOtp(confirmationResult, otpCode) {
    if (!confirmationResult || typeof confirmationResult.confirm !== 'function') {
      throw new Error('Session de vérification SMS invalide ou expirée.');
    }
    try {
      const result = await confirmationResult.confirm(otpCode.trim());
      const fbUser = result.user;
      const userData = await this.syncFirebaseUserToFirestore(fbUser, {
        phone: fbUser.phoneNumber || '',
        account_type: 'listener',
      });

      // Notification de validation
      await sendAppNotification({
        userId: fbUser.uid,
        userEmail: fbUser.email || '',
        title: 'Connexion sécurisée par SMS',
        message: `Connexion validée avec succès avec le numéro ${fbUser.phoneNumber || ''}.`,
        type: 'validation'
      });

      return userData;
    } catch (error) {
      console.error('[Firebase verifyPhoneOtp error]:', error);
      if (error?.code === 'auth/invalid-verification-code') {
        throw new Error('Code de vérification SMS incorrect. Vérifiez les 6 chiffres reçus par SMS.');
      }
      if (error?.code === 'auth/code-expired') {
        throw new Error('Le code SMS a expiré. Veuillez demander un nouvel envoi.');
      }
      throw error;
    }
  },

  // Réinitialisation de mot de passe par email avec redirection personnalisée
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email.trim(), ACTION_CODE_SETTINGS);
      return { success: true };
    } catch (error) {
      console.warn('Firebase Password Reset Error:', error?.message || error);
      throw error;
    }
  },

  // Envoi de l'email de validation avec redirection personnalisée
  async sendEmailVerificationLink(user = auth.currentUser) {
    if (!user) throw new Error('Aucun utilisateur connecté');
    try {
      await sendEmailVerification(user, ACTION_CODE_SETTINGS);
      await sendAppNotification({
        userId: user.uid,
        userEmail: user.email || '',
        title: 'Lien de validation envoyé',
        message: `Un lien de validation vous a été transmis par email avec redirection vers ${ACTION_CODE_SETTINGS.url}.`,
        type: 'validation'
      });
      return { success: true };
    } catch (error) {
      console.warn('Firebase Send Verification Error:', error?.message || error);
      throw error;
    }
  },

  // Mise à jour sécurisée du mot de passe
  async updateUserPassword(newPassword) {
    if (!auth.currentUser) throw new Error('Aucun utilisateur connecté');
    try {
      await updatePassword(auth.currentUser, newPassword);
      // Notification de modification
      await sendAppNotification({
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email || '',
        title: 'Mot de passe modifié',
        message: 'Votre mot de passe a été mis à jour avec succès.',
        type: 'modification'
      });
      return { success: true };
    } catch (error) {
      console.error('Firebase Update Password Error:', error);
      throw error;
    }
  },

  // Mise à jour du profil utilisateur
  async updateUserProfile(updates) {
    const currentUser = auth.currentUser;
    const uid = currentUser?.uid || updates.id || updates.uid;
    if (!uid) throw new Error('Utilisateur introuvable');

    if (currentUser && (updates.full_name || updates.photo_url)) {
      try {
        const authUpdates = {};
        if (updates.full_name) authUpdates.displayName = updates.full_name;
        if (updates.photo_url) authUpdates.photoURL = updates.photo_url;
        await updateProfile(currentUser, authUpdates);
      } catch (e) {
        console.warn('Update Firebase Auth profile warning:', e?.message);
      }
    }

    // Persistance dans Firestore collection 'users'
    const cleanData = { 
      ...updates, 
      id: uid,
      uid,
      updated_at: new Date().toISOString() 
    };
    await firestoreService.setDocument('users', uid, cleanData);

    // Notification de modification
    await sendAppNotification({
      userId: uid,
      userEmail: cleanData.email || (currentUser?.email || ''),
      title: 'Profil mis à jour',
      message: 'Vos modifications de profil et informations personnelles ont été enregistrées avec succès.',
      type: 'modification'
    });

    return cleanData;
  },

  // Synchronisation utilisateur Firebase -> Firestore
  async syncFirebaseUserToFirestore(fbUser, extraData = {}) {
    if (!fbUser) return null;
    const uid = fbUser.uid;
    const email = fbUser.email?.toLowerCase() || '';

    let existing = await firestoreService.getDocument('users', uid);
    if (!existing) {
      // Vérifier si un document existe par email
      try {
        const usersByEmail = await firestoreService.getCollection('users', [where('email', '==', email)]);
        if (usersByEmail.length > 0) {
          existing = usersByEmail[0];
        }
      } catch (e) {
        console.warn('Check user by email notice:', e?.message);
      }
    }

    const isAdmin = email === 'storesmaxim@gmail.com' || existing?.role === 'admin';
    const userData = {
      id: uid,
      uid,
      email,
      full_name: fbUser.displayName || extraData.full_name || existing?.full_name || email.split('@')[0],
      role: isAdmin ? 'admin' : (existing?.role || 'user'),
      account_type: existing?.account_type || (isAdmin ? 'admin' : 'listener'),
      email_verified: fbUser.emailVerified || false,
      photo_url: fbUser.photoURL || extraData.photo_url || existing?.photo_url || null,
      last_login_at: new Date().toISOString(),
      created_at: existing?.created_at || new Date().toISOString(),
      ...existing,
      ...extraData,
    };

    try {
      await firestoreService.setDocument('users', uid, userData);
    } catch (e) {
      console.warn('[Firestore sync user notice]:', e?.message);
    }
    return userData;
  },

  // Écoute de l'état d'authentification
  subscribeAuthState(callback) {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          let uDoc = await firestoreService.getDocument('users', fbUser.uid);
          if (!uDoc) {
            uDoc = await firebaseAuthService.syncFirebaseUserToFirestore(fbUser);
          }
          const email = (fbUser.email || uDoc?.email || '').toLowerCase().trim();
          const isSuperAdminEmail = email === 'storesmaxim@gmail.com' || email === 'admin@kkdmusic.com';
          const verifiedRole = (isSuperAdminEmail || uDoc?.role === 'admin') ? 'admin' : (uDoc?.role || 'user');
          const verifiedAccountType = uDoc?.account_type || (verifiedRole === 'admin' ? 'admin' : 'listener');

          const verifiedUser = {
            id: fbUser.uid,
            uid: fbUser.uid,
            email: fbUser.email,
            full_name: uDoc?.full_name || fbUser.displayName || fbUser.email?.split('@')[0],
            photo_url: uDoc?.photo_url || fbUser.photoURL || null,
            email_verified: fbUser.emailVerified || false,
            phone: uDoc?.phone || '',
            city: uDoc?.city || '',
            country: uDoc?.country || 'Sénégal',
            bio: uDoc?.bio || '',
            ...uDoc,
            // Enforce verified identifiers & role
            id: fbUser.uid,
            uid: fbUser.uid,
            email: fbUser.email,
            role: verifiedRole,
            account_type: verifiedAccountType,
          };
          callback(verifiedUser);
        } catch (err) {
          console.warn('[Firebase subscribeAuthState error]:', err?.message || err);
          const email = (fbUser.email || '').toLowerCase().trim();
          const isSuperAdminEmail = email === 'storesmaxim@gmail.com' || email === 'admin@kkdmusic.com';
          callback({
            id: fbUser.uid,
            uid: fbUser.uid,
            email: fbUser.email,
            full_name: fbUser.displayName || fbUser.email?.split('@')[0],
            photo_url: fbUser.photoURL || null,
            role: isSuperAdminEmail ? 'admin' : 'user',
            account_type: isSuperAdminEmail ? 'admin' : 'listener',
          });
        }
      } else {
        callback(null);
      }
    });
  },

  // Déconnexion
  async logout() {
    try {
      await fbSignOut(auth);
    } catch (error) {
      console.error('Firebase Sign-Out Error:', error);
    }
  }
};

export const signInWithGoogle = () => firebaseAuthService.signInWithGoogle();
export const logoutFirebase = () => firebaseAuthService.logout();

// Helpers génériques pour les collections
export const firestoreService = {
  // Obtenir tous les documents d'une collection
  async getCollection(collectionName, queryConstraints = []) {
    try {
      const colRef = collection(db, collectionName);
      const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : colRef;
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn(`[Firestore getCollection ${collectionName} warning]:`, err?.message || err);
      return [];
    }
  },

  // Obtenir un document par son ID
  async getDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      return null;
    } catch (err) {
      console.warn(`[Firestore getDocument ${collectionName}/${docId} warning]:`, err?.message || err);
      return null;
    }
  },

  // Sauvegarder ou mettre à jour un document
  async setDocument(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, String(docId));
      await setDoc(docRef, { ...data, updated_at: new Date().toISOString() }, { merge: true });
      return { id: docId, ...data };
    } catch (err) {
      console.error(`[Firestore setDocument ${collectionName} error]:`, err);
      throw err;
    }
  },

  // Créer un document avec ID auto-généré
  async addDocument(collectionName, data) {
    try {
      const colRef = collection(db, collectionName);
      const res = await addDoc(colRef, { ...data, created_at: new Date().toISOString() });
      return { id: res.id, ...data };
    } catch (err) {
      console.error(`[Firestore addDocument ${collectionName} error]:`, err);
      throw err;
    }
  },

  // Supprimer un document
  async deleteDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, String(docId));
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.error(`[Firestore deleteDocument ${collectionName} error]:`, err);
      throw err;
    }
  },

  // Écoute en temps réel
  subscribeCollection(collectionName, callback, queryConstraints = []) {
    try {
      const colRef = collection(db, collectionName);
      const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : colRef;
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(items);
      }, (err) => {
        console.warn(`[Firestore subscription error ${collectionName}]:`, err?.message || err);
      });
    } catch (err) {
      console.warn(`[Firestore subscribe failed ${collectionName}]:`, err?.message || err);
      return () => {};
    }
  }
};

export default app;
