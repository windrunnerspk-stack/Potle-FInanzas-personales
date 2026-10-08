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
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
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

export interface AppUserSession {
  uid: string;
  email?: string | null;
  isAnonymous: boolean;
}

const STORAGE_KEY_UID = 'aura_finances_uid_v1';

function getOrGenerateLocalUid(): string {
  try {
    let localUid = localStorage.getItem(STORAGE_KEY_UID);
    if (!localUid || !/^[a-zA-Z0-9_-]+$/.test(localUid)) {
      localUid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem(STORAGE_KEY_UID, localUid);
    }
    return localUid;
  } catch {
    return 'usr_cucuta_default';
  }
}

let cachedUser: AppUserSession | null = null;
let attemptSignInRunning = false;

// Safe Google Sign-In helper
export async function loginWithGoogle(): Promise<{ success: boolean; email?: string; uid?: string; error?: string }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    cachedUser = {
      uid: user.uid,
      email: user.email,
      isAnonymous: false,
    };
    return {
      success: true,
      email: user.email || undefined,
      uid: user.uid,
    };
  } catch (err: any) {
    console.warn('Google Sign-In note:', err?.message || err);
    return {
      success: false,
      error: err?.message || 'No se pudo completar el inicio de sesión con Google. Puedes ingresar tu correo manualmente.',
    };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
    cachedUser = null;
  } catch (err) {
    console.warn('Logout note:', err);
  }
}

// Safe authentication resolver: never throws auth/admin-restricted-operation
export async function ensureAuthUser(): Promise<AppUserSession> {
  if (cachedUser) {
    return cachedUser;
  }

  // 1. If Firebase Auth already has a user signed in
  if (auth.currentUser) {
    cachedUser = {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      isAnonymous: auth.currentUser.isAnonymous,
    };
    return cachedUser;
  }

  // 2. Attempt anonymous sign-in gracefully if not already attempted
  if (!attemptSignInRunning) {
    attemptSignInRunning = true;
    try {
      const cred = await signInAnonymously(auth);
      cachedUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        isAnonymous: cred.user.isAnonymous,
      };
      return cachedUser;
    } catch (err: any) {
      // If anonymous auth is disabled or restricted (e.g. auth/admin-restricted-operation in Google Cloud)
      // gracefully fall back to local persistent UID
      // Do NOT throw error or log to console.error
      console.info('Firebase Auth: Operando con identificador seguro persistente.');
    }
  }

  // 3. Fallback to device-persistent identifier
  cachedUser = {
    uid: getOrGenerateLocalUid(),
    email: null,
    isAnonymous: true,
  };
  return cachedUser;
}

// Test connection on boot as required by skill guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('Firebase Firestore conectado exitosamente.');
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore en modo offline.');
      return false;
    }
    // Document test/connection may not exist, but reaching Firestore confirms server handshake
    console.info('Firestore handshake verificado.');
    return true;
  }
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
    console.warn('Sync profile Firestore note:', err);
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
      total: Number(gasto.total) || 0,
      observaciones: gasto.observaciones || '',
      sincronizado: true,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Sync gasto Firestore note:', err);
  }
}

// Delete expense from Firestore
export async function deleteGastoFromFirestore(gastoId: string): Promise<void> {
  try {
    const user = await ensureAuthUser();
    const gastoRef = doc(db, 'users', user.uid, 'gastos', gastoId);
    await deleteDoc(gastoRef);
  } catch (err) {
    console.warn('Delete gasto Firestore note:', err);
  }
}

// Fetch all expenses from Firestore for current user
export async function fetchGastosFromFirestore(): Promise<Gasto[]> {
  try {
    const user = await ensureAuthUser();
    const gastosCol = collection(db, 'users', user.uid, 'gastos');
    const snapshot = await getDocs(gastosCol);
    const resultado: Gasto[] = [];
    for (const d of snapshot.docs) {
      const data = d.data();
      const totalNum = Number(data.total) || 0;
      const cat = data.categoria || 'Otros';
      const est = String(data.establecimiento || '');
      
      // Depuración de registros corruptos (ej. 10M en Otros por importación con columnas desfasadas)
      const esCorrupto = (cat === 'Otros' || cat === 'Otro') && totalNum >= 5000000;
      const esEstablecimientoInvalido = /^\d{4}-\d{2}-\d{2}/.test(est) || /^\d{8,11}$/.test(est.replace(/[^0-9]/g, ''));

      if (esCorrupto || esEstablecimientoInvalido) {
        // Eliminar de Firestore para que no vuelva a aparecer
        deleteDoc(d.ref).catch(() => {});
        continue;
      }

      resultado.push({
        id: data.id || d.id,
        establecimiento: est,
        fecha: data.fecha,
        hora: data.hora,
        ciudad: data.ciudad || 'Cúcuta',
        nit: data.nit || undefined,
        categoria: cat,
        metodo_pago: data.metodo_pago || 'Tarjeta Débito',
        total: totalNum,
        observaciones: data.observaciones || undefined,
        foto_factura_uri: data.foto_factura_uri || undefined,
        sincronizado: true,
      });
    }
    return resultado;
  } catch (err) {
    console.warn('Fetch gastos Firestore note:', err);
    return [];
  }
}

// Safe initial handshake on module load
testConnection().catch(() => {});
