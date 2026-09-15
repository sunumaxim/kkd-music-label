// KKD Music — Client Firebase Firestore & Authentication
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
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

// Initialisation unique de Firebase
const app = initializeApp(firebaseConfig);

// Initialisation de Firestore avec l'ID de base de données dédié
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Opérations d'authentification renforcées
export const firebaseAuthService = {
  // Connexion Google
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      return await this.syncFirebaseUserToFirestore(fbUser);
    } catch (error) {
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
      return await this.syncFirebaseUserToFirestore(cred.user, { full_name: fullName });
    } catch (error) {
      console.warn('Firebase Register Error:', error?.message || error);
      throw error;
    }
  },

  // Réinitialisation de mot de passe par email
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (error) {
      console.warn('Firebase Password Reset Error:', error?.message || error);
      throw error;
    }
  },

  // Mise à jour sécurisée du mot de passe
  async updateUserPassword(newPassword) {
    if (!auth.currentUser) throw new Error('Aucun utilisateur connecté');
    try {
      await updatePassword(auth.currentUser, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Firebase Update Password Error:', error);
      throw error;
    }
  },

  // Mise à jour du profil utilisateur
  async updateUserProfile(updates) {
    const currentUser = auth.currentUser;
    const uid = currentUser?.uid || updates.id;
    if (!uid) throw new Error('Utilisateur introuvable');

    if (currentUser && updates.full_name) {
      try {
        await updateProfile(currentUser, { displayName: updates.full_name });
      } catch (e) {
        console.warn('Update displayName warning:', e?.message);
      }
    }

    // Persistance dans Firestore collection 'users'
    const cleanData = { ...updates, updated_at: new Date().toISOString() };
    await firestoreService.setDocument('users', uid, cleanData);
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
      const usersByEmail = await firestoreService.getCollection('users', [where('email', '==', email)]);
      if (usersByEmail.length > 0) {
        existing = usersByEmail[0];
      }
    }

    const isAdmin = email === 'storesmaxim@gmail.com' || existing?.role === 'admin';
    const userData = {
      id: uid,
      uid,
      email,
      full_name: fbUser.displayName || existing?.full_name || extraData.full_name || email.split('@')[0],
      role: isAdmin ? 'admin' : (existing?.role || 'user'),
      account_type: existing?.account_type || (isAdmin ? 'admin' : 'listener'),
      email_verified: fbUser.emailVerified || false,
      photo_url: fbUser.photoURL || existing?.photo_url || null,
      last_login_at: new Date().toISOString(),
      created_at: existing?.created_at || new Date().toISOString(),
      ...existing,
      ...extraData,
    };

    await firestoreService.setDocument('users', uid, userData);
    return userData;
  },

  // Écoute de l'état d'authentification
  subscribeAuthState(callback) {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const uDoc = await firestoreService.getDocument('users', fbUser.uid);
          callback(uDoc || {
            id: fbUser.uid,
            email: fbUser.email,
            full_name: fbUser.displayName || fbUser.email?.split('@')[0],
            role: fbUser.email === 'storesmaxim@gmail.com' ? 'admin' : 'user'
          });
        } catch {
          callback({
            id: fbUser.uid,
            email: fbUser.email,
            full_name: fbUser.displayName || fbUser.email?.split('@')[0],
            role: fbUser.email === 'storesmaxim@gmail.com' ? 'admin' : 'user'
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
