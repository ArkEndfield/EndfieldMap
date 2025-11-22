export interface ItemProps {
  name?: string;
  icon?: React.ReactElement;
  count?: number;
}

export const Item = ({ icon, name = '', count = 0 }: ItemProps) => {
  return (
    <div className="h-16 relative bg-[#414140]">
      <div className="absolute left-1 top-1 flex items-stretch h-0.5 gap-0.5 z-1">
        <span className="bg-[#FDFBFC] w-2"></span>
        <span className="bg-[#FDFBFC] w-0.5"></span>
        <span className="bg-[#FDFBFC] w-0.5"></span>
      </div>
      <div className="w-full h-full flex items-center justify-center">{icon}</div>
      <div className="absolute left-0 right-0 bottom-0 text-xs py-0.5 font-[Outlet] font-bold text-center z-1 bg-linear-to-b from-[#00000000] to-[#0000002f]">
        {count}
      </div>
      <div className="absolute left-0.5 -bottom-3.5 z-2 grid grid-cols-2 gap-0.5">
        <span className="bg-amber-300 w-0.5 h-0.5"></span>
        <span className="bg-amber-300 w-0.5 h-0.5"></span>
        <span className="bg-amber-300 w-0.5 h-0.5"></span>
        <span className="bg-amber-300 w-0.5 h-0.5"></span>
      </div>
      <div className="absolute right-0.5 -bottom-3.5 z-2 grid grid-cols-2 gap-0.5">
        <span className="bg-amber-300 w-0.5 h-0.5"></span>
        <span className="bg-amber-300 w-0.5 h-0.5"></span>
        <span className="bg-amber-300 w-0.5 h-0.5"></span>
        <span className="bg-amber-300 w-0.5 h-0.5"></span>
      </div>
      <div className="w-[110%] relative left-1/2 -translate-x-1/2 bg-[#FDFBFC] text-center text-sm font-bold truncate z-1 h-5"></div>
      <div className="w-[110%] absolute -bottom-5 left-1/2 -translate-x-1/2 text-center text-[#0E0200] text-sm font-bold truncate z-2">
        {name}
      </div>
    </div>
  );
};
