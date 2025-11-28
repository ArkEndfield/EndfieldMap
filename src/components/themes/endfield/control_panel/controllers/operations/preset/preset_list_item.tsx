import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/utils/style';
import { numberPadString } from '@endfieldmap/tools';

export interface PresetListItemProps {
  index: number;
  title: string;
  active?: boolean;
  select?: boolean;
  onClick?: () => void;
  onToggleSelect?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

const checkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 0.2, ease: 'easeOut' as const } },
  exit: { pathLength: 0, opacity: 0, transition: { duration: 0.15, ease: 'easeIn' as const } },
};

const getHandledFunction = (func?: (e?: MouseEvent) => void) => {
  if (!func) return void 0;
  return function (e: MouseEvent) {
    e.stopPropagation();
    func(e);
  };
};

export const PresetListItem = ({
  index,
  title,
  active,
  select,
  onClick,
  onRename,
  onDelete,
  onToggleSelect,
}: PresetListItemProps) => {
  const { t } = useTranslation();
  const handleClick = () => {
    if (!active) onClick?.();
  };
  return (
    <div className="w-full h-[52px] relative font-[Outfit] overflow-hidden flex items-center" onClick={handleClick}>
      <div className="absolute top-0 left-0 w-full h-full text-[#525252] text-[25px]">
        <div className="absolute top-0 left-0 rounded-xs bg-linear-[91.97deg] from-[#a5a5a5] to-[#454545] w-full h-full" />
        <div className="absolute -top-25 -left-6 rounded-full border-9 border-black box-border w-37 h-37 shrink-0 opacity-15" />
        <div
          className={cn(
            'absolute top-0 left-0 rounded-l-xs bg-[#fcfb1e] h-full shrink-0 transition-[width]',
            active ? 'w-1.5' : 'w-0'
          )}
        />
        <div className="absolute -right-8 -top-8">
          <div className="w-18 h-18 rounded-full border-15 border-black/5" />
        </div>
      </div>

      <div className="relative ml-3 h-full py-1 text-[#525252] flex-1 w-full flex items-center gap-1">
        <div className="rounded-[3px] relative rounded-tr-[14px] bg-[#eaeaea]/75 h-full w-39 flex items-center">
          <div className="absolute bottom-2.5 w-full bg-[#f5f5f5]/30 h-px" />
          <div className="absolute bottom-1 w-full bg-[#f5f5f5]/30 h-1" />
          <svg
            className="absolute top-0.5 left-1"
            width="32"
            height="6"
            viewBox="0 0 32 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 2x2 网格点 */}
            <rect x="0" y="1" width="1.5" height="1.5" fill="#9a9a9a" />
            <rect x="2" y="1" width="1.5" height="1.5" fill="#9a9a9a" />
            <rect x="0" y="3" width="1.5" height="1.5" fill="#9a9a9a" />
            <rect x="2" y="3" width="1.5" height="1.5" fill="#9a9a9a" />
            {/* ENDFIELD 文字 */}
            <text x="5" y="4.2" fill="#5e5e5e" fontSize="4" fontFamily="Outfit" letterSpacing="0.5">
              ENDFIELD
            </text>
          </svg>
          <div className="pt-0.5 w-full">
            <div className="relative z-1 flex items-center w-full">
              <div className="absolute -z-1 left-9 top-1/2 -translate-1/2 rounded-full w-7 h-7 bg-linear-270 from-white/10 via-[#fcfb1e]_51.92% to-[#fcfb1e]" />
              <button
                className="absolute -translate-1/2 top-1/2 w-4 h-4 bg-[#676767] border border-[#EEEEEE] shadow-[0_0_0_1px_#C5C5C5] rounded-full flex items-center justify-center"
                onClick={getHandledFunction(onToggleSelect)}
              >
                <AnimatePresence>
                  {select ? (
                    <motion.svg
                      key="check"
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <motion.path
                        d="M2 6L5 9L10 3"
                        stroke="#FCFB1E"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        variants={checkVariants}
                      />
                    </motion.svg>
                  ) : null}
                </AnimatePresence>
              </button>
              <div className="realative font-[Outfit] font-bold ml-2.5 text-2xl shrink-0 min-w-7">
                {numberPadString(index, 2)}
              </div>
              <div className="font-bold ml-1 text-sm flex-1 overflow-hidden whitespace-nowrap text-ellipsis">
                {title}
              </div>
            </div>
          </div>
        </div>
        <div className="self-stretch h-full flex-1 shrink-0 flex items-end justify-end gap-1 mr-2 relative">
          <div className="absolute top-0 left-2 right-0 flex gap-1">
            <div className="w-px h-px bg-[#fcfb1e]" />
            <div className="w-3 h-px bg-[#d9d9d9]/30" />
            <div className="flex-1 h-px bg-[#d9d9d9]/30" />
          </div>

          <button
            onClick={getHandledFunction(onRename)}
            className="bg-[#323232] hover:bg-[#282828] active:bg-[#323232] rounded-full text-[#fcfb1e] py-1 px-2 text-xs w-14"
          >
            {t('rename')}
          </button>
          <button
            onClick={getHandledFunction(onDelete)}
            className="bg-[#323232] hover:bg-[#282828] active:bg-[#323232] rounded-full text-[#fcfb1e] py-1 px-2 text-xs w-14"
          >
            {t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
};
