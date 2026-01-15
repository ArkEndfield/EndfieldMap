import { cn } from '@/utils/style';

export const Deco = () => (
  <>
    <div className="z-0 absolute -top-14 left-1/2 -translate-x-1/2 w-full text-[8rem] font-[Outfit] font-bold text-center text-[rgba(70,70,70,0.4)] tracking-[-0.08em] select-none pointer-events-none">
      ZMD
    </div>
    <div className="z-0 absolute top-1/2 -right-0.5 font-[Outfit] font-bold text-center text-[rgba(70,70,70,0.4)] [writing-mode:vertical-lr] transform translate-y-[-50%] text-xs tracking-[0.5em] select-none pointer-events-none">
      ZMDMAPS
    </div>
  </>
);

export const StrokeSVGFilter = () => (
  <svg width="0" height="0" className="absolute -z-1">
    <defs>
      <filter id="stroke-filter" x="-50%" y="-50%" width="200%" height="200%">
        <feMorphology in="SourceAlpha" result="DILATED" operator="dilate" radius="3" />
        <feFlood floodColor="rgba(255,255,255,0.5)" floodOpacity="1" result="FLOOD" />
        <feComposite in="FLOOD" in2="DILATED" operator="in" result="OUTLINE" />
        <feMerge>
          <feMergeNode in="OUTLINE" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </svg>
);

export const ClipSquare = ({ className }: { className?: string }) => (
  <div
    className={cn('h-4 bg-[#3E3E3E] relative', className)}
    style={{
      clipPath: 'polygon(0 0, calc(100% - 0.75em) 0, 100% 0.75em, 100% 100%, 0 100%)',
    }}
  />
);
