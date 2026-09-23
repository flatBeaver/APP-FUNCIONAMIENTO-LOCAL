import React, { useEffect, useRef, useState } from 'react';

interface AmbientBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  onCardProximityChange?: (proximity: number) => void;
}

interface ShockwaveRipple {
  id: number;
  x: number;
  y: number;
  scale: number;
  glowIntensity: number;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  children,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const isHovering = useRef(false);
  const currentOpacity = useRef(0);
  const animFrameId = useRef<number | null>(null);

  const [ripples, setRipples] = useState<ShockwaveRipple[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const clickComboRef = useRef<number>(1);
  const lastClickTimeRef = useRef<number>(0);
  const rippleTimeoutsRef = useRef<Map<number, number>>(new Map());

  // Limpiar timeouts al desmontar el componente
  useEffect(() => {
    return () => {
      rippleTimeoutsRef.current.forEach((timer) => clearTimeout(timer));
      rippleTimeoutsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Inicializar en el centro
    const rect = el.getBoundingClientRect();
    targetPos.current = { x: rect.width / 2, y: rect.height / 2 };
    currentPos.current = { x: rect.width / 2, y: rect.height / 2 };

    const handlePointerMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      targetPos.current = {
        x: e.clientX - b.left,
        y: e.clientY - b.top,
      };
      isHovering.current = true;
    };

    const handlePointerLeave = () => {
      isHovering.current = false;
    };

    // Generar onda expansiva realista al hacer click en el fondo
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Si se hace click en controles interactivos (botones, inputs, links, etc.), no disparar onda
      if (target.closest('button, input, select, textarea, a, [role="button"], label, .no-shockwave')) {
        return;
      }

      const b = el.getBoundingClientRect();
      const x = e.clientX - b.left;
      const y = e.clientY - b.top;

      // Asegurar que el click esté dentro del área del contenedor
      if (x < 0 || y < 0 || x > b.width || y > b.height) return;

      // Detección de racha / combo de clics sucesivos (dentro de 1.6 segundos)
      const now = Date.now();
      if (now - lastClickTimeRef.current < 1600) {
        clickComboRef.current = Math.min(clickComboRef.current + 1, 6);
      } else {
        clickComboRef.current = 1;
      }
      lastClickTimeRef.current = now;

      const combo = clickComboRef.current;
      // Mientras más clics se hagan, mayor es la escala y el alcance de la onda
      const scaleMultiplier = 1 + (combo - 1) * 0.38;
      const glowBoost = Math.min(1 + (combo - 1) * 0.22, 2.0);

      const rippleId = Date.now() + Math.random();
      const newRipple: ShockwaveRipple = {
        id: rippleId,
        x,
        y,
        scale: Number(scaleMultiplier.toFixed(2)),
        glowIntensity: Number(glowBoost.toFixed(2)),
      };

      // Limitar a máximo 7 ondas simultáneas para rendimiento óptimo
      setRipples((prev) => [...prev.slice(-6), newRipple]);

      // Eliminación garantizada con temporizador: NUNCA queda congelada en pantalla
      const timer = window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== rippleId));
        rippleTimeoutsRef.current.delete(rippleId);
      }, 980);
      rippleTimeoutsRef.current.set(rippleId, timer);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);

    // Loop de interpolación suave a 60 FPS con inercia
    const tick = () => {
      if (prefersReducedMotion) {
        currentPos.current = { ...targetPos.current };
        currentOpacity.current = isHovering.current ? 0.85 : 0;
      } else {
        const factor = 0.065;
        currentPos.current.x += (targetPos.current.x - currentPos.current.x) * factor;
        currentPos.current.y += (targetPos.current.y - currentPos.current.y) * factor;

        const targetOp = isHovering.current ? 1 : 0;
        currentOpacity.current += (targetOp - currentOpacity.current) * 0.045;
      }

      if (el) {
        el.style.setProperty('--cursor-x', `${currentPos.current.x.toFixed(1)}px`);
        el.style.setProperty('--cursor-y', `${currentPos.current.y.toFixed(1)}px`);
        el.style.setProperty('--cursor-opacity', `${currentOpacity.current.toFixed(3)}`);
      }

      animFrameId.current = requestAnimationFrame(tick);
    };

    animFrameId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('mouseleave', handlePointerLeave);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-[#050505] text-neutral-200 ${className}`}
      style={{
        // Variables por defecto antes de mover el ratón
        ['--cursor-x' as string]: '50%',
        ['--cursor-y' as string]: '50%',
        ['--cursor-opacity' as string]: '0',
      }}
    >
      {/* 1. Capa Base Negro Profundo con sutil viñeteado ambiental */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #0a0a0a 0%, #050505 85%)',
        }}
      />

      {/* 2. Iluminación Ambiental Lenta 1 (drifting vivo y sutilmente más intenso en rojo MEB) */}
      <div
        className="absolute -top-[15%] -right-[10%] w-[65vw] h-[65vw] max-w-[900px] max-h-[900px] rounded-full pointer-events-none animate-ambient-drift-1 blur-[110px]"
        style={{
          background: 'radial-gradient(circle, rgba(220, 28, 28, 0.28) 0%, rgba(150, 16, 16, 0.12) 48%, transparent 72%)',
        }}
      />

      {/* 3. Iluminación Ambiental Lenta 2 (drifting vivo en rojo carmesí profundo) */}
      <div
        className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full pointer-events-none animate-ambient-drift-2 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, rgba(195, 22, 22, 0.24) 0%, rgba(125, 12, 12, 0.10) 50%, transparent 75%)',
        }}
      />

      {/* 4. Luz reactiva al cursor (Seguimiento suave con inercia, halo rojo cálido e intenso pero fino) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(
            circle 680px at var(--cursor-x) var(--cursor-y),
            rgba(235, 32, 32, calc(0.30 * var(--cursor-opacity))) 0%,
            rgba(175, 18, 18, calc(0.18 * var(--cursor-opacity))) 32%,
            rgba(95, 10, 10, calc(0.06 * var(--cursor-opacity))) 60%,
            transparent 78%
          )`,
        }}
      />

      {/* 5. Ondas expansivas realistas al hacer click en el fondo (acústica visual contenida) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="absolute pointer-events-none"
            style={{
              left: `${ripple.x}px`,
              top: `${ripple.y}px`,
              width: 0,
              height: 0,
            }}
          >
            {/* Cresta frontal de la onda (onda principal fina con brillo rojo centrada exactamente en el cursor) */}
            <div
              className="absolute w-64 h-64 rounded-full animate-shockwave-main pointer-events-none"
              style={{
                ['--shockwave-scale' as string]: ripple.scale,
                border: `${Math.max(1, 1.6 / Math.sqrt(ripple.scale))}px solid rgba(248, 113, 113, ${Math.min(0.9, 0.72 * ripple.glowIntensity)})`,
                boxShadow: `0 0 ${14 * ripple.glowIntensity}px ${2 * ripple.scale}px rgba(220, 38, 38, 0.52), inset 0 0 12px 1px rgba(220, 38, 38, 0.26)`,
                background: `radial-gradient(circle, rgba(220, 38, 38, ${0.18 * ripple.glowIntensity}) 0%, rgba(180, 20, 20, 0.05) 45%, transparent 70%)`,
              }}
            />
            {/* Eco armónico interior secundario (refracción realista) */}
            <div
              className="absolute w-64 h-64 rounded-full animate-shockwave-echo pointer-events-none"
              style={{
                ['--shockwave-scale' as string]: ripple.scale,
                border: '1px solid rgba(239, 68, 68, 0.40)',
                boxShadow: `0 0 ${10 * ripple.glowIntensity}px rgba(220, 38, 38, 0.32)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Contenido en primer plano */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
};
