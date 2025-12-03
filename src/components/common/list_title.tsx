import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/utils/style';

interface ListTitleProps {
  children: ReactNode;
  backTitle?: ReactNode;
  right?: ReactNode;
  color?: string;
  bgColor?: string;
  solidWidth?: string | number;
  solid?: boolean;
  bracket?: boolean;
  titleFontSize?: string;
  backTitleFontSize?: string;
  className?: string;
}

export default function ListTitle({
  children,
  backTitle,
  right,
  color = '#FDFD59',
  bgColor = '#FDFD59',
  solidWidth = '2rem',
  solid = true,
  bracket = false,
  titleFontSize = '1.5rem',
  backTitleFontSize = '2.25rem',
  className = '',
}: ListTitleProps) {
  const gradientPattern = `linear-gradient(-45deg, ${bgColor}, transparent 20.58050117%, ${bgColor} 0, ${bgColor} 29.41949883%, transparent 0, transparent 70.58050117%, ${bgColor} 0, ${bgColor} 79.41949883%, transparent 0, transparent)`;

  const titleWrapperStyle: CSSProperties = {
    marginLeft: solid ? solidWidth : 0,
  };

  const titleContainerStyle: CSSProperties = {
    color: color,
  };

  const bracketBeforeAfterStyle = {
    width: '0.3rem',
    borderColor: color,
  };

  const backTitleStyle: CSSProperties = {
    fontSize: backTitleFontSize,
    backgroundImage: gradientPattern,
  };

  const titleStyle: CSSProperties = {
    fontSize: titleFontSize,
  };

  const solidLineStyle: CSSProperties = {
    width: solidWidth,
    backgroundColor: color,
  };

  const dashedLineStyle: CSSProperties = {
    backgroundImage: gradientPattern,
  };

  return (
    <div className={cn('relative pt-3', className)}>
      <div className="flex items-end" style={titleWrapperStyle}>
        <div className={cn('relative flex-1', bracket && 'w-fit flex-none mr-auto px-2')} style={titleContainerStyle}>
          {bracket && (
            <>
              <span
                className="absolute border-3 left-0 border-r-0! bottom-1 h-4"
                style={{
                  ...bracketBeforeAfterStyle,
                }}
              />
              <span
                className="absolute border-3 right-0 border-l-0! bottom-1 h-4"
                style={{
                  ...bracketBeforeAfterStyle,
                }}
              />
            </>
          )}
          {backTitle && (
            <div
              className="absolute -z-1 w-fit bottom-0 left-0 text-center bg-clip-text bg-repeat text-transparent bg-size-[0.1em_0.1em] opacity-50 translate-x-1 font-bold"
              style={backTitleStyle}
            >
              {backTitle}
            </div>
          )}
          <div className="font-bold w-fit" style={titleStyle}>
            {children}
          </div>
        </div>
        {right}
      </div>
      {solid && (
        <div className="flex h-2 items-stretch">
          <div style={solidLineStyle}></div>
          <div className="flex-1 bg-repeat bg-size-[0.2em_0.2em]" style={dashedLineStyle}></div>
        </div>
      )}
    </div>
  );
}
