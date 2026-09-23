import React from 'react';

interface MebLogoProps {
  className?: string;
  size?: number | string;
}

/**
 * Logo emblem of MEB Estudio Gráfico based on "FINAL 7" reference:
 * A dynamic rounded triangle with thick black frame, white perimeter segments,
 * and a bold red chevron arrow pointing to the right.
 */
export const MebLogo: React.FC<MebLogoProps> = ({ className = 'w-7 h-7', size }) => {
  const [imgError, setImgError] = React.useState(false);

  if (!imgError) {
    return (
      <img
        src="/meb_logo.png"
        alt="MEB Estudio Gráfico"
        className={`${className} object-contain`}
        style={size ? { width: size, height: size } : undefined}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="MEB Estudio Gráfico"
    >
      {/* Outer black boundary / silhouette */}
      <path
        d="M 46 22 
           C 54 10, 72 12, 84 20 
           L 174 86 
           C 186 95, 186 107, 174 116 
           L 84 182 
           C 72 190, 54 192, 46 180 
           L 20 142 
           C 12 130, 14 114, 22 104 
           L 46 76
           C 50 71, 48 64, 42 58
           L 30 46
           C 22 36, 32 26, 46 22 Z"
        fill="#050505"
      />

      {/* Main outer dynamic rounded triangle - Black outer frame */}
      <path
        d="M 52 18 
           C 70 8, 86 16, 102 28 
           L 182 88 
           C 194 97, 194 105, 182 114 
           L 102 174 
           C 86 186, 70 194, 52 184 
           L 30 168
           C 16 156, 12 142, 14 124 
           L 18 78
           C 20 60, 26 44, 38 32
           Z"
        fill="#0a0a0a"
      />

      {/* White segment 1: Top-Right Slanted Bar */}
      <path
        d="M 112 46 
           L 164 88 
           C 168 91, 168 95, 164 98 
           L 156 104 
           C 152 107, 146 105, 142 102 
           L 96 66 
           C 92 63, 93 58, 96 55 
           L 106 47 
           C 108 45, 110 45, 112 46 Z"
        fill="#FFFFFF"
      />

      {/* White segment 2: Bottom-Right Slanted Bar */}
      <path
        d="M 126 132 
           L 164 104 
           C 168 101, 170 105, 166 109 
           L 142 132 
           C 134 140, 124 146, 112 154 
           L 92 166 
           C 88 168, 85 166, 86 161 
           L 90 152 
           C 92 148, 96 145, 101 142 
           L 126 132 Z"
        fill="#FFFFFF"
      />

      {/* White segment 3: Left Curved Outer Segment */}
      <path
        d="M 52 30 
           C 60 26, 74 30, 80 34 
           L 88 40 
           C 90 42, 89 46, 86 48 
           L 78 52 
           C 74 54, 70 52, 66 48 
           L 60 42 
           C 54 36, 44 42, 42 50 
           L 36 94 
           C 34 108, 38 122, 48 132 
           L 68 152 
           C 72 156, 70 162, 66 164 
           L 58 166 
           C 54 167, 50 164, 46 160 
           L 30 142 
           C 20 130, 18 112, 20 96 
           L 24 58 
           C 26 44, 38 34, 52 30 Z"
        fill="#FFFFFF"
      />

      {/* Inner Black Triangular Recess */}
      <path
        d="M 54 52 
           C 58 48, 66 50, 72 54 
           L 136 94 
           C 142 98, 142 104, 136 108 
           L 72 148 
           C 66 152, 58 154, 54 150 
           L 46 140 
           C 40 132, 40 120, 42 110 
           L 44 92 
           C 44 82, 42 70, 46 62 
           Z"
        fill="#050505"
      />

      {/* Center Vivid Red Chevron Arrow (MEB play/arrow) */}
      <path
        d="M 64 64 
           C 66 61, 70 60, 74 63 
           L 126 96 
           C 130 99, 130 103, 126 106 
           L 74 139 
           C 70 142, 66 141, 64 138 
           L 60 130 
           C 58 126, 60 122, 64 118 
           L 76 104 
           C 78 102, 78 100, 76 98 
           L 64 84 
           C 60 80, 58 76, 60 72 
           L 64 64 Z"
        fill="#E50914"
      />
      
      {/* Red arrow subtle inner highlight */}
      <path
        d="M 72 70 
           L 116 98 
           C 119 100, 119 102, 116 104 
           L 72 132 
           C 70 133, 68 132, 67 130 
           L 68 124 
           C 70 120, 74 114, 78 106 
           C 80 102, 80 100, 78 96 
           C 74 88, 70 82, 68 78 
           L 67 72 
           C 68 70, 70 69, 72 70 Z"
        fill="#EF4444"
        opacity="0.25"
      />
    </svg>
  );
};
