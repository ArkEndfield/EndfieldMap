import { domEventListener, MapIndex } from '@endfieldmap/tools';
import { observer } from 'mobx-react-lite';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { SwitchIcon } from '@/components/common/icons';
import { useAdapter } from '@/hooks/use_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { cn } from '@/utils/style';

const MapButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    className={cn(
      'px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
      'hover:bg-white/10',
      active ? 'bg-white/20 text-white shadow-sm' : 'text-white/70 hover:text-white active:bg-white/15 active:scale-95'
    )}
    onClick={onClick}
  >
    {children}
  </button>
);

export const MapSelector: React.FC = observer(() => {
  const { t } = useTranslation(['header', 'map']);
  const [showPopover, setShowPopover] = useState(false);
  const isMobile = useIsMobile();
  const [showChangeAnimation, setShowChangeAnimation] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { dataService } = useAdapter();
  const mapIndex = dataService.mapStateDataService.currentMap.value;

  const togglePopover = () => {
    setShowPopover(!showPopover);
  };

  const changeMap = (mapIndex: MapIndex) => {
    dataService.mapStateDataService.currentMap.value = mapIndex;
    setShowPopover(false);
    setShowChangeAnimation(true);

    setTimeout(() => {
      setShowChangeAnimation(false);
    }, 1500);
  };

  useEffect(() => {
    const clickOutside = (event: MouseEvent) => {
      if (!showPopover) return;

      const target = event.target as Node;
      if (
        popoverRef.current &&
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        !popoverRef.current.contains(target)
      ) {
        setShowPopover(false);
      }
    };

    return domEventListener(document, 'click', clickOutside);
  }, [showPopover]);

  return (
    <>
      <div className={cn('relative text-white', isMobile && 'w-full flex-1')}>
        <button
          ref={triggerRef}
          className={cn(
            'flex items-center gap-2 px-4 transition-all duration-200',
            'bg-black/40 backdrop-blur-2xl',
            'border border-white/20',
            'shadow-lg shadow-black/20',
            'hover:bg-black/50 active:bg-black/60 active:scale-95',
            isMobile
              ? 'w-full justify-center text-lg font-semibold h-12 rounded-full'
              : 'w-32 justify-center h-14 rounded-lg'
          )}
          onClick={togglePopover}
        >
          <span className={cn('font-medium', isMobile ? 'text-lg' : 'text-base')}>{t(`map:${mapIndex}`)}</span>
          <SwitchIcon />
        </button>

        <motion.div
          ref={popoverRef}
          className={cn(
            'absolute overflow-hidden top-full mt-2',
            'bg-black/40 rounded-xl shadow-xl shadow-black/20',
            'border border-white/20',
            'backdrop-blur-2xl transform-gpu',
            isMobile ? 'w-screen left-1/2 -translate-x-1/2' : 'right-0 w-56'
          )}
          animate={{
            opacity: showPopover ? 1 : 0,
            y: showPopover ? 0 : -10,
            scale: showPopover ? 1 : 0.95,
            display: showPopover ? 'block' : 'none',
          }}
          transition={{
            duration: 0.2,
            type: 'spring',
            bounce: 0.25,
          }}
          initial={{
            opacity: 0,
            y: -10,
            scale: 0.95,
            display: 'none',
          }}
        >
          <div className="p-2 flex flex-col gap-1">
            <MapButton active={mapIndex === MapIndex.MAP01} onClick={() => changeMap(MapIndex.MAP01)}>
              {t('map:map01')}
            </MapButton>
            <MapButton active={mapIndex === MapIndex.MAP02} onClick={() => changeMap(MapIndex.MAP02)}>
              {t('map:map02')}
            </MapButton>
          </div>
        </motion.div>
      </div>

      {createPortal(
        <motion.div
          className={cn(
            'fixed top-14 left-0 right-0 flex flex-col items-center justify-center z-11',
            'pointer-events-none'
          )}
          animate={{
            opacity: showChangeAnimation ? 1 : 0,
            y: showChangeAnimation ? 0 : -20,
            display: showChangeAnimation ? 'flex' : 'none',
          }}
          transition={{
            duration: 0.3,
            type: 'spring',
            bounce: 0.25,
          }}
          initial={{
            opacity: 0,
            y: -20,
            display: 'none',
          }}
        >
          <motion.div
            className={cn(
              'mt-6 px-8 py-4 rounded-2xl',
              'bg-black/60',
              'border border-white/20',
              'shadow-xl shadow-black/30',
              'backdrop-blur-2xl transform-gpu'
            )}
            animate={{
              scale: showChangeAnimation ? 1 : 0.9,
              opacity: showChangeAnimation ? 1 : 0,
            }}
            transition={{
              duration: 0.4,
              type: 'spring',
              bounce: 0.25,
            }}
            initial={{
              scale: 0.9,
              opacity: 0,
            }}
          >
            <div className="text-2xl font-semibold text-white text-center mb-1">{t(`map:${mapIndex}`)}</div>
            <div className="text-xs text-white/60 text-center">{t('header:map.map_change')}</div>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </>
  );
});
