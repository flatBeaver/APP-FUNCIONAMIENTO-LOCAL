import React, { useState } from 'react';
import { 
  ArrowRight, 
  Sun, 
  Moon, 
  KeyRound, 
  ShieldCheck,
  User as UserIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Crown, 
  HardHat, 
  LogOut
} from 'lucide-react';
import { MebLogo } from './MebLogo';
import { ThemeMode, AuthUser } from '../types';
import { 
  authenticateUser, 
  registerNewAccount, 
  recoverUserPassword, 
  logoutUserSession 
} from '../auth';
import { AmbientBackground } from './AmbientBackground';

interface WelcomeScreenProps {
  onEnter: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  currentUser: AuthUser | null;
  onLoginSuccess?: (user: AuthUser) => void;
  onLogoutSuccess?: () => void;
  operatorName: string;
  onUpdateOperatorName: (name: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onEnter,
  theme,
  onToggleTheme,
  currentUser,
  onLoginSuccess,
  onLogoutSuccess,
  operatorName,
  onUpdateOperatorName,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'recover'>('login');
  
  // Campos del formulario
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [securityAnswerInput, setSecurityAnswerInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de carga y mensajes
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Interacción visual: campo enfocado y proximidad a la tarjeta
  const [focusedField, setFocusedField] = useState<'username' | 'password' | 'other' | null>(null);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [showAuthFormOverride, setShowAuthFormOverride] = useState(false);

  // Enviar inicio de sesión
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!usernameInput.trim() || !passwordInput.trim()) {
      setErrorMsg('Por favor ingrese usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const user = await authenticateUser(usernameInput, passwordInput);
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(user);
      }
      onUpdateOperatorName(user.displayName);
      setSuccessMsg(`¡Bienvenido, ${user.displayName}!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  // Enviar registro de nuevo usuario
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!usernameInput.trim() || !passwordInput.trim()) {
      setErrorMsg('Debe completar el nombre de usuario y la contraseña.');
      return;
    }

    if (passwordInput !== confirmPasswordInput) {
      setErrorMsg('Las contraseñas no coinciden. Verifique ambas claves.');
      return;
    }

    setLoading(true);
    try {
      const newUser = await registerNewAccount(
        usernameInput,
        passwordInput,
        displayNameInput || usernameInput,
        undefined,
        securityAnswerInput
      );
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(newUser);
      }
      onUpdateOperatorName(newUser.displayName);
      setSuccessMsg(`¡Cuenta de operador creada exitosamente! Bienvenido, ${newUser.displayName}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar nuevo operador.');
    } finally {
      setLoading(false);
    }
  };

  // Enviar recuperación de contraseña
  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!usernameInput.trim() || !passwordInput.trim()) {
      setErrorMsg('Ingrese su usuario y la nueva contraseña.');
      return;
    }

    if (passwordInput !== confirmPasswordInput) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await recoverUserPassword(usernameInput, passwordInput, securityAnswerInput);
      setSuccessMsg(res.message);
      setAuthMode('login');
      setPasswordInput('');
      setConfirmPasswordInput('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al restablecer contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id="pagina-inicio-bienvenida"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#050505] text-neutral-200 flex flex-col justify-between selection:bg-red-600 selection:text-white"
    >
      <AmbientBackground className="min-h-screen">
        {/* Barra Superior con Identificador y Tema */}
        <header className="w-full px-6 py-3.5 flex items-center justify-between border-b border-neutral-900/80 bg-[#080808]/70 backdrop-blur-md sticky top-0 z-20 no-shockwave">
          <div className="flex items-center gap-2.5 text-xs text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.7)] animate-pulse"></span>
            <span className="font-mono text-neutral-200 font-bold tracking-wider uppercase text-[11px]">
              MEB Estudio Gráfico
            </span>
            <span className="text-neutral-700 hidden sm:inline">•</span>
            <span className="text-neutral-500 hidden sm:inline text-[11px]">Control de Taller y Producción</span>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border ${
                currentUser.isAdmin 
                  ? 'bg-red-950/40 border-red-900/60 text-red-400' 
                  : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'
              }`}>
                {currentUser.isAdmin ? <Crown className="w-3.5 h-3.5" /> : <HardHat className="w-3.5 h-3.5" />}
                <span className="font-bold">{currentUser.displayName || currentUser.username}</span>
              </div>
            )}

            <button
              onClick={onToggleTheme}
              id="btn-cambiar-tema-inicio"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-neutral-800/80 bg-[#0d0d0d]/80 hover:bg-neutral-800/80 text-neutral-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-neutral-300 hidden md:inline">Oscuro</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium text-neutral-300 hidden md:inline">Claro</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Contenido Central */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-xl mx-auto w-full text-center">
          {/* Logo de MEB */}
          <div className="relative mb-5 group">
            <div className="absolute -inset-3 bg-gradient-to-r from-red-600/30 via-red-900/20 to-transparent rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div 
              id="meb-logo-portada"
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#080808]/90 border border-neutral-800/80 flex items-center justify-center p-3 shadow-2xl shadow-black"
            >
              <MebLogo className="w-full h-full" />
            </div>
          </div>

          {/* Título de Marca */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-1 flex items-center justify-center gap-2">
              <span>MEB Estudio Gráfico</span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block shadow-[0_0_12px_rgba(239,68,68,0.9)]"></span>
            </h1>
            <p className="text-xs sm:text-sm font-medium tracking-wider uppercase text-neutral-400">
              Taller de Rotulación, Gran Formato y Kits de Producción
            </p>
          </div>

          {/* ========================================================= */}
          {/* CASO A: EL USUARIO YA ESTÁ AUTENTICADO */}
          {/* ========================================================= */}
          {currentUser && !showAuthFormOverride ? (
            <div 
              onMouseEnter={() => setIsCardHovered(true)}
              onMouseLeave={() => setIsCardHovered(false)}
              className="relative w-full group mb-6 text-left"
            >
              {/* Iluminación de profundidad detrás de la tarjeta */}
              <div 
                className={`absolute -inset-3 rounded-3xl pointer-events-none transition-all duration-700 ease-out blur-2xl ${
                  isCardHovered ? 'opacity-90 scale-[1.02]' : 'opacity-40 scale-100'
                }`}
                style={{
                  background: 'radial-gradient(ellipse at 50% 50%, rgba(225, 28, 28, 0.36) 0%, rgba(140, 14, 14, 0.14) 55%, transparent 75%)',
                }}
              />

              <div className="relative z-10 w-full bg-[#0a0a0a]/85 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 sm:p-7 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9)] transition-all no-shockwave">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${
                      currentUser.isAdmin 
                        ? 'bg-red-600 text-white shadow-red-700' 
                        : 'bg-neutral-800 text-neutral-200'
                    }`}>
                      {currentUser.isAdmin ? <Crown className="w-6 h-6" /> : <HardHat className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-white">
                          {currentUser.displayName}
                        </h3>
                        <span className="text-xs text-neutral-500 font-mono">
                          (@{currentUser.username})
                        </span>
                      </div>
                      <div className="mt-0.5">
                        {currentUser.isAdmin ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
                            <Crown className="w-3.5 h-3.5" /> Administrador MEB (Acceso Completo)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <HardHat className="w-3.5 h-3.5" /> Operador de Taller (Modo Limpio)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mensaje descriptivo según rol */}
                <div className={`p-3.5 rounded-xl text-xs mb-5 border ${
                  currentUser.isAdmin
                    ? 'bg-red-950/30 border-red-900/40 text-red-300'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400'
                }`}>
                  {currentUser.isAdmin ? (
                    <p className="leading-relaxed">
                      <b>Acceso Administrador activo:</b> Podrá crear, modificar, editar, eliminar pedidos, gestionar la base de clientes, configurar parámetros y administrar copias de seguridad de la red local.
                    </p>
                  ) : (
                    <p className="leading-relaxed">
                      <b>Interfaz de Operador activa:</b> Modo simplificado y limpio sin botones administrativos. Puede gestionar pedidos en curso, actualizar estados de avance, marcar casillas de acabado y descargar hojas de taller en PDF.
                    </p>
                  )}
                </div>

                {/* Puesto / Nombre de estación */}
                <div className="mb-5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Nombre de Puesto de Trabajo para el Turno:
                  </label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => onUpdateOperatorName(e.target.value)}
                    placeholder="Ej. Operador 1 · Mesa de Corte"
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#050505]/90 text-white border border-neutral-800 hover:border-neutral-700 focus:border-red-600/70 focus:shadow-[0_0_18px_-2px_rgba(220,38,38,0.28)] outline-none transition-all font-medium"
                  />
                </div>

                {/* Botón Entrar */}
                <button
                  onClick={onEnter}
                  id="btn-entrar-taller-autenticado"
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-base border border-red-500/40 hover:border-red-400/60 shadow-md shadow-red-950/40 hover:shadow-[0_4px_25px_-2px_rgba(220,38,38,0.42)] active:scale-[0.985] active:opacity-90 flex items-center justify-center gap-2 transition-all duration-300 ease-out cursor-pointer"
                >
                  <span>Entrar al Sistema de Producción</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Botones Secundarios */}
                <div className="mt-4 flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-900">
                  <button
                    onClick={() => setShowAuthFormOverride(true)}
                    className="hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Iniciar sesión con otra cuenta
                  </button>
                  <button
                    onClick={() => {
                      if (typeof onLogoutSuccess === 'function') {
                        onLogoutSuccess();
                      } else {
                        logoutUserSession();
                        window.location.reload();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* CASO B: BLOQUE DE INICIO DE SESIÓN / REGISTRO / RECUPERAR */
            /* ========================================================= */
            <div 
              onMouseEnter={() => setIsCardHovered(true)}
              onMouseLeave={() => setIsCardHovered(false)}
              className="relative w-full group mb-6 text-left"
            >
              {/* Iluminación de profundidad reactiva detrás de la tarjeta */}
              <div 
                className={`absolute -inset-3 rounded-3xl pointer-events-none transition-all duration-700 ease-out blur-2xl ${
                  isCardHovered ? 'opacity-95 scale-[1.02]' : 'opacity-40 scale-100'
                }`}
                style={{
                  background: 'radial-gradient(ellipse at 50% 50%, rgba(225, 28, 28, 0.38) 0%, rgba(140, 14, 14, 0.16) 55%, transparent 75%)',
                }}
              />

              <div className="relative z-10 w-full bg-[#0a0a0a]/85 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 sm:p-7 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9)] transition-all overflow-hidden no-shockwave">
                {/* Cabecera del bloque */}
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3.5 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-900/60 flex items-center justify-center text-red-500 shadow-[0_0_12px_rgba(220,38,38,0.2)]">
                      {authMode === 'login' && <KeyRound className="w-4 h-4" />}
                      {authMode === 'register' && <UserPlus className="w-4 h-4" />}
                      {authMode === 'recover' && <RotateCcw className="w-4 h-4" />}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        {authMode === 'login' && 'Ingreso de Usuario'}
                        {authMode === 'register' && 'Registro de Nuevo Operador'}
                        {authMode === 'recover' && 'Recuperar Contraseña'}
                      </h2>
                      <span className="text-[11px] text-neutral-400 block">
                        {authMode === 'login' && 'Ingrese su usuario y clave de MEB'}
                        {authMode === 'register' && 'Cree una cuenta para acceder al taller'}
                        {authMode === 'recover' && 'Restablezca el acceso a su cuenta'}
                      </span>
                    </div>
                  </div>

                  {currentUser && (
                    <button
                      type="button"
                      onClick={() => setShowAuthFormOverride(false)}
                      className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Volver
                    </button>
                  )}
                </div>

                {/* Mensajes de Alerta / Éxito */}
                {errorMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* 1. MODO: INICIAR SESIÓN */}
                {authMode === 'login' && (
                  <div className="relative">
                    {/* Luz ambiental de fondo que se desplaza suavemente al campo activo (Usuario o Contraseña) */}
                    <div
                      className={`absolute -inset-x-2 h-14 rounded-2xl pointer-events-none transition-all duration-350 ease-out blur-xl ${
                        focusedField === 'username'
                          ? 'top-[22px] opacity-100'
                          : focusedField === 'password'
                          ? 'top-[96px] opacity-100'
                          : 'top-[59px] opacity-0'
                      }`}
                      style={{
                        background: 'radial-gradient(ellipse at 50% 50%, rgba(230, 30, 30, 0.38) 0%, rgba(150, 14, 14, 0.15) 55%, transparent 75%)',
                      }}
                    />

                    <form onSubmit={handleLoginSubmit} className="relative z-10 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-red-500" />
                          <span>Nombre de Usuario</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          onFocus={() => setFocusedField('username')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Ej. lauti o su nombre de operador"
                          className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#050505]/90 text-neutral-100 placeholder-neutral-500 border border-neutral-800 hover:border-neutral-700 focus:border-red-600/70 focus:shadow-[0_0_18px_-2px_rgba(220,38,38,0.28)] outline-none font-medium transition-all duration-200"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-red-500" />
                            <span>Contraseña</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode('recover');
                              setErrorMsg('');
                              setSuccessMsg('');
                            }}
                            className="text-[11px] text-red-400 hover:text-red-300 hover:underline cursor-pointer font-medium transition-colors"
                          >
                            ¿Olvidó su contraseña?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Ingrese su contraseña"
                            className="w-full pl-4 pr-10 py-2.5 text-sm rounded-xl bg-[#050505]/90 text-neutral-100 placeholder-neutral-500 border border-neutral-800 hover:border-neutral-700 focus:border-red-600/70 focus:shadow-[0_0_18px_-2px_rgba(220,38,38,0.28)] outline-none font-medium transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-200 cursor-pointer transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        id="btn-login-submit"
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-sm border border-red-500/40 hover:border-red-400/60 shadow-md shadow-red-950/40 hover:shadow-[0_4px_25px_-2px_rgba(220,38,38,0.42)] active:scale-[0.985] active:opacity-90 flex items-center justify-center gap-2 transition-all duration-300 ease-out cursor-pointer disabled:opacity-50"
                      >
                        {loading ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                            Verificando credenciales...
                          </span>
                        ) : (
                          <>
                            <span>Iniciar Sesión y Entrar</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="pt-3 text-center text-xs text-neutral-400 border-t border-neutral-900">
                        <span>¿Aún no tiene usuario registrado? </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('register');
                            setErrorMsg('');
                            setSuccessMsg('');
                          }}
                          className="text-red-400 hover:text-red-300 hover:underline font-bold cursor-pointer transition-colors"
                        >
                          Registrarse aquí
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 2. MODO: REGISTRARSE */}
                {authMode === 'register' && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Nombre Completo / Puesto
                      </label>
                      <input
                        type="text"
                        required
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        onFocus={() => setFocusedField('other')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Ej. Juan Pérez · Mesa de Corte"
                        className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#050505]/90 text-neutral-100 placeholder-neutral-500 border border-neutral-800 hover:border-neutral-700 focus:border-red-600/70 focus:shadow-[0_0_18px_-2px_rgba(220,38,38,0.28)] outline-none font-medium transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Nombre de Usuario (Para iniciar sesión)
                      </label>
                      <input
                        type="text"
                        required
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        onFocus={() => setFocusedField('other')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Ej. juanp o operador2"
                        className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#050505]/90 text-neutral-100 placeholder-neutral-500 border border-neutral-800 hover:border-neutral-700 focus:border-red-600/70 focus:shadow-[0_0_18px_-2px_rgba(220,38,38,0.28)] outline-none font-medium transition-all duration-200"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          Contraseña
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          onFocus={() => setFocusedField('other')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Mínimo 4 caracteres"
                          className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#050505]/90 text-neutral-100 placeholder-neutral-500 border border-neutral-800 hover:border-neutral-700 focus:border-red-600/70 focus:shadow-[0_0_18px_-2px_rgba(220,38,38,0.28)] outline-none font-medium transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          Confirmar Contraseña
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPasswordInput}
                          onChange={(e) => setConfirmPasswordInput(e.target.value)}
                          onFocus={() => setFocusedField('other')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Repita la contraseña"
                          className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#050505]/90 text-neutral-100 placeholder-neutral-500 border border-neutral-800 hover:border-neutral-700 focus:border-red-600/70 focus:shadow-[0_0_18px_-2px_rgba(220,38,38,0.28)] outline-none font-medium transition-all duration-200"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      id="btn-register-submit"
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-sm border border-red-500/40 hover:border-red-400/60 shadow-md shadow-red-950/40 hover:shadow-[0_4px_25px_-2px_rgba(220,38,38,0.42)] active:scale-[0.985] active:opacity-90 flex items-center justify-center gap-2 transition-all duration-300 ease-out cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {loading ? 'Creando cuenta...' : 'Crear Cuenta de Operador'}
                    </button>

                    <div className="pt-2 text-center text-xs text-neutral-400 border-t border-neutral-900">
                      <span>¿Ya tiene una cuenta de usuario? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setErrorMsg('');
                          setSuccessMsg('');
                        }}
                        className="text-red-400 hover:text-red-300 hover:underline font-bold cursor-pointer transition-colors"
                      >
                        Iniciar Sesión
                      </button>
                    </div>
                  </form>
                )}

                {/* 3. MODO: RECUPERAR CONTRASEÑA */}
                {authMode === 'recover' && (
                  <form onSubmit={handleRecoverSubmit} className="space-y-3.5">
                    <div className="text-xs text-neutral-400 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                      Ingrese el usuario para el cual desea establecer una nueva clave de acceso al taller.
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Nombre de Usuario
                      </label>
                      <input
                        type="text"
                        required
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        onFocus={() => setFocusedField('other')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Ej. operador1 o su usuario"
                        className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#050505]/90 text-neutral-100 placeholder-neutral-500 border border-neutral-800 hover:border-neutral-700 focus:border-red-600/70 focus:shadow-[0_0_18px_-2px_rgba(220,38,38,0.28)] outline-none font-medium transition-all duration-200"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          Nueva Contraseña
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          onFocus={() => setFocusedField('other')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Nueva clave"
                          className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#050505]/90 text-neutral-100 placeholder-neutral-500 border border-neutral-800 hover:border-neutral-700 focus:border-red-600/70 focus:shadow-[0_0_18px_-2px_rgba(220,38,38,0.28)] outline-none font-medium transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          Repetir Contraseña
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPasswordInput}
                          onChange={(e) => setConfirmPasswordInput(e.target.value)}
                          onFocus={() => setFocusedField('other')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Repetir clave"
                          className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#050505]/90 text-neutral-100 placeholder-neutral-500 border border-neutral-800 hover:border-neutral-700 focus:border-red-600/70 focus:shadow-[0_0_18px_-2px_rgba(220,38,38,0.28)] outline-none font-medium transition-all duration-200"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      id="btn-recover-submit"
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-sm border border-red-500/40 hover:border-red-400/60 shadow-md shadow-red-950/40 hover:shadow-[0_4px_25px_-2px_rgba(220,38,38,0.42)] active:scale-[0.985] active:opacity-90 flex items-center justify-center gap-2 transition-all duration-300 ease-out cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {loading ? 'Actualizando...' : 'Restablecer Contraseña'}
                    </button>

                    <div className="pt-2 text-center text-xs text-neutral-400 border-t border-neutral-900">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setErrorMsg('');
                          setSuccessMsg('');
                        }}
                        className="text-red-400 hover:text-red-300 hover:underline font-bold cursor-pointer transition-colors"
                      >
                        Volver a Iniciar Sesión
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Pie de Página */}
        <footer className="w-full px-6 py-3.5 border-t border-neutral-900/80 bg-[#080808]/70 text-center text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2 no-shockwave">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-300">MEB Estudio Gráfico</span>
            <span className="text-neutral-700">|</span>
            <span>Gestión Interna de Taller</span>
          </div>
          <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
            <span>Acceso Protegido por Roles · Admin (lauti) y Operadores</span>
          </div>
        </footer>
      </AmbientBackground>
    </div>
  );
};
