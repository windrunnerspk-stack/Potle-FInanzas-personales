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

export { onAuthStateChanged };
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
export async function loginWithGoogle(): Promise<{
  success: boolean;
  email?: string;
  uid?: string;
  displayName?: string;
  photoURL?: string;
  error?: string;
}> {
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
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
    };
  } catch (err: any) {
    console.warn('Google Sign-In note:', err?.message || err);
    return {
      success: false,
      error: err?.message || 'No se pudo completar el inicio de sesión con Google. Puedes intentar nuevamente o entrar como invitado.',
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

// Error handling conforming to Firebase skill guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error Context:', JSON.stringify(errInfo));
  return errInfo;
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
    } catch {
      // Fall back to device-persistent identifier without throwing
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
    return true;
  } catch {
    // Graceful offline operation
    return false;
  }
}

// Sync user profile to Firestore
export async function syncUserProfileToFirestore(config: UsuarioConfig, userIdOverride?: string): Promise<void> {
  const path = 'users';
  try {
    const user = userIdOverride ? { uid: userIdOverride } : await ensureAuthUser();
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      email: config.email || auth.currentUser?.email || 'usuario@aurafinanzas.app',
      modo: config.modo || 'sincronizado',
      moneda: config.moneda || 'COP',
      ciudad: 'Cúcuta',
      google_sheets_id: config.google_sheets_id || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Sync expense to Firestore
export async function syncGastoToFirestore(gasto: Gasto, userIdOverride?: string): Promise<void> {
  let path = 'gastos';
  try {
    const user = userIdOverride ? { uid: userIdOverride } : await ensureAuthUser();
    path = `users/${user.uid}/gastos/${gasto.id}`;
    const gastoRef = doc(db, 'users', user.uid, 'gastos', gasto.id);
    await setDoc(gastoRef, {
      id: String(gasto.id),
      userId: user.uid,
      establecimiento: (gasto.establecimiento || 'Factura General').trim(),
      fecha: gasto.fecha || new Date().toISOString().split('T')[0],
      hora: gasto.hora || '12:00',
      ciudad: gasto.ciudad || 'Bogotá',
      nit: gasto.nit || '',
      categoria: gasto.categoria || 'Otros',
      metodo_pago: gasto.metodo_pago || 'Tarjeta Débito',
      total: Number(gasto.total) >= 0 ? Number(gasto.total) : 0,
      observaciones: gasto.observaciones || '',
      sincronizado: true,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Delete expense from Firestore
export async function deleteGastoFromFirestore(gastoId: string, userIdOverride?: string): Promise<void> {
  let path = 'gastos';
  try {
    const user = userIdOverride ? { uid: userIdOverride } : await ensureAuthUser();
    path = `users/${user.uid}/gastos/${gastoId}`;
    const gastoRef = doc(db, 'users', user.uid, 'gastos', gastoId);
    await deleteDoc(gastoRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Fetch all expenses from Firestore for current user
export async function fetchGastosFromFirestore(userIdOverride?: string): Promise<Gasto[]> {
  let path = 'gastos';
  try {
    const user = userIdOverride ? { uid: userIdOverride } : await ensureAuthUser();
    path = `users/${user.uid}/gastos`;
    const gastosCol = collection(db, 'users', user.uid, 'gastos');
    const snapshot = await getDocs(gastosCol);
    const resultado: Gasto[] = [];
    for (const d of snapshot.docs) {
      const data = d.data();
      const totalNum = Number(data.total) || 0;
      const cat = data.categoria || 'Otros';
      const est = String(data.establecimiento || '');
      
      const esCorrupto = (cat === 'Otros' || cat === 'Otro') && totalNum >= 5000000;
      const esEstablecimientoInvalido = /^\d{4}-\d{2}-\d{2}/.test(est) || /^\d{8,11}$/.test(est.replace(/[^0-9]/g, ''));

      if (esCorrupto || esEstablecimientoInvalido) {
        deleteDoc(d.ref).catch(() => {});
        continue;
      }

      resultado.push({
        id: data.id || d.id,
        establecimiento: est,
        fecha: data.fecha,
        hora: data.hora || '12:00',
        ciudad: data.ciudad || 'Bogotá',
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
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

// Sincronización bidireccional automática y migración hacia cuenta de Google
export async function sincronizarTodoConGoogle(
  gastosLocales: Gasto[],
  config: UsuarioConfig
): Promise<{ gastos: Gasto[]; totalSubidos: number; totalDescargados: number }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { gastos: gastosLocales, totalSubidos: 0, totalDescargados: 0 };
    }
    const uid = user.uid;

    // 1. Sincronizar perfil en users/{uid}
    await syncUserProfileToFirestore(config, uid);

    // 2. Obtener gastos remotos existentes en users/{uid}/gastos
    const gastosRemotos = await fetchGastosFromFirestore(uid);
    const mapaRemoto = new Map<string, Gasto>();
    gastosRemotos.forEach((g) => mapaRemoto.set(g.id, g));

    // 3. Subir todos los gastos locales a Firestore en su cuenta Google
    let subidos = 0;
    for (const g of gastosLocales) {
      if (!mapaRemoto.has(g.id)) {
        await syncGastoToFirestore(g, uid);
        subidos++;
      }
    }

    // 4. Descargar los que estén en remoto y no en local
    const mapaLocal = new Map<string, Gasto>();
    gastosLocales.forEach((g) => mapaLocal.set(g.id, g));

    let descargados = 0;
    const combinados = [...gastosLocales];
    for (const r of gastosRemotos) {
      if (!mapaLocal.has(r.id)) {
        combinados.unshift(r);
        descargados++;
      }
    }

    return { gastos: combinados, totalSubidos: subidos, totalDescargados: descargados };
  } catch (err) {
    console.warn('Sync Todo con Google note:', err);
    return { gastos: gastosLocales, totalSubidos: 0, totalDescargados: 0 };
  }
}

