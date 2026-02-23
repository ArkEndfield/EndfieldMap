import type { MapData } from '@endfieldmap/map-core';
import { useTranslation } from '@endfieldmap/map-service';
import { motion } from 'motion/react';
import { createPortal } from 'react-dom';

import { useWindow } from '@endfieldmap/web-components';

interface MapChangeAnimationProps {
  showChangeAnimation: boolean;
  mapName: MapData['name'];
}

export const MapChangeAnimation: React.FC<MapChangeAnimationProps> = ({ showChangeAnimation, mapName }) => {
  const { t } = useTranslation(['header', 'lang']);
  const currentWindow = useWindow();

  return createPortal(
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
        {t(`lang:${mapName}`, {
          defaultValue: mapName,
        })}
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
    currentWindow.document.body
  );
};
