import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <Image 
      src="/logo.svg" 
      alt="SwiftCare Logo" 
      width={48} // 48px matches our w-12 tailwind class
      height={48} // 48px matches our h-12 tailwind class
      className={className}
      priority // Tells Next.js to preload this image since it's above the fold
    />
  );
};

export default Logo;