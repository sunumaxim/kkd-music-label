// KKD Music — Client Firebase Firestore & Authentication
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
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

// Opérations d'authentification
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Firebase Google Sign-In Error:', error);
    throw error;
  }
};

export const logoutFirebase = async () => {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('Firebase Sign-Out Error:', error);
    throw error;
  }
};

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
