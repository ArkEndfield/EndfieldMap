import React from 'react';

import { ButtonWithAudio } from '@/components/common/button_with_audio';

interface ButtonProps {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const MapButton: React.FC<ButtonProps> = ({ active = false, children, onClick }) => {
  return (
    <ButtonWithAudio
      onClick={onClick}
      className={`
        relative block py-2 text-lg font-black
        ${active ? 'bg-[#fcfb58] text-[#444444]' : 'bg-[#303030e3] hover:bg-[#393939]'}
        ${!active && 'bg-[repeating-linear-gradient(75deg,transparent,transparent_0.1em,#3838385a_0.15em,#3838385a_0.2em)]'}
        ${active && 'hover:bg-none'}
      `}
    >
      {/* Corner dots */}
      <div className="absolute inset-0">
        <div className="absolute top-[0.2em] left-[0.2em] w-[0.2em] h-[0.2em] bg-[#797979] animate-pulse" />
        <div className="absolute top-[0.2em] right-[0.2em] w-[0.2em] h-[0.2em] bg-[#797979] animate-pulse" />
        <div className="absolute bottom-[0.2em] left-[0.2em] w-[0.2em] h-[0.2em] bg-[#797979] animate-pulse" />
        <div className="absolute bottom-[0.2em] right-[0.2em] w-[0.2em] h-[0.2em] bg-[#797979] animate-pulse" />
      </div>

      {/* Button title with decorative borders */}
      <div className="relative z-1 flex items-center justify-center gap-2">
        {/* Left border decoration */}
        <span className="ml-4 w-[0.25em] h-[1.2em] border-[0.15em] border-r-0 border-[#444444]" />
        <div className="flex-1">{children}</div>
        {/* Right border decoration */}
        <span className="mr-4 w-[0.25em] h-[1.2em] border-[0.15em] border-l-0 border-[#444444]" />
      </div>
    </ButtonWithAudio>
  );
};
