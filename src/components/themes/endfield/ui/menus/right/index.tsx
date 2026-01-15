import { MapIndex } from '@endfieldmap/tools';
import { MapButton } from '@themes/endfield/ui/menus/right/button';
import { observer } from 'mobx-react-lite';
import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SwitchIcon } from '@/components/common/icons';

import { MapChangeAnimation } from '../../map_menu/map_change_animation';
import { useClickOutside } from '../../../../../../hooks/use_click_outside';
import { useMapChange } from '../../../hooks/map_change';

export const RightMenu: React.FC = observer(() => {
  const { t } = useTranslation(['header', 'map']);
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const { mapIndex, showChangeAnimation, changeMap } = useMapChange();

  const togglePopover = () => {
    setShowPopover(!showPopover);
  };

  const handleChangeMap = (newMapIndex: MapIndex) => {
    changeMap(newMapIndex);
    setShowPopover(false);
  };

  useClickOutside([popoverRef, triggerRef], () => setShowPopover(false), showPopover);

  return (
    <>
      <div className="relative text-white w-full flex-1 z-1">
        <div ref={triggerRef}>
          <div
            className="w-full text-xl h-full text-center py-3 flex items-center justify-center gap-1.5 font-extrabold"
            style={{ textShadow: '0 0 0.1em rgba(0,0,0,0.2)' }}
            onClick={togglePopover}
          >
            {t(`map:${mapIndex}`)}
            <div className="text-[#FBFA54] mt-1">
              <SwitchIcon />
            </div>
          </div>
        </div>

        <motion.div
          ref={popoverRef}
          className="absolute bg-[#222222] shadow-lg overflow-hidden top-full w-screen left-1/2 -translate-x-1/2"
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
              <MapButton active={mapIndex === MapIndex.MAP01} onClick={() => handleChangeMap(MapIndex.MAP01)}>
                {t('map:map01')}
              </MapButton>
              <MapButton active={mapIndex === MapIndex.MAP02} onClick={() => handleChangeMap(MapIndex.MAP02)}>
                {t('map:map02')}
              </MapButton>
            </div>
          </div>
        </motion.div>
      </div>
      <MapChangeAnimation showChangeAnimation={showChangeAnimation} mapIndex={mapIndex} />
    </>
  );
});
