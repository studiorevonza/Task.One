import React, { useState } from 'react';

interface LogoProps {
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    xxs: 'w-6 h-6',
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-14 h-14', 
    lg: 'w-20 h-20',
    xl: 'w-32 h-32',
    '2xl': 'w-48 h-48'
  };

  const textSizeClasses = {
    xxs: 'text-[10px]',
    xs: 'text-xs',
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl', 
    xl: 'text-6xl',
    '2xl': 'text-8xl'
  };

  const roundedClasses = {
    xxs: 'rounded-md',
    xs: 'rounded-lg',
    sm: 'rounded-xl',
    md: 'rounded-2xl',
    lg: 'rounded-3xl', 
    xl: 'rounded-[1.5rem]',
    '2xl': 'rounded-[2.5rem]'
  };

  return (
    <div className={`${sizeClasses[size]} ${roundedClasses[size]} ${className} relative flex items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-600 to-blue-700 shadow-lg shadow-indigo-500/20 group cursor-pointer overflow-hidden`}>
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      
      {/* Decorative inner ring */}
      <div className="absolute inset-1 rounded-[inherit] border border-white/10" />
      
      {/* Text Logo */}
      <span className={`${textSizeClasses[size]} font-black text-white tracking-tighter drop-shadow-sm`}>
        T
      </span>
      
      {/* Bottom glow */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-white/20 blur-xl rounded-full" />
    </div>
  );
};

export default Logo;
