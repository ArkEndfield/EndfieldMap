import { cn } from "@/utils/style";

export const SideButton = ({ children, onClick, position = 'left' }: { children: React.ReactNode; onClick: () => void, position?: 'left' | 'right' }) => (
  <button
    onClick={onClick}
    className={
        cn(
            "fixed bottom-2 z-2 w-11 h-11 flex flex-col items-center justify-center rounded-sm bg-[#3E3E3C] shadow-[0_0_5px_#00000099] text-xs border-box p-1 text-white",
            position === 'left' ? 'left-4' : 'right-4',
        )
    }
  >
    <div className="absolute -left-[3px] -right-[3px] -bottom-[3px] -top-[3px] rounded-md border-2 border-[#3E3E3C] z-[-1] shadow-sm"></div>
    {children}
  </button>
);
