import React from 'react';
import styled from 'styled-components';

const LogoSvg = styled.svg`
  display: inline-block;
  vertical-align: middle;
  margin-right: ${props => props.spacing || '8px'};
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const Logo = ({ size = 32, spacing = '8px', className }) => {
  // Calculate proportions based on size
  const scale = size / 32;
  const cornerSize = size * 0.125;
  const cursorSize = size * 0.3;
  
  return (
    <LogoSvg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`}
      spacing={spacing}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="docGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <dropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.2"/>
        </filter>
      </defs>

      {/* Document body */}
      <path
        d={`M ${cornerSize} 2 
           L ${size - 2} 2 
           L ${size - 2} ${size - 2} 
           L 2 ${size - 2} 
           L 2 ${cornerSize + 2} 
           L ${cornerSize} 2 Z`}
        fill="url(#docGradient)"
        filter="url(#shadow)"
      />

      {/* Folded corner */}
      <path
        d={`M 2 ${cornerSize + 2} 
           L ${cornerSize} ${cornerSize + 2} 
           L ${cornerSize} 2 Z`}
        fill="#c084fc"
      />

      {/* Document lines */}
      <rect
        x={size * 0.15}
        y={size * 0.35}
        width={size * 0.6}
        height={size * 0.06}
        fill="rgba(255, 255, 255, 0.6)"
        rx="1"
      />
      <rect
        x={size * 0.15}
        y={size * 0.5}
        width={size * 0.5}
        height={size * 0.06}
        fill="rgba(255, 255, 255, 0.6)"
        rx="1"
      />

      {/* Cursor/Arrow */}
      <g transform={`translate(${size - cursorSize - 2}, ${size - cursorSize - 2})`}>
        {/* Cursor shadow */}
        <path
          d={`M 1 1 
             L 1 ${cursorSize * 0.8 + 1} 
             L ${cursorSize * 0.3 + 1} ${cursorSize * 0.6 + 1} 
             L ${cursorSize * 0.6 + 1} ${cursorSize + 1} 
             L ${cursorSize + 1} ${cursorSize * 0.4 + 1} 
             L ${cursorSize * 0.4 + 1} ${cursorSize * 0.4 + 1} Z`}
          fill="rgba(0, 0, 0, 0.2)"
        />
        
        {/* Cursor body */}
        <path
          d={`M 0 0 
             L 0 ${cursorSize * 0.8} 
             L ${cursorSize * 0.3} ${cursorSize * 0.6} 
             L ${cursorSize * 0.6} ${cursorSize} 
             L ${cursorSize} ${cursorSize * 0.4} 
             L ${cursorSize * 0.4} ${cursorSize * 0.4} Z`}
          fill="white"
          stroke="#6d28d9"
          strokeWidth="0.5"
        />
      </g>
    </LogoSvg>
  );
};

export default Logo;
