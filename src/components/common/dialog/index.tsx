import type React from "react";
import { useEffect, useRef } from "react";

import { cn } from "@/utils/style";

interface DialogProps extends React.DetailedHTMLProps<React.DialogHTMLAttributes<HTMLDialogElement>, HTMLDialogElement> {
  open?: boolean;
  onClose?: () => void;
}

export const Dialog: React.FC<React.PropsWithChildren<DialogProps>> = ({ open, children, ...dialogProps }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // @todo 没处理动画中途切换 open 状态的问题, + AbortController
  // @todo close时直接移除dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (dialog.open) return;
      dialog.animate(
        [
          { opacity: 0, transform: 'scale(0.8)', '--backdrop-color': 'rgba(0,0,0,0)' },
          { opacity: 1, transform: 'scale(1)', '--backdrop-color': 'rgba(0,0,0,0.6)' },
        ],
        {
          duration: 150,
          fill: 'forwards',
        }
      );
      dialog.showModal();
    } else {
      if (!dialog.open) return;
      dialog.animate(
        [
          { opacity: 1, transform: 'scale(1)', '--backdrop-color': 'rgba(0,0,0,0.6)' },
          { opacity: 0, transform: 'scale(0.8)', '--backdrop-color': 'rgba(0,0,0,0)' },
        ],
        {
          duration: 150,
          fill: 'forwards',
        }
      ).onfinish = () =>{
        dialog.close();
      };
    }
  }, [open]);


  return (
    <dialog {...dialogProps} ref={dialogRef} className={cn('backdrop:bg-(--backdrop-color) fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent open:grid grid-rows-[auto_1fr_auto]', dialogProps.className)}>
      <style>
        {`@property --backdrop-color {
          syntax: '<color>';
          inherits: true;
          initial-value: rgba(0, 0, 0, 0);
        }`}
      </style>
      <header className="select-none">
        <div className="w-87 h-3.75 flex items-stretch">
          <div className="w-12.75 bg-[#ffff21]" />
          <div
            className={cn(
              'flex-1 bg-[#999] text-[#363636] text-[0.5rem] line-height-[0.9375rem] px-1 font-bold flex justify-between items-center',
              'after:content-[\'+\'] after:border after:w-2.5 after:h-2.5 after:inline-flex after:items-center after:justify-center',
            )}
          >
            <span>▼<i>//</i> ARKNIGHTS:ENDFIELD</span>
          </div>
        </div>
        <main className="h-15.75 bg-[#363636] grid grid-cols-[4.75rem_1fr]">
          <div className="bg-[#484848] text-[#fafafa] grid place-content-center">
            <span>icon</span>
          </div>
          <div className="flex items-center pl-6 text-[2.15625rem] font-bold text-white leading-none overflow-hidden">
            title
            <span className="text-[8.90625rem] text-[rgba(255,255,255,0.2)] mix-blend-overlay font-bold ml-2 tracking-[-0.875rem]">ENDFIELD</span>
          </div>
        </main>
        <div
          className="bg-[#ffff21] text-[#363636] h-9 w-9 font-bold absolute top-0 right-0 grid place-content-center text-[1.5rem]"
          onClick={dialogProps.onClose}
        >
          <svg width="1em" height="1em" viewBox="0 0 205 205" fill="currentColor" fillRule="evenodd">
            <path d="M0 25L25 0L205 180L180 205ZM25 205L0 180L180 0L205 25Z" />
          </svg>
        </div>
        <div
          className="relative z-10 h-1.5 after:border-t-12 after:border-x-12 after:box-content after:border-t-[#ffff1b] after:border-x-transparent after:absolute after:-bottom-2 after:left-13 after:block"
          style={{
            background: 'linear-gradient(90deg, #ffff1b, #ffff1b 50%, #d3d3d3 50%)',
            filter: 'drop-shadow(0 0 0.1875rem rgba(0, 0, 0, 0.5))',
          }}
        />
      </header>
      <main
        className={cn(
          'bg-white p-[1.40625rem] pb-11.25 relative',
          'after:bottom-0 after:right-[1.275rem] after:h-1 after:w-60 after:block after:absolute after:bg-[linear-gradient(90deg,#00ffa2,#00ffa2_42.5%,#ffff21_42.5%,#ffff21_79.2%,#ff00f0_79.2%)]'
        )}
        style={{ 
          backgroundImage: `repeating-linear-gradient(-45deg,transparent,transparent 2px,#ccc2 2px,#ccc2 3px)`,
        }}
      >
        {children}
      </main>
      <footer className="h-3.75 bg-[#ababab] mr-9 px-4 flex justify-start items-center">
        <div className="h-2 w-2 bg-[#838383]" />
        <div
          className="h-2 w-2 border border-[#838383] ml-0.5 py-px"
          style={{ 
            maskImage: 'linear-gradient(#fff, #fff calc(var(--spacing) * .5), transparent calc(var(--spacing) * .5), transparent calc(var(--spacing) * 1.5), #fff calc(var(--spacing) * 1.5))'
          }}
        />
        <div className="h-2 w-12 ml-1" style={{ backgroundImage: `repeating-linear-gradient(-45deg,transparent,transparent 1px,#838383 1px,#838383 2px)`, }} />
      </footer>
    </dialog>
  )
}
