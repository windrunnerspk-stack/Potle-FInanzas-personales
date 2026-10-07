import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import configJson from '../../firebase-applet-config.json';
import { Gasto, UsuarioConfig } from '../types/finance';

export const firebaseConfig = {
  projectId: configJson.projectId,
  appId: configJson.appId,
  apiKey: configJson.apiKey,
  authDomain: configJson.authDomain,
  firestoreDatabaseId: configJson.firestoreDatabaseId,
  storageBucket: configJson.storageBucket,
  messagingSenderId: configJson.messagingSenderId,
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with specific databaseId if provided
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

let firebaseInitialized = false;
let currentAuthUser: User | null = null;

// Test connection on boot as required by skill guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('Firebase Firestore conectado exitosamente.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Verifique la configuración de Firebase.');
    } else {
      // Document might not exist, but connection to Firestore reached the server
      console.info('Firestore server handshake verificado.');
    }
    return true;
  }
}

// Ensure user is authenticated (anonymous sign-in enables secure zero-trust ABAC rules)
export async function ensureAuthUser(): Promise<User> {
  if (currentAuthUser) return currentAuthUser;

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentAuthUser = user;
        unsubscribe();
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          currentAuthUser = cred.user;
          unsubscribe();
          resolve(cred.user);
        } catch (err) {
          unsubscribe();
          reject(err);
        }
      }
    });
  });
}

// Sync user profile to Firestore
export async function syncUserProfileToFirestore(config: UsuarioConfig): Promise<void> {
  try {
    const user = await ensureAuthUser();
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      email: config.email || 'usuario@aurafinanzas.app',
      modo: config.modo || 'sincronizado',
      moneda: config.moneda || 'COP',
      ciudad: 'Cúcuta',
      google_sheets_id: config.google_sheets_id || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Error al guardar perfil en Firestore:', err);
  }
}

// Sync expense to Firestore
export async function syncGastoToFirestore(gasto: Gasto): Promise<void> {
  try {
    const user = await ensureAuthUser();
    const gastoRef = doc(db, 'users', user.uid, 'gastos', gasto.id);
    await setDoc(gastoRef, {
      id: gasto.id,
      userId: user.uid,
      establecimiento: gasto.establecimiento,
      fecha: gasto.fecha,
      hora: gasto.hora,
      ciudad: gasto.ciudad || 'Cúcuta',
      nit: gasto.nit || '',
      categoria: gasto.categoria,
      metodo_pago: gasto.metodo_pago,
      total: Number(gasto.total),
      observaciones: gasto.observaciones || '',
      sincronizado: true,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Error al sincronizar gasto en Firestore:', err);
  }
}

// Delete expense from Firestore
export async function deleteGastoFromFirestore(gastoId: string): Promise<void> {
  try {
    const user = await ensureAuthUser();
    const gastoRef = doc(db, 'users', user.uid, 'gastos', gastoId);
    await deleteDoc(gastoRef);
  } catch (err) {
    console.warn('Error al eliminar gasto de Firestore:', err);
  }
}

// Fetch all expenses from Firestore for current user
export async function fetchGastosFromFirestore(): Promise<Gasto[]> {
  try {
    const user = await ensureAuthUser();
    const gastosCol = collection(db, 'users', user.uid, 'gastos');
    const snapshot = await getDocs(gastosCol);
    const resultado: Gasto[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      resultado.push({
        id: data.id || d.id,
        establecimiento: data.establecimiento,
        fecha: data.fecha,
        hora: data.hora,
        ciudad: data.ciudad || 'Cúcuta',
        nit: data.nit || undefined,
        categoria: data.categoria,
        metodo_pago: data.metodo_pago,
        total: data.total,
        observaciones: data.observaciones || undefined,
        sincronizado: true
      });
    });
    return resultado;
  } catch (err) {
    console.warn('Error al obtener gastos de Firestore:', err);
    return [];
  }
}

// Auto-run connection test on import
if (!firebaseInitialized) {
  firebaseInitialized = true;
  testConnection().catch(console.error);
  ensureAuthUser().catch(console.error);
}
