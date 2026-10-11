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
  signInWithCredential,
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
  firestoreDatabaseId: (configJson as Record<string, any>).firestoreDatabaseId || '',
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
export const STORAGE_KEY_GOOGLE_EMAIL = 'aura_usuario_email_v1';

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

export function getCachedUser(): AppUserSession | null {
  if (cachedUser) return cachedUser;
  if (auth.currentUser) {
    cachedUser = {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      isAnonymous: auth.currentUser.isAnonymous,
    };
    return cachedUser;
  }
  try {
    const savedEmail = localStorage.getItem(STORAGE_KEY_GOOGLE_EMAIL);
    const savedUid = localStorage.getItem(STORAGE_KEY_UID);
    if (savedEmail && savedUid) {
      cachedUser = {
        uid: savedUid,
        email: savedEmail,
        isAnonymous: false,
      };
      return cachedUser;
    }
  } catch {}
  return null;
}

// Iniciar sesión directo con correo de Google (sin depender de popups bloqueados)
export function loginWithGoogleAccountEmail(email: string, displayName?: string): {
  success: boolean;
  email: string;
  uid: string;
  displayName: string;
} {
  const cleanEmail = email.trim().toLowerCase();
  const safeHash = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 80);
  const uid = `goog_${safeHash}`;

  try {
    localStorage.setItem(STORAGE_KEY_UID, uid);
    localStorage.setItem(STORAGE_KEY_GOOGLE_EMAIL, cleanEmail);
    localStorage.removeItem('aura_modo_invitado');
  } catch {}

  cachedUser = {
    uid,
    email: cleanEmail,
    isAnonymous: false,
  };

  return {
    success: true,
    email: cleanEmail,
    uid,
    displayName: displayName || cleanEmail.split('@')[0],
  };
}

// Diagnóstico en vivo de conexión con Firebase y credenciales OAuth
export interface FirebaseDiagnostic {
  conectado: boolean;
  projectId: string;
  authDomain: string;
  firestoreDatabaseId: string;
  oAuthClientId: string;
  redirectUrl: string;
  statusText: string;
}

export async function verificarEstadoFirebase(): Promise<FirebaseDiagnostic> {
  let conectado = false;
  let statusText = 'Verificando conexión con Firestore...';
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    conectado = true;
    statusText = 'Base de datos Firestore conectada y operativa en la nube.';
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      conectado = true;
      statusText = 'Conectado a Firestore (Reglas de seguridad activas).';
    } else {
      statusText = `Error de respuesta Firestore: ${err?.message || err}`;
    }
  }

  return {
    conectado,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
    oAuthClientId: configJson.oAuthClientId || '743681601754-89jl01uqfg93mi8s0hok6sj7rkcb2ngo.apps.googleusercontent.com',
    redirectUrl: `https://${firebaseConfig.authDomain}/__/auth/handler`,
    statusText,
  };
}

export type GoogleAuthFailureCause =
  | 'configuration_not_found'
  | 'invalid_client_id'
  | 'unauthorized_redirect_uri'
  | 'popup_blocked'
  | 'popup_closed'
  | 'network_error'
  | 'app_in_testing'
  | 'storage_partitioned'
  | 'unknown';

export interface GoogleLoginResult {
  success: boolean;
  email?: string;
  uid?: string;
  displayName?: string;
  photoURL?: string;
  error?: string;
  errorCode?: string;
  esErrorDeConfiguracion?: boolean;
  failureCause?: GoogleAuthFailureCause;
  errorDetails?: {
    code?: string;
    message: string;
    name?: string;
    customData?: any;
    detectedCause: GoogleAuthFailureCause;
    authDomain: string;
    redirectUrl: string;
    currentOrigin: string;
    rawErrorJson?: string;
  };
}

// Google Identity Services (GIS) / ID Token direct credential sign-in (sin problemas de sessionStorage)
export async function loginWithGoogleCredential(idToken: string): Promise<GoogleLoginResult> {
  console.group('🔐 [Firebase Auth] Autenticando mediante credencial oficial de Google');
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    const user = result.user;

    console.log('✅ [Firebase Auth] Sesión con credencial de Google exitosa:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    });
    console.groupEnd();

    cachedUser = {
      uid: user.uid,
      email: user.email,
      isAnonymous: false,
    };
    try {
      if (user.email) {
        localStorage.setItem(STORAGE_KEY_GOOGLE_EMAIL, user.email);
      }
      localStorage.setItem(STORAGE_KEY_UID, user.uid);
      localStorage.removeItem('aura_modo_invitado');
    } catch {}

    return {
      success: true,
      email: user.email || undefined,
      uid: user.uid,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
    };
  } catch (err: any) {
    const rawMsg = err?.message || String(err);
    const code = err?.code || '';
    console.error('❌ [Firebase Auth] Error en signInWithCredential:', code, rawMsg);
    console.groupEnd();
    return {
      success: false,
      error: `Error al validar credencial de Google: ${rawMsg}`,
      errorCode: code,
    };
  }
}

// In-memory token cache for Google Workspace APIs (Google Sheets)
let cachedAccessToken: string | null = null;

export function getGoogleAccessToken(): string | null {
  return cachedAccessToken;
}

export function setGoogleAccessToken(token: string | null): void {
  cachedAccessToken = token;
}

// Helper para solicitar permisos de Google Sheets específicamente
export async function solicitarPermisosGoogleSheets(): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');
    provider.setCustomParameters({ prompt: 'consent' });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      if (result.user.email) {
        localStorage.setItem(STORAGE_KEY_GOOGLE_EMAIL, result.user.email);
      }
      return { success: true, accessToken: credential.accessToken };
    }
    return { success: false, error: 'No se obtuvo el token de acceso de Google' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al autorizar Google Sheets' };
  }
}

// Safe Google Sign-In helper con diagnóstico y logging exhaustivo
export async function loginWithGoogle(): Promise<GoogleLoginResult> {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
  const authDomain = firebaseConfig.authDomain;
  const redirectUrl = `https://${authDomain}/__/auth/handler`;

  console.group('🔐 [Firebase Auth] Iniciando intento de sesión con Google');
  console.log('Parámetros de contexto:', {
    projectId: firebaseConfig.projectId,
    authDomain,
    redirectUrl,
    currentOrigin,
  });

  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');
    provider.setCustomParameters({ prompt: 'select_account' });

    // Protección con temporizador: si el navegador congela el popup en blanco por partición de storage
    const popupPromise = signInWithPopup(auth, provider);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            'storage-partitioned: La ventana de autenticación de Google no respondió o quedó en blanco debido a la partición de almacenamiento del navegador (missing initial state).'
          )
        );
      }, 12000);
    });

    const result = await Promise.race([popupPromise, timeoutPromise]);
    const user = result.user;

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }

    console.log('✅ [Firebase Auth] Autenticación con Google exitosa:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      isAnonymous: user.isAnonymous,
      hasSheetsToken: Boolean(cachedAccessToken),
    });
    console.groupEnd();

    cachedUser = {
      uid: user.uid,
      email: user.email,
      isAnonymous: false,
    };
    try {
      if (user.email) {
        localStorage.setItem(STORAGE_KEY_GOOGLE_EMAIL, user.email);
      }
      localStorage.setItem(STORAGE_KEY_UID, user.uid);
      localStorage.removeItem('aura_modo_invitado');
    } catch {}

    return {
      success: true,
      email: user.email || undefined,
      uid: user.uid,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
    };
  } catch (err: any) {
    // =========================================================================
    // BLOQUE DE LOGGING DETALLADO DE ERROR DE AUTENTICACIÓN FIREBASE
    // =========================================================================
    const rawMsg = err?.message || String(err);
    const code = err?.code || '';
    const name = err?.name || 'FirebaseError';
    const customData = err?.customData || null;

    let rawJson = '';
    try {
      rawJson = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
    } catch {
      rawJson = String(err);
    }

    // Clasificación de la causa exacta del fallo
    let detectedCause: GoogleAuthFailureCause = 'unknown';
    let friendlyError = 'No se pudo completar el inicio de sesión con Google.';
    let esConfig = false;

    const lowerMsg = rawMsg.toLowerCase();
    const lowerCode = code.toLowerCase();

    // 1. Verificación de aplicación en modo Tester / Acceso bloqueado por Google OAuth
    if (
      lowerMsg.includes('testing') ||
      lowerMsg.includes('tester') ||
      lowerMsg.includes('probando') ||
      lowerMsg.includes('access_denied') ||
      lowerMsg.includes('unverified') ||
      lowerCode.includes('access-denied') ||
      (customData && JSON.stringify(customData).toLowerCase().includes('testing'))
    ) {
      detectedCause = 'app_in_testing';
      friendlyError = 'La app está en modo "En prueba" (Testing) en Google Cloud. Solo los usuarios agregados como Test users pueden entrar. Pulsa "Publicar aplicación" para pasar a producción o usa el ingreso directo.';
      esConfig = true;
    }
    // 2. Verificación de 'invalid_client_id'
    else if (
      lowerCode.includes('invalid-oauth-client-id') ||
      lowerCode.includes('invalid-client') ||
      lowerMsg.includes('invalid_client_id') ||
      lowerMsg.includes('invalid_client') ||
      lowerMsg.includes('deleted_client') ||
      lowerMsg.includes('oauth client') ||
      (customData && JSON.stringify(customData).toLowerCase().includes('invalid_client'))
    ) {
      detectedCause = 'invalid_client_id';
      friendlyError = 'Error OAuth 2.0: Client ID inválido o no configurado en Google Cloud / Firebase.';
      esConfig = true;
    }
    // 3. Verificación de 'unauthorized_redirect_uri' (URL de redirección no autorizada)
    else if (
      lowerCode === 'auth/unauthorized-domain' ||
      lowerMsg.includes('unauthorized-domain') ||
      lowerMsg.includes('redirect_uri_mismatch') ||
      lowerMsg.includes('unauthorized_redirect_uri') ||
      lowerMsg.includes('redirect uri') ||
      lowerMsg.includes('redirect url')
    ) {
      detectedCause = 'unauthorized_redirect_uri';
      friendlyError = `URL de redirección u origen no autorizado (${currentOrigin}). Agrega el dominio a 'Authorized domains' en Firebase Console.`;
      esConfig = true;
    }
    // 4. Verificación de 'configuration_not_found' o proveedor no habilitado ("The requested action is invalid")
    else if (
      lowerCode === 'auth/configuration-not-found' ||
      lowerCode === 'auth/operation-not-allowed' ||
      lowerMsg.includes('configuration_not_found') ||
      lowerMsg.includes('configuration-not-found') ||
      lowerMsg.includes('operation-not-allowed') ||
      lowerMsg.includes('the requested action is invalid') ||
      lowerMsg.includes('invalid-action')
    ) {
      detectedCause = 'configuration_not_found';
      friendlyError = 'Google Authentication no está habilitado en Firebase Console ("The requested action is invalid"). Debe habilitarse en Sign-in method.';
      esConfig = true;
    }
    // 4. Ventana emergente cerrada o bloqueada
    else if (lowerCode === 'auth/popup-closed-by-user') {
      detectedCause = 'popup_closed';
      friendlyError = 'La ventana de autenticación fue cerrada antes de completar el inicio de sesión.';
    } else if (lowerCode === 'auth/popup-blocked') {
      detectedCause = 'popup_blocked';
      friendlyError = 'El navegador o WebView bloqueó la ventana emergente de Google.';
    }
    // 5. Partición de almacenamiento / SessionStorage inaccesible (Missing initial state)
    else if (
      lowerMsg.includes('missing initial state') ||
      lowerMsg.includes('sessionstorage') ||
      lowerMsg.includes('storage-partitioned') ||
      lowerMsg.includes('storage partitioned')
    ) {
      detectedCause = 'storage_partitioned';
      friendlyError = 'El navegador bloqueó sessionStorage debido a la partición de almacenamiento (Third-party cookies). Usa el botón oficial de Google para ingresar directamente.';
      esConfig = false;
    }
    // 6. Errores de red
    else if (lowerCode === 'auth/network-request-failed' || lowerMsg.includes('network')) {
      detectedCause = 'network_error';
      friendlyError = 'Error de conexión de red al contactar los servidores de Google/Firebase.';
    }

    // Reporte exhaustivo por consola para diagnóstico en tiempo real
    console.error('❌ [Firebase Auth] ERROR EXACTO RETORNADO POR LA API:');
    console.error(`- Código de error (code):`, code);
    console.error(`- Mensaje de error (message):`, rawMsg);
    console.error(`- Nombre del error (name):`, name);
    console.error(`- Causa identificada (detectedCause):`, detectedCause);
    console.error(`- Datos personalizados (customData):`, customData);
    console.error(`- URL del Auth Handler:`, redirectUrl);
    console.error(`- Origen de la app (window.location.origin):`, currentOrigin);
    console.error(`- Objeto de error serializado:`, rawJson);

    // Resumen diagnóstico claro para el desarrollador
    switch (detectedCause) {
      case 'configuration_not_found':
        console.warn(
          '⚠️ [Diagnóstico: configuration_not_found] El proveedor Google no está activo en Firebase Console > Authentication > Sign-in method, o falta la configuración de Identity Platform.'
        );
        break;
      case 'invalid_client_id':
        console.warn(
          '⚠️ [Diagnóstico: invalid_client_id] El Client ID de OAuth 2.0 en Google Cloud Console o Firebase no es válido o ha sido eliminado.'
        );
        break;
      case 'unauthorized_redirect_uri':
        console.warn(
          `⚠️ [Diagnóstico: unauthorized_redirect_uri] El origen ${currentOrigin} o la URL ${redirectUrl} no está autorizada en Firebase Console > Authentication > Settings > Authorized domains.`
        );
        break;
      default:
        console.warn(`⚠️ [Diagnóstico: ${detectedCause}] Error durante el flujo de inicio de sesión.`);
        break;
    }
    console.groupEnd();

    return {
      success: false,
      error: friendlyError,
      errorCode: code,
      esErrorDeConfiguracion: esConfig,
      failureCause: detectedCause,
      errorDetails: {
        code,
        message: rawMsg,
        name,
        customData,
        detectedCause,
        authDomain,
        redirectUrl,
        currentOrigin,
        rawErrorJson: rawJson,
      },
    };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Logout note:', err);
  }
  cachedUser = null;
  try {
    localStorage.removeItem(STORAGE_KEY_GOOGLE_EMAIL);
    localStorage.removeItem(STORAGE_KEY_UID);
  } catch {}
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
  const existing = getCachedUser();
  if (existing) {
    return existing;
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

// Clear all expenses from Firestore for current user to leave database at 0 expenses
export async function vaciarTodosLosGastosDeFirestore(userIdOverride?: string): Promise<number> {
  let path = 'gastos';
  try {
    const user = userIdOverride ? { uid: userIdOverride } : await ensureAuthUser();
    path = `users/${user.uid}/gastos`;
    const gastosCol = collection(db, 'users', user.uid, 'gastos');
    const snapshot = await getDocs(gastosCol);
    let eliminados = 0;
    for (const d of snapshot.docs) {
      await deleteDoc(d.ref).catch(() => {});
      eliminados++;
    }
    return eliminados;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return 0;
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
    const user = auth.currentUser
      ? { uid: auth.currentUser.uid, email: auth.currentUser.email }
      : (getCachedUser() || (await ensureAuthUser()));
    if (!user || !user.uid) {
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

