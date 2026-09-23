import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile, 
  sendPasswordResetEmail,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  deleteDoc, 
  writeBatch,
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { ProductionJob, Client, AppConfig } from './types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without this line
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

/**
 * Normaliza nombre de usuario para Firebase Auth:
 * Si el usuario introduce 'operador1' o 'taller', se convierte internamente a
 * 'operador1@mebestudio.com' para compatibilidad total con Firebase Email/Password Auth.
 */
export function normalizeUserToEmail(usernameOrEmail: string): string {
  const trimmed = (usernameOrEmail || '').trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  const safeUser = trimmed.replace(/[^a-z0-9._-]/g, '');
  return `${safeUser || 'operador'}@mebestudio.com`;
}

export function extractUsernameFromEmail(emailOrUser?: string | null): string {
  if (!emailOrUser) return 'Operador MEB';
  if (emailOrUser.endsWith('@mebestudio.com')) {
    return emailOrUser.replace('@mebestudio.com', '');
  }
  return emailOrUser.split('@')[0];
}

/**
 * Iniciar sesión con usuario o correo y contraseña en Firebase Auth
 */
export async function loginWithEmailOrUser(usernameOrEmail: string, pass: string): Promise<User> {
  const email = normalizeUserToEmail(usernameOrEmail);
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

/**
 * Registrar nuevo operador / usuario con contraseña en Firebase Auth
 */
export async function registerWithEmailOrUser(
  usernameOrEmail: string, 
  pass: string, 
  displayName?: string
): Promise<User> {
  const email = normalizeUserToEmail(usernameOrEmail);
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const name = displayName?.trim() || extractUsernameFromEmail(email);
  if (cred.user) {
    try {
      await updateProfile(cred.user, { displayName: name });
    } catch (e) {
      console.warn('No se pudo guardar el displayName:', e);
    }
  }
  return cred.user;
}

/**
 * Cerrar sesión en Firebase Auth
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Enviar restablecimiento de contraseña
 */
export async function resetUserPassword(usernameOrEmail: string): Promise<void> {
  const email = normalizeUserToEmail(usernameOrEmail);
  await sendPasswordResetEmail(auth, email);
}

/**
 * Suscribirse a cambios en el estado de autenticación
 */
export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Test connection on boot as mandated by skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'config', 'connection_test'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client is currently offline or connecting:", error.message);
    }
    return false;
  }
}

// Error handling mandated by skill
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Cloud Backup Interface
export interface CloudBackup {
  id: string;
  timestamp: string;
  label: string;
  operador: string;
  totalJobs: number;
  totalClients: number;
  jobs: ProductionJob[];
  clients: Client[];
  config: AppConfig;
}

export interface CloudBackupMeta {
  id: string;
  timestamp: string;
  label: string;
  operador: string;
  totalJobs: number;
  totalClients: number;
}

// --- Jobs Cloud Sync ---
export async function syncJobToCloud(job: ProductionJob): Promise<void> {
  const path = `jobs/${job.id}`;
  try {
    await setDoc(doc(db, 'jobs', job.id), job);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteJobFromCloud(jobId: string): Promise<void> {
  const path = `jobs/${jobId}`;
  try {
    await deleteDoc(doc(db, 'jobs', jobId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- Clients Cloud Sync ---
export async function syncClientToCloud(client: Client): Promise<void> {
  const path = `clients/${client.id}`;
  try {
    await setDoc(doc(db, 'clients', client.id), client);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteClientFromCloud(clientId: string): Promise<void> {
  const path = `clients/${clientId}`;
  try {
    await deleteDoc(doc(db, 'clients', clientId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- Config Cloud Sync ---
export async function syncConfigToCloud(config: AppConfig): Promise<void> {
  const path = 'config/global';
  try {
    await setDoc(doc(db, 'config', 'global'), {
      ...config,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// --- Full Cloud Sync (Push all local data to Firebase) ---
export async function pushAllToCloud(
  jobs: ProductionJob[], 
  clients: Client[], 
  config: AppConfig
): Promise<{ success: boolean; countJobs: number; countClients: number }> {
  try {
    const batch = writeBatch(db);

    // Save config
    const configRef = doc(db, 'config', 'global');
    batch.set(configRef, { ...config, updatedAt: new Date().toISOString() });

    // Save jobs (up to 200 per batch safely)
    for (const job of jobs) {
      const jobRef = doc(db, 'jobs', job.id);
      batch.set(jobRef, job);
    }

    // Save clients
    for (const client of clients) {
      const clientRef = doc(db, 'clients', client.id);
      batch.set(clientRef, client);
    }

    await batch.commit();
    return { success: true, countJobs: jobs.length, countClients: clients.length };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'batch-sync');
  }
}

// --- Pull Data from Cloud (Fetch all remote data) ---
export async function pullAllFromCloud(): Promise<{
  jobs: ProductionJob[];
  clients: Client[];
  config: AppConfig | null;
}> {
  try {
    // 1. Fetch Config
    const configSnap = await getDoc(doc(db, 'config', 'global'));
    let config: AppConfig | null = null;
    if (configSnap.exists()) {
      config = configSnap.data() as AppConfig;
    }

    // 2. Fetch Jobs
    const jobsSnap = await getDocs(collection(db, 'jobs'));
    const jobs: ProductionJob[] = [];
    jobsSnap.forEach((d) => {
      jobs.push(d.data() as ProductionJob);
    });

    // 3. Fetch Clients
    const clientsSnap = await getDocs(collection(db, 'clients'));
    const clients: Client[] = [];
    clientsSnap.forEach((d) => {
      clients.push(d.data() as Client);
    });

    return { jobs, clients, config };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'pull-all');
  }
}

// --- Cloud Backups Engine ---
export async function createCloudBackup(
  jobs: ProductionJob[],
  clients: Client[],
  config: AppConfig,
  operatorName: string,
  label?: string
): Promise<CloudBackup> {
  const timestamp = new Date().toISOString();
  const dateFormatted = timestamp.replace(/[:.]/g, '-');
  const backupId = `backup-${dateFormatted}`;
  
  const backupData: CloudBackup = {
    id: backupId,
    timestamp,
    label: label?.trim() || `Copia de seguridad en la nube (${new Date().toLocaleDateString('es-ES')})`,
    operador: operatorName || 'Operador MEB',
    totalJobs: jobs.length,
    totalClients: clients.length,
    jobs,
    clients,
    config
  };

  const path = `backups/${backupId}`;
  try {
    await setDoc(doc(db, 'backups', backupId), backupData);
    return backupData;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function listCloudBackups(): Promise<CloudBackupMeta[]> {
  const path = 'backups';
  try {
    const snap = await getDocs(collection(db, 'backups'));
    const backups: CloudBackupMeta[] = [];
    snap.forEach((d) => {
      const data = d.data();
      backups.push({
        id: data.id || d.id,
        timestamp: data.timestamp,
        label: data.label,
        operador: data.operador,
        totalJobs: data.totalJobs || (data.jobs ? data.jobs.length : 0),
        totalClients: data.totalClients || (data.clients ? data.clients.length : 0),
      });
    });
    // Ordenar de más reciente a más antiguo
    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function restoreCloudBackupById(backupId: string): Promise<CloudBackup> {
  const path = `backups/${backupId}`;
  try {
    const snap = await getDoc(doc(db, 'backups', backupId));
    if (!snap.exists()) {
      throw new Error(`El backup con ID ${backupId} no existe en Firebase.`);
    }
    return snap.data() as CloudBackup;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function deleteCloudBackupById(backupId: string): Promise<void> {
  const path = `backups/${backupId}`;
  try {
    await deleteDoc(doc(db, 'backups', backupId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
