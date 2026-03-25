import { Logo } from '@endfieldmap/web-components';

const Temp = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
      <Logo className="text-5xl text-[#484848]/20" />
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium text-[#484848]/60 tracking-widest font-[Outfit]">COLLECTION</span>
        <span className="text-xs text-[#484848]/30">即将上线</span>
      </div>
    </div>
  );
};

export default Temp;
