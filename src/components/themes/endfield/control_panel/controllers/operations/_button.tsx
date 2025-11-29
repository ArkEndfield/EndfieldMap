import { cn } from '@/utils/style';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface OperationButtonProps {
  icon?: ReactNode;
  subtitle?: string;
  title: ReactNode;
  onClick?: () => void;
  active?: boolean;
}

export const OperationButton = ({ icon, subtitle, title, onClick, active }: OperationButtonProps) => {
  const { i18n } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [isClick, setIsClick] = useState(false);
  const locale = i18n.language;

  return (
    <button
      className="relative min-w-[6em] w-auto px-4 py-2 text-center transition-all duration-250 ease-in-out select-none rounded-xs hover:bg-[rgba(40,40,42,0.7)] active:bg-[rgba(50,50,54,0.9)]
        before:content-[''] before:absolute before:top-1/2 before:-translate-y-1/2 before:left-0 before:w-[0.75px] before:h-[40%] before:bg-[#35383d] before:transition-all before:duration-250
        after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:right-0 after:w-[0.75px] after:h-[40%] after:bg-[#35383d] after:transition-all after:duration-250
        first:before:w-[1.5px] last:after:w-[1.5px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsClick(false);
      }}
      onMouseDown={() => setIsClick(true)}
      onMouseUp={() => setIsClick(false)}
      onClick={onClick}
    >
      {/* Animation element container */}
      <div className="absolute left-0 top-0 w-full h-full z-1 pointer-events-none">
        {/* Default gradient */}
        <div
          className={cn(
            'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-none',
            'transition-[width,height,opacity,box-shadow] duration-150 ease-in-out will-change-[width,height,opacity,box-shadow]',
            isHovered
              ? 'w-[calc(100%-2px)] h-[calc(100%-2px)] opacity-0 shadow-[inset_0_0_5px_rgba(224,224,224,0.3)]'
              : 'w-0 h-0.5 opacity-100 shadow-[inset_0_0_5px_rgba(193,193,193,0)]',
            isClick || active ? 'opacity-0!' : ''
          )}
          style={{
            backgroundImage: 'none',
            backgroundPosition: 'top, bottom, left, right',
            backgroundSize: '100% 1px, 100% 1px, 1px 100%, 1px 100%',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Active gradient */}
        <div
          className={cn(
            'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-none',
            'transition-[width,height,opacity,box-shadow] duration-150 ease-in-out will-change-[width,height,opacity,box-shadow]',
            isHovered
              ? 'w-[calc(100%-2px)] h-[calc(100%-2px)] opacity-100 shadow-[inset_0_0_5px_rgba(224,224,224,0.3)]'
              : 'w-0 h-0.5 opacity-0 shadow-[inset_0_0_5px_rgba(193,193,193,0)]',
            isClick || active
              ? 'w-[calc(100%-2px)]! h-[calc(100%-2px)]! opacity-100! shadow-[inset_0_0_5px_rgba(224,224,224,0.3)]!'
              : ''
          )}
          style={{
            backgroundImage: isClick
              ? 'linear-gradient(to right, #e0e0e0 0%, rgba(224,224,224,0.6) 50%, #e0e0e0 100%), linear-gradient(to right, #e0e0e0 0%, rgba(224,224,224,0.6) 50%, #e0e0e0 100%), linear-gradient(to bottom, #e0e0e0 0%, rgba(224,224,224,0.6) 50%, #e0e0e0 100%), linear-gradient(to bottom, #e0e0e0 0%, rgba(224,224,224,0.6) 50%, #e0e0e0 100%)'
              : active
                ? 'linear-gradient(to right, #fdfb55 0%, rgba(253,251,85,0.6) 50%, #fdfb55 100%), linear-gradient(to right, #fdfb55 0%, rgba(253,251,85,0.6) 50%, #fdfb55 100%), linear-gradient(to bottom, #fdfb55 0%, rgba(253,251,85,0.6) 50%, #fdfb55 100%), linear-gradient(to bottom, #fdfb55 0%, rgba(253,251,85,0.6) 50%, #fdfb55 100%)'
                : 'none',
            backgroundPosition: 'top, bottom, left, right',
            backgroundSize: '100% 1px, 100% 1px, 1px 100%, 1px 100%',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </div>

      {/* Title */}
      <div
        className={cn(
          'relative z-2 flex items-center justify-center gap-[0.1em] transition-colors duration-250',
          isHovered ? 'text-[#e0e0e0]' : '',
          active && !isClick ? 'text-[#fdfb55]' : ''
        )}
      >
        {icon && (
          <div
            className={cn(
              'shrink-0 flex items-center justify-center w-[1em] h-[1em] transition-colors duration-250',
              active && !isClick ? 'text-[#fdfb55]' : 'text-[#707275]'
            )}
          >
            {icon}
          </div>
        )}
        <div
          className="grow text-center"
          style={{
            whiteSpace: locale.toLowerCase() !== 'en' ? 'nowrap' : 'normal',
          }}
        >
          {title}
        </div>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="relative z-2 flex justify-center">
          <svg width="100%" height="4" viewBox="0 0 200 20" preserveAspectRatio="xMidYMid meet" className="max-w-full">
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              letterSpacing="6"
              className={cn(
                'transition-colors duration-250',
                isHovered ? 'fill-[rgba(170,170,170,0.8)]' : 'fill-[#707275]',
                active && !isClick ? 'fill-[rgba(253,251,85,0.8)]' : ''
              )}
              style={{ fontSize: '16px', fontFamily: 'inherit' }}
            >
              {subtitle}
            </text>
          </svg>
        </div>
      )}
    </button>
  );
};
