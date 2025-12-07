import { cn } from '@/utils/style';

const TextDeco = ({ className }: { className?: string }) => (
  <div className={cn('w-32 h-2 relative', className)}>
    <div className="bg-[linear-gradient(-45deg,#fdde55_0,#fdde55_12.5%,#fdde5500_12.5%,#fdde5500_37.5%,#fdde55_37.5%,#fdde55_62.5%,#fdde5500_62.5%,#fdde5500_87.5%,#fdde55_87.5%,#fdde55_100%)] bg-repeat bg-size-[0.2em_0.2em] absolute inset-0 top-0 left-0 right-0 bottom-0" />
    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 bg-[#fdde55] w-16"></div>
  </div>
);

export const AboutTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex flex-col justify-center items-center gap-1', className)}>
    <div className="flex flex-col items-center">
      <div className="font-serif font-black text-2xl">{children}</div>
      <TextDeco />
    </div>
    <div className="w-4 h-4 rounded-full bg-[#fdde55]" />
  </div>
);
