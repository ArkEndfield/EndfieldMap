import { LocalStorageDB, LocalStorageKey, MapIndex } from '@endfieldmap/tools';
import { observer } from 'mobx-react-lite';
import { motion } from 'motion/react';
import { useEffect,useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { SwitchIcon } from '@/components/common/icons';
import { useAdapter } from '@/hooks/use_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { cn } from '@/utils/style';

import { MapButton } from './button';

export const RightMenu: React.FC = observer(() => {
  const { t } = useTranslation(['header', 'map']);
  const [showPopover, setShowPopover] = useState(false);
  const isMobile = useIsMobile();
  const [showChangeAnimation, setShowChangeAnimation] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const { adapter, renderMap } = useAdapter();
  const mapIndex = adapter.currentMapIndex;

  const togglePopover = () => {
    setShowPopover(!showPopover);
  };

  const changeMap = (mapIndex: MapIndex) => {
    renderMap(mapIndex);
    LocalStorageDB.set<MapIndex>(LocalStorageKey.MAP_CURRENT_MAP, mapIndex);
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

    document.addEventListener('click', clickOutside);
    return () => {
      document.removeEventListener('click', clickOutside);
    };
  }, [showPopover]);

  return (
    <>
      <div className={cn('relative text-white w-[12em] z-1', isMobile && 'w-full flex-1')}>
        <div ref={triggerRef} className={cn(!isMobile && 'flex flex-col items-end pb-1 pt-1 px-4')}>
          {!isMobile && (
            <button className="text-xs" onClick={togglePopover}>
              <div className="bg-[#1E1E1D] h-3 pl-1.5 z-0 relative flex items-center gap-1">
                <div className="text-[#FBFA54] mt-1">
                  <SwitchIcon />
                </div>
                <div className="mt-1 pr-1">{t('header:map.change_map')}</div>
              </div>
              <div
                className="bg-[#1E1E1D] -z-1 relative h-[0.3rem] mb-[-0.01em]"
                style={{
                  clipPath: 'polygon(0% 0%, 100% 0%, 100% 0.3rem, 0.3rem 100%)',
                }}
              />
            </button>
          )}
          <div
            className={cn(
              'font-extrabold',
              isMobile
                ? 'w-full text-xl h-full text-center py-3 flex items-center justify-center gap-1.5'
                : 'text-2xl hover:text-[#fdfb55] cursor-pointer'
            )}
            style={{ textShadow: '0 0 0.1em rgba(0,0,0,0.2)' }}
            onClick={togglePopover}
          >
            {t(`map:${mapIndex}`)}
            {isMobile && (
              <div className="text-[#FBFA54] mt-1">
                <SwitchIcon />
              </div>
            )}
          </div>
        </div>

        <motion.div
          ref={popoverRef}
          className={cn(
            'absolute bg-[#222222] shadow-lg overflow-hidden top-full',
            isMobile ? 'w-screen left-0' : 'right-0 w-64'
          )}
          animate={{
            opacity: showPopover ? 1 : 0,
            y: showPopover ? '2px' : '-10px',
            display: showPopover ? 'block' : 'none',
          }}
          transition={{
            duration: 0.3,
            type: 'spring',
            bounce: 0.3,
          }}
          initial={{
            opacity: 0,
            y: '-10px',
            display: 'none',
          }}
        >
          <div className="py-2 px-4 h-full relative">
            {/* Left line */}
            <div className="absolute left-2 top-0 bottom-0">
              <div className="absolute w-[1.5px] h-[1.5px] bg-[#f9f853] top-[0.5em]" />
              <div className="absolute w-[1.5px] bg-[#f9f853] top-[0.8em] bottom-[0.5em]" />
            </div>
            {/* Right line */}
            <div className="absolute right-2 top-0 bottom-0">
              <div className="absolute w-[1.5px] h-[1.5px] bg-[#f9f853] top-[0.5em]" />
              <div className="absolute w-[1.5px] bg-[#f9f853] top-[0.8em] bottom-[0.5em]" />
            </div>

            <div className="flex flex-col gap-1 h-full justify-between">
              <MapButton active={mapIndex === MapIndex.MAP01} onClick={() => changeMap(MapIndex.MAP01)}>
                {t('map:map01')}
              </MapButton>
              <MapButton active={mapIndex === MapIndex.MAP02} onClick={() => changeMap(MapIndex.MAP02)}>
                {t('map:map02')}
              </MapButton>
            </div>
          </div>
        </motion.div>
      </div>
      {createPortal(
        <motion.div
          className="fixed top-0 left-0 right-0 flex flex-col items-center bg-linear-to-b from-[rgba(0,0,0,0.8)] via-[rgba(0,0,0,0.4)] to-[rgba(0,0,0,0)] pb-4 z-11"
          style={{ paddingTop: 'calc(4em + 1rem)' }}
          animate={{
            opacity: showChangeAnimation ? 1 : 0,
            y: showChangeAnimation ? 0 : '-10px',
            display: showChangeAnimation ? 'flex' : 'none',
          }}
          transition={{
            duration: 0.3,
            type: 'spring',
            bounce: 0.3,
          }}
          initial={{
            opacity: 0,
            y: '-10px',
            display: 'none',
          }}
        >
          <div className="absolute -bottom-10 bg-[url('/images/bg/bg_solution_machine_2.png')] bg-contain -z-1 w-42 h-42" />
          <div className="absolute -bottom-10 bg-[url('/images/bg/bg_energybar.png')] bg-contain -z-1 w-42 h-42" />

          <motion.div
            className="text-4xl font-bold text-white"
            style={{ textShadow: '0 0 0.1em rgba(0,0,0,0.2)' }}
            animate={{
              y: showChangeAnimation ? 0 : '1em',
            }}
            transition={{
              duration: 0.8,
              type: 'spring',
              bounce: 0.3,
            }}
            initial={{
              y: '1em',
            }}
          >
            {t(`map:${mapIndex}`)}
          </motion.div>

          <motion.div
            className="bg-[#272727] text-[#EDEBED] text-sm px-5 relative z-1"
            animate={{
              y: showChangeAnimation ? 0 : '1.5em',
            }}
            transition={{
              duration: 0.8,
              type: 'spring',
              bounce: 0.3,
            }}
            initial={{
              y: '1.5em',
            }}
          >
            {t('header:map.map_change')}
          </motion.div>

          <motion.div
            className="bg-linear-to-r from-[rgba(252,250,84,0)] via-[rgba(252,250,84,0.5)] to-[rgba(252,250,84,0)] h-1"
            animate={{
              width: showChangeAnimation ? '80%' : 0,
            }}
            transition={{
              duration: 0.5,
              type: 'spring',
              bounce: 0.3,
              delay: 0.1,
            }}
            initial={{
              width: 0,
            }}
          />

          <motion.div
            className="absolute bottom-3 flex h-3 gap-0.5"
            animate={{
              width: showChangeAnimation ? '8rem' : 0,
            }}
            transition={{
              duration: 0.5,
              type: 'spring',
              bounce: 0.3,
              delay: 0.1,
            }}
            initial={{
              width: 0,
            }}
          >
            <div className="shrink-0 grow-0 flex flex-col gap-px w-0.5">
              <div className="bg-white h-px shrink-0 grow-0" />
              <div className="bg-white flex-1" />
              <div className="bg-white h-px shrink-0 grow-0" />
            </div>
            <div className="bg-[#FDFB72] h-1 flex-1 mt-1" />
            <div className="shrink-0 grow-0 flex flex-col gap-px w-0.5">
              <div className="bg-white h-px shrink-0 grow-0" />
              <div className="bg-white flex-1" />
              <div className="bg-white h-px shrink-0 grow-0" />
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </>
  );
});
