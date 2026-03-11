import { useTranslation } from 'react-i18next';
import { cn } from '@endfieldmap/tools';

interface ArrowProps {
  open: boolean;
  onToggle: () => void;
}

export default function TitleArrow({ open, onToggle }: ArrowProps) {
  const { t } = useTranslation('sidebar');

  return (
    <div className="relative flex items-center justify-start overflow-visible select-none transition-[filter] duration-300 filter-[drop-shadow(0.1em_0.1em_0_rgba(255,255,255,0.2))] w-[calc(100%+17.6em)] [&:has(*:hover)_.arrow-line]:translate-x-[-0.5em]">
      {/* Start Part */}
      <div
        className="h-[2.3em] flex-1 cursor-pointer border-l-[0.1em] border-[#3a3a38] bg-linear-to-r from-[#424241] to-[#3a3a38] mb-[2.7em]"
        onClick={onToggle}
      />

      {/* Middle Part */}
      <div
        className="relative h-[5em] w-[2.3em] shrink-0 grow-0 cursor-pointer rounded-tr-[1em] rounded-bl-[1em] bg-[#3a3a38] before:absolute before:bottom-[2.3em] before:left-[-0.3em] before:h-[0.3em] before:w-[0.3em] before:bg-[radial-gradient(circle_at_0_100%,transparent_0.3em,#424241_0.3em)] before:content-[''] after:absolute after:bottom-[2.3em] after:right-[-0.3em] after:h-[0.3em] after:w-[0.3em] after:bg-[radial-gradient(circle_at_100%_0,transparent_0.3em,#424241_0.3em)] after:content-['']"
        onClick={onToggle}
      />

      {/* End Part */}
      <div
        className="relative mt-[2.7em] flex h-[2.3em] flex-1 cursor-pointer items-center justify-end bg-[#3a3a38] text-white font-semibold"
        onClick={onToggle}
      >
        {/* Background Title */}
        <div className="absolute font-['Outfit',sans-serif] text-[1.2em] -tracking-widest text-[#474645] transition-all -mr-4 z-1">
          {open ? 'FOLD' : 'UNFOLD'}
        </div>

        {/* Main Title */}
        <div className={cn('z-1 -mr-6 text-right w-16 transition-colors', open ? 'text-[#fdfb72]' : '')}>
          {open ? t('fold') : t('unfold')}
        </div>

        {/* Lines */}
        <div className="absolute bottom-0 left-[-1em] flex w-[5em] flex-col">
          <span className="relative h-[0.13em] w-[82%] bg-[#4f4f4e] before:absolute before:left-full before:top-[-0.13em] before:h-[0.13em] before:w-[0.13em] before:bg-[#4f4f4e] before:content-['']" />
          <span className="h-[0.13em] w-[72%] bg-[#4f4f4e]" />
          <span className="relative h-[0.13em] w-full bg-[#4f4f4e] before:absolute before:left-[-0.13em] before:top-0 before:h-[0.13em] before:w-[0.13em] before:bg-[#4f4f4e] before:content-['']" />
        </div>
      </div>

      {/* Arrow Part */}
      <div
        className="relative mt-11 h-0 w-0 shrink-0 grow-0 cursor-pointer border-l-[3.6em] border-t-[1.8em] border-b-[1.8em] border-l-[#3a3a38] border-t-transparent border-b-transparent before:absolute before:top-[-2.3em] before:left-[-4.1em] before:h-[0.5em] before:w-[0.5em] before:bg-[#3a3a38] before:content-[''] after:absolute after:bottom-[-2.3em] after:left-[-4.1em] after:h-[0.5em] after:w-[0.5em] after:bg-[#3a3a38] after:content-['']"
        onClick={onToggle}
        id="fold-arrow"
      />

      {/* Arrow Line */}
      <div
        className="arrow-line -ml-11 mt-11 h-[4.6em] w-[4.6em] shrink-0 grow-0 cursor-pointer bg-[#3a3a38] transition-transform duration-500 [clip-path:polygon(0%_0%,100%_50%,0%_100%,0%_calc(100%-0.5em),calc(100%-1em)_50%,0%_0.5em)]"
        onClick={onToggle}
      />
    </div>
  );
}
