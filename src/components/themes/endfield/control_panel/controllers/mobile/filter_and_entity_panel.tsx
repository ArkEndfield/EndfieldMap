import { useState } from 'react';
import { Sheet } from 'react-modal-sheet';
import EntityPanel from '../entity_panel';
import { ScrollArea } from '@/components/common/scroll_area';
import { cn } from '@/utils/style';
import { useTranslation } from 'react-i18next';
import { Filters } from '../filters';

const FilterButtonDeco = ({ className }: { className?: string }) => (
  <div className={cn('px-2 flex items-center justify-between h-full grow', className)}>
    <div className="w-1 h-1 border border-[#c4c4c4] rounded-full"></div>
    <div className="w-1 h-1 border border-[#bbbbbb] bg-[#bbbbbb] rounded-full"></div>
    <div className="w-1 h-1 border border-[#ababab] bg-[#ababab] rounded-full"></div>
    <svg
      viewBox="0 0 1024 1024"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      width="0.6em"
      height="0.6em"
      className="-rotate-90 ml-2"
    >
      <path
        d="M957.056 338.624C951.84 327.296 940.512 320 928 320L96 320c-12.512 0-23.84 7.296-29.088 18.624-5.216 11.36-3.328 24.704 4.768 34.208l416 485.344c6.08 7.104 14.944 11.2 24.288 11.2s18.208-4.096 24.288-11.2l416-485.344C960.448 363.328 962.272 349.984 957.056 338.624z"
        fill="currentColor"
      ></path>
    </svg>
  </div>
);

export const FilterControl = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('sidebar');
  const onOpen = () => setOpen(true);
  const onClose = () => setOpen(false);
  return (
    <>
      <button
        onClick={onOpen}
        className={cn(
          'fixed block bottom-2 p-3 font-black shadow-sm left-20 right-20 rounded-xl h-11',
          'bg-[#FEFB73] active:bg-[#e9e76c]',
          'flex items-center'
        )}
      >
        <FilterButtonDeco />
        <span className="px-1 shrink-0">{t('filter.title')}</span>
        <FilterButtonDeco className="rotate-180" />
      </button>
      <Sheet isOpen={open} onClose={onClose}>
        <Sheet.Container>
          <Sheet.Header className="bg-[#272727]" />
          <Sheet.Content disableDrag disableScroll className="flex flex-col bg-[#272727] text-white">
            <div className="w-full h-full overflow-hidden flex flex-col">
              <div className="shrink-0 p-2">
                <Filters />
              </div>
              <ScrollArea className="flex-1 overflow-hidden">
                <EntityPanel />
              </ScrollArea>
            </div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop
          onTap={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="pointer-events-auto"
        />
      </Sheet>
    </>
  );
};
