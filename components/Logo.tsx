import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20', 
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  const textSizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl', 
    xl: 'text-6xl'
  };

  const gradientClasses = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl', 
    xl: 'rounded-2xl'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <img 
        src="/logo.svg"
        alt="tasq.one logo"
        className={`${sizeClasses[size]} object-contain`}
        onError={(e) => {
          console.error('Logo image failed to load:', e);
          const imgElement = e.currentTarget;
          imgElement.style.display = 'none';
          
          // Show fallback element
          const fallback = document.createElement('div');
          fallback.className = `
            ${sizeClasses[size]} 
            ${gradientClasses[size]}
            bg-gradient-to-br from-indigo-500 to-purple-600 
            flex items-center justify-center 
            text-white font-black 
            ${textSizeClasses[size]} 
            shadow-lg
          `;
          fallback.textContent = 'T';
          
          // Insert fallback after the image
          imgElement.parentNode?.insertBefore(fallback, imgElement.nextSibling);
        }}
      />
    </div>
  );
};

export default Logo;