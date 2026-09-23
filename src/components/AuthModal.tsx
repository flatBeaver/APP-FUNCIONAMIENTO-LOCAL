import React, { useState } from 'react';
import { 
  Lock, 
  User as UserIcon, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  X, 
  ArrowRight, 
  KeyRound, 
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { 
  logoutUser, 
  resetUserPassword,
  extractUsernameFromEmail 
} from '../firebase';
import { 
  authenticateUser, 
  registerNewAccount, 
  recoverUserPassword 
} from '../auth';
import { MebLogo } from './MebLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onAuthSuccess?: (user: any) => void;
  onOperatorNameChange?: (name: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onOperatorNameChange,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [userInput, setUserInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !password.trim()) {
      setErrorMsg('Por favor, ingrese su usuario o correo y la contraseña.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const user = await authenticateUser(userInput, password);
      const name = user.displayName || user.username;
      if (onOperatorNameChange && name) {
        onOperatorNameChange(name);
      }
      setSuccessMsg(`¡Bienvenido/a, ${name}! Sesión iniciada con éxito.`);
      if (onAuthSuccess) onAuthSuccess(user);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err?.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !password.trim()) {
      setErrorMsg('Por favor complete todos los campos obligatorios.');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('La contraseña debe tener un mínimo de 4 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const user = await registerNewAccount(userInput, password, displayName);
      const name = user.displayName || user.username;
      if (onOperatorNameChange && name) {
        onOperatorNameChange(name);
      }
      setSuccessMsg(`¡Cuenta creada con éxito! Bienvenido/a al taller, ${name}.`);
      if (onAuthSuccess) onAuthSuccess(user);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Register error:', err);
      setErrorMsg(err?.message || 'Error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) {
      setErrorMsg('Ingrese su usuario o correo para enviarle el enlace.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await recoverUserPassword(userInput, 'taller1234');
      setSuccessMsg(res.message);
    } catch (err: any) {
      try {
        await resetUserPassword(userInput);
        setSuccessMsg(`Se ha enviado un enlace de restablecimiento al correo asociado.`);
      } catch (fbErr: any) {
        setErrorMsg(err?.message || 'No se pudo restablecer la contraseña.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setSuccessMsg('Sesión cerrada correctamente.');
      setTimeout(() => {
        setSuccessMsg('');
        setMode('login');
      }, 1000);
    } catch (err: any) {
      console.error('Logout error:', err);
      setErrorMsg('Error al cerrar sesión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id="modal-auth-firebase"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-[8px] flex items-center justify-center p-3 sm:p-4"
    >
      <div className="backdrop-blur-xl bg-white/95 dark:bg-black/90 text-slate-900 dark:text-white rounded-2xl border border-slate-300 dark:border-neutral-800/90 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black border border-neutral-800 flex items-center justify-center p-1.5 shadow-sm">
              <MebLogo className="w-full h-full" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <span>Método de Acceso</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                  Firebase Auth
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Identificación de operadores y acceso seguro al taller
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Error / Éxito */}
        {errorMsg && (
          <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <div className="flex-1">{successMsg}</div>
          </div>
        )}

        {/* Si ya hay usuario autenticado */}
        {currentUser ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-red-600/30">
                  {(currentUser.displayName || currentUser.email || 'O').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {currentUser.displayName || extractUsernameFromEmail(currentUser.email)}
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.2 rounded-full font-medium">
                      Activo
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-neutral-800 text-[11px] text-slate-500 dark:text-neutral-400 space-y-1">
                <div className="flex justify-between">
                  <span>ID Usuario (UID):</span>
                  <span className="font-mono text-slate-700 dark:text-neutral-300 truncate max-w-[180px]">{currentUser.uid}</span>
                </div>
                <div className="flex justify-between">
                  <span>Proveedor:</span>
                  <span className="text-slate-700 dark:text-neutral-300 font-semibold">Firebase Password Auth</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                <span>Cerrar Sesión</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30 cursor-pointer"
              >
                Continuar al Taller
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Pestañas de Modo */}
            <div className="flex border-b border-slate-200 dark:border-neutral-800 mb-5">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer mr-4 border-b-2 ${
                  mode === 'login'
                    ? 'border-red-600 text-red-600 dark:text-red-500'
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-neutral-300'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer mr-4 border-b-2 ${
                  mode === 'register'
                    ? 'border-red-600 text-red-600 dark:text-red-500'
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-neutral-300'
                }`}
              >
                Registrar Nuevo Operador
              </button>
              <button
                type="button"
                onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
                  mode === 'forgot'
                    ? 'border-red-600 text-red-600 dark:text-red-500'
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-neutral-300'
                }`}
              >
                Recuperar
              </button>
            </div>

            {/* FORMULARIO: LOGIN */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-red-600" />
                    <span>Usuario o Correo Electrónico</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="ej. operador1 o juan@mebestudio.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 focus:border-red-600 outline-none text-slate-900 dark:text-white transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1 block">
                    Puede ingresar su nombre de usuario simple (ej. 'operador1') o su correo completo.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-red-600" />
                      <span>Contraseña</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-neutral-300 cursor-pointer flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPassword ? 'Ocultar' : 'Ver'}</span>
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 focus:border-red-600 outline-none text-slate-900 dark:text-white transition-colors font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Iniciar Sesión en Firebase</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Cerrar / Continuar como invitado */}
                <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-[11px] text-slate-400 hover:underline cursor-pointer"
                  >
                    Continuar como invitado
                  </button>
                </div>
              </form>
            )}

            {/* FORMULARIO: REGISTRO */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-red-600" />
                    <span>Nombre de Operador / Puesto</span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej. Juan Pérez · Plotter Roland"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 focus:border-red-600 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-red-600" />
                    <span>Usuario o Correo *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="ej. operador2 o juan@mebestudio.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 focus:border-red-600 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-red-600" />
                    <span>Contraseña (mínimo 6 carácteres) *</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 focus:border-red-600 outline-none text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-red-600" />
                    <span>Confirmar Contraseña *</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 focus:border-red-600 outline-none text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Registrar Acceso en Firebase</span>}
                </button>
              </form>
            )}

            {/* FORMULARIO: FORGOT */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-red-600" />
                    <span>Usuario o Correo Registrado</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="ej. operador1 o taller@mebestudio.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 focus:border-red-600 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs border border-neutral-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Enviar Enlace de Restablecimiento</span>}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer del Modal */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-neutral-900/60 border-t border-slate-200 dark:border-neutral-800 text-[11px] text-slate-500 dark:text-neutral-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
            <span>Autenticación cifrada SSL</span>
          </span>
          <span className="font-mono text-[10px]">concentrated-rex-0lxdt</span>
        </div>
      </div>
    </div>
  );
};
