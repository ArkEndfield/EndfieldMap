import { MapIndex } from '@endfieldmap/tools';
import { useMapChange } from '@themes/endfield/hooks/map_change';
import { MapChangeAnimation } from '@themes/endfield/ui/map_menu/map_change_animation';
import { MapButton } from '@/components/themes/endfield/ui/map_menu/button';
import { observer } from 'mobx-react-lite';
import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ButtonWithAudio } from '@/components/common/button_with_audio';
import { ChangeMapIcon, Deco7Dots, SwitchIcon } from '@/components/common/icons';
import { SoundType } from '@/const/audio_config';
import { useClickOutside } from '@/hooks/use_click_outside';
import { cn } from '@/utils/style';
import { useIsMobile } from '@/hooks/use_is_mobile';

const ChangeMap: React.FC = observer(() => {
  const { t } = useTranslation(['header', 'map']);
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { mapIndex, showChangeAnimation, changeMap } = useMapChange();
  const isMobile = useIsMobile();

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
      <motion.div
        layout
        transition={{
          duration: 0.3,
          type: 'spring',
          bounce: 0.2,
        }}
        className={cn(
          'fixed top-16 right-4 text-white bg-[#242421]/70 z-1',
          'bg-[linear-gradient(-45deg,#3a3a3a_0,#3a3a3a_12.5%,#3a3a3a00_12.5%,#3a3a3a00_37.5%,#3a3a3a_37.5%,#3a3a3a_62.5%,#3a3a3a00_62.5%,#3a3a3a00_87.5%,#3a3a3a_87.5%,#3a3a3a_100%)]',
          'bg-repeat bg-size-[0.3em_0.3em]'
        )}
      >
        <ButtonWithAudio
          soundType={SoundType.CLAIM}
          ref={triggerRef}
          onClick={togglePopover}
          className="flex w-full p-2 gap-1 hover:text-[#fdfb55] items-start"
        >
          <ChangeMapIcon className="text-xl md:text-2xl" />
          <div className="flex-1 flex flex-col items-end">
            <div
              className="text-xl md:text-2xl font-extrabold relative pl-3 [text-shadow:0_0.1em_0.2em_rgba(0,0,0,0.5)]"
              onClick={togglePopover}
            >
              <div className="absolute text-sm left-0 top-0 font-medium text-[#d2d2d2]">//</div>
              {t(`map:${mapIndex}`)}
            </div>
            <div
              className="text-[#d2d2d2] text-xs md:text-sm [text-shadow:0_0.05em_0.1em_rgba(0,0,0,0.5)]"
              onClick={togglePopover}
            >
              <span className="left-0 top-0 font-medium">/</span>
              {t(`map:${mapIndex}`)}
            </div>
          </div>
          <div className="text-xs bg-[#fffa00] p-0.5 pb-1 relative flex flex-col items-center shadow-[0_0.1em_0.5em_rgba(0,0,0,0.7)] w-4 overflow-hidden">
            <SwitchIcon className="text-[#313131] w-full" />
            <Deco7Dots className="text-[#313131]/30 w-full mx-1" />
          </div>
        </ButtonWithAudio>

        <motion.div
          ref={popoverRef}
          className={cn(
            'absolute bg-[#222222] shadow-lg overflow-hidden w-64 origin-top',
            isMobile ? 'top-full right-0 mt-2' : 'top-0 right-full mr-2'
          )}
          animate={{
            opacity: showPopover ? 1 : 0,
            x: isMobile ? '0px' : showPopover ? '0px' : '10px',
            y: isMobile ? (showPopover ? '0px' : '-10px') : '0px',
            height: showPopover ? 'auto' : '0.5rem',
          }}
          transition={{
            opacity: { duration: 0.2 },
            x: { duration: 0.2, type: 'spring', bounce: 0.2 },
            y: { duration: 0.2, type: 'spring', bounce: 0.2 },
            height: { duration: 0.25, delay: showPopover ? 0.15 : 0, type: 'spring', bounce: 0.3 },
          }}
          initial={{
            opacity: 0,
            x: isMobile ? '0px' : '10px',
            y: isMobile ? '-10px' : '0px',
            height: '0.5rem',
          }}
          style={{
            pointerEvents: showPopover ? 'auto' : 'none',
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
              <MapButton active={mapIndex === MapIndex.DUNG01} onClick={() => handleChangeMap(MapIndex.DUNG01)}>
                {t('map:dung01')}
              </MapButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
      <MapChangeAnimation showChangeAnimation={showChangeAnimation} mapIndex={mapIndex} />
    </>
  );
});

export default ChangeMap;
