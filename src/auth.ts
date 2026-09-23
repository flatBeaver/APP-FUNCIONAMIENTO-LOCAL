import { AuthUser, StoredUserAccount } from './types';
import { 
  loginWithEmailOrUser, 
  registerWithEmailOrUser, 
  logoutUser as firebaseLogout, 
  resetUserPassword as firebaseReset,
  extractUsernameFromEmail 
} from './firebase';

const STORAGE_USERS_KEY = 'meb_registered_users_v1';
const STORAGE_CURRENT_USER_KEY = 'meb_current_auth_user_v1';

export const ADMIN_USERNAME = 'lauti';
export const ADMIN_PASSWORD = 'seven';

/**
 * Carga la lista de usuarios registrados en el sistema
 */
export function getStoredUsers(): StoredUserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error leyendo usuarios de localStorage:', e);
  }

  // Cuentas por defecto si es la primera vez
  const defaultAccounts: StoredUserAccount[] = [
    {
      username: ADMIN_USERNAME,
      displayName: 'Lauti',
      passwordHash: ADMIN_PASSWORD,
      role: 'admin',
      email: 'lauti@mebestudio.com',
      securityAnswer: 'taller meb',
      createdAt: new Date().toISOString(),
    },
    {
      username: 'operador1',
      displayName: 'Operador Taller',
      passwordHash: 'taller123',
      role: 'user',
      email: 'operador1@mebestudio.com',
      securityAnswer: 'taller',
      createdAt: new Date().toISOString(),
    }
  ];

  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(defaultAccounts));
  } catch (e) {}

  return defaultAccounts;
}

/**
 * Guarda la lista de usuarios en almacenamiento local
 */
export function saveStoredUsers(users: StoredUserAccount[]): void {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error guardando usuarios en almacenamiento local:', e);
  }
}

/**
 * Obtiene el usuario actualmente conectado
 */
export function getCurrentAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (raw) {
      const user = JSON.parse(raw) as AuthUser;
      // Re-verificar permiso de admin: solo 'lauti' con credenciales admin
      if (user.username.toLowerCase() === ADMIN_USERNAME) {
        user.role = 'admin';
        user.isAdmin = true;
      } else {
        user.role = 'user';
        user.isAdmin = false;
      }
      return user;
    }
  } catch (e) {
    console.warn('Error leyendo usuario actual:', e);
  }
  return null;
}

/**
 * Guarda el usuario activo en sesión
 */
export function setCurrentAuthUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error('Error guardando sesión de usuario:', e);
  }
}

/**
 * Inicia sesión en el sistema.
 * Soporta credenciales maestras de Admin ('lauti'/'seven'),
 * usuarios locales registrados, y conexión opcional a Firebase.
 */
export async function authenticateUser(usernameInput: string, passwordInput: string): Promise<AuthUser> {
  const cleanUser = (usernameInput || '').trim();
  const cleanUserLower = cleanUser.toLowerCase();
  const cleanPass = (passwordInput || '').trim();

  if (!cleanUser || !cleanPass) {
    throw new Error('Debe ingresar el usuario y la contraseña.');
  }

  // 1. Comprobación prioritaria de Administrador Maestro ('lauti' / 'seven')
  if (cleanUserLower === ADMIN_USERNAME && cleanPass === ADMIN_PASSWORD) {
    const adminUser: AuthUser = {
      username: 'lauti',
      displayName: 'Lauti (Administrador)',
      role: 'admin',
      isAdmin: true,
      email: 'lauti@mebestudio.com',
      loginTime: new Date().toISOString()
    };
    setCurrentAuthUser(adminUser);
    
    // Si Firebase está activo, sincronizar en segundo plano sin bloquear si falla la red
    try {
      await loginWithEmailOrUser(cleanUser, cleanPass).catch(() => {});
    } catch (e) {}

    return adminUser;
  }

  // 2. Comprobación en base de usuarios registrados en el sistema
  const users = getStoredUsers();
  const foundUser = users.find(u => u.username.toLowerCase() === cleanUserLower);

  if (foundUser) {
    if (foundUser.passwordHash === cleanPass) {
      const isLauti = foundUser.username.toLowerCase() === ADMIN_USERNAME;
      const authUser: AuthUser = {
        username: foundUser.username,
        displayName: foundUser.displayName || foundUser.username,
        role: isLauti ? 'admin' : 'user',
        isAdmin: isLauti,
        email: foundUser.email,
        loginTime: new Date().toISOString()
      };
      setCurrentAuthUser(authUser);
      return authUser;
    } else {
      throw new Error('Contraseña incorrecta. Verifique la clave ingresada o utilice "Recuperar contraseña".');
    }
  }

  // 3. Intento de autenticación en Firebase si el usuario está registrado en la nube
  try {
    const fbUser = await loginWithEmailOrUser(cleanUser, cleanPass);
    const fbUsername = extractUsernameFromEmail(fbUser.email);
    const isLauti = fbUsername.toLowerCase() === ADMIN_USERNAME && cleanPass === ADMIN_PASSWORD;
    
    const authUser: AuthUser = {
      username: fbUsername,
      displayName: fbUser.displayName || fbUsername,
      role: isLauti ? 'admin' : 'user',
      isAdmin: isLauti,
      email: fbUser.email || undefined,
      loginTime: new Date().toISOString()
    };

    // Guardar también en usuarios locales para acceso offline futuro
    if (!users.some(u => u.username.toLowerCase() === fbUsername.toLowerCase())) {
      users.push({
        username: fbUsername,
        displayName: authUser.displayName,
        passwordHash: cleanPass,
        role: 'user',
        email: fbUser.email || undefined,
        createdAt: new Date().toISOString()
      });
      saveStoredUsers(users);
    }

    setCurrentAuthUser(authUser);
    return authUser;
  } catch (fbErr: any) {
    console.warn('Fallo login Firebase / local:', fbErr);
    throw new Error('El usuario no está registrado o la contraseña es incorrecta. Si es un nuevo operador, utilice la opción "Registrarse".');
  }
}

/**
 * Registra un nuevo operador en el sistema.
 * El nuevo usuario siempre tendrá rol 'user' (operador común).
 */
export async function registerNewAccount(
  usernameInput: string,
  passwordInput: string,
  displayNameInput: string,
  emailInput?: string,
  securityAnswerInput?: string
): Promise<AuthUser> {
  const cleanUser = (usernameInput || '').trim();
  const cleanUserLower = cleanUser.toLowerCase();
  const cleanPass = (passwordInput || '').trim();
  const cleanName = (displayNameInput || '').trim() || cleanUser;

  if (!cleanUser) {
    throw new Error('Por favor, ingrese un nombre de usuario.');
  }

  if (cleanUserLower === ADMIN_USERNAME) {
    throw new Error('El nombre de usuario "lauti" está reservado para el Administrador del sistema.');
  }

  if (cleanUser.length < 3) {
    throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
  }

  if (!cleanPass || cleanPass.length < 4) {
    throw new Error('La contraseña debe tener al menos 4 caracteres.');
  }

  const users = getStoredUsers();
  if (users.some(u => u.username.toLowerCase() === cleanUserLower)) {
    throw new Error('Este nombre de usuario ya existe en el sistema. Por favor elija otro o inicie sesión.');
  }

  const newAccount: StoredUserAccount = {
    username: cleanUser,
    displayName: cleanName,
    passwordHash: cleanPass,
    role: 'user',
    email: emailInput?.trim() || `${cleanUserLower}@mebestudio.com`,
    securityAnswer: (securityAnswerInput || '').trim().toLowerCase(),
    createdAt: new Date().toISOString()
  };

  users.push(newAccount);
  saveStoredUsers(users);

  // Intentar sincronizar registro en Firebase en segundo plano si hay conexión
  try {
    await registerWithEmailOrUser(newAccount.email!, cleanPass, cleanName).catch(() => {});
  } catch (e) {}

  const authUser: AuthUser = {
    username: cleanUser,
    displayName: cleanName,
    role: 'user',
    isAdmin: false,
    email: newAccount.email,
    loginTime: new Date().toISOString()
  };

  setCurrentAuthUser(authUser);
  return authUser;
}

/**
 * Recupera o restablece la contraseña de un usuario registrado
 */
export async function recoverUserPassword(
  usernameInput: string,
  newPasswordInput: string,
  securityAnswerInput?: string
): Promise<{ success: boolean; message: string }> {
  const cleanUser = (usernameInput || '').trim();
  const cleanUserLower = cleanUser.toLowerCase();
  const cleanNewPass = (newPasswordInput || '').trim();

  if (!cleanUser) {
    throw new Error('Ingrese su nombre de usuario o correo.');
  }

  if (cleanUserLower === ADMIN_USERNAME) {
    throw new Error('La contraseña del Administrador principal "lauti" es fija ("seven") y no puede modificarse por este medio.');
  }

  if (!cleanNewPass || cleanNewPass.length < 4) {
    throw new Error('La nueva contraseña debe tener al menos 4 caracteres.');
  }

  const users = getStoredUsers();
  const userIdx = users.findIndex(u => u.username.toLowerCase() === cleanUserLower || (u.email && u.email.toLowerCase() === cleanUserLower));

  if (userIdx === -1) {
    // Si no está localmente, intentar enviar correo de restablecimiento vía Firebase
    try {
      await firebaseReset(cleanUser);
      return {
        success: true,
        message: `Se ha enviado un enlace de recuperación al correo asociado a ${cleanUser}.`
      };
    } catch (e) {
      throw new Error(`No se encontró ningún usuario registrado con el nombre "${cleanUser}".`);
    }
  }

  const user = users[userIdx];

  // Si tiene respuesta de seguridad configurada y se envió una respuesta, verificarla
  if (user.securityAnswer && securityAnswerInput) {
    const cleanAnswer = securityAnswerInput.trim().toLowerCase();
    if (cleanAnswer !== user.securityAnswer) {
      throw new Error('La respuesta o palabra clave de recuperación no coincide.');
    }
  }

  // Actualizar contraseña
  users[userIdx].passwordHash = cleanNewPass;
  saveStoredUsers(users);

  // Si tiene correo, intentar también Firebase
  if (user.email) {
    try {
      await firebaseReset(user.email).catch(() => {});
    } catch (e) {}
  }

  return {
    success: true,
    message: `La contraseña para "${user.username}" ha sido actualizada exitosamente. Ahora puede iniciar sesión con su nueva clave.`
  };
}

/**
 * Cierra la sesión activa
 */
export async function logoutUserSession(): Promise<void> {
  setCurrentAuthUser(null);
  try {
    await firebaseLogout().catch(() => {});
  } catch (e) {}
}
