import { useTranslation } from '@endfieldmap/map-service';
import { motion } from 'motion/react';

import { ButtonWithAudio } from '@/components/common/button_with_audio';
import type { EndfieldSwitchProps } from '@/components/common/endfield_components/types/form';
import { cn } from '@/utils/style';

export const EndfieldSwitch = ({ checked, onChange, disabled, className, onText, offText }: EndfieldSwitchProps) => {
  const { t } = useTranslation('common');

  const changeValue = (value: boolean) => {
    if (disabled) return;
    if (value === checked) return;
    onChange(value);
  };

  return (
    <div
      className={cn(
        'flex items-center w-full relative shadow-[0_0_3px_#00000044] rounded-full bg-[#5C5A5D]',
        className
      )}
    >
      <motion.div
        className="absolute left-0 h-full rounded-full bg-[#EDEBEC] shadow-[0_0_3px_#00000066] z-1"
        style={{
          width: 'calc(50% + 0.5em)',
        }}
        initial={{
          x: checked ? '0%' : 'calc(100% - 1em)',
        }}
        animate={{
          x: checked ? '0%' : 'calc(100% - 1em)',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      ></motion.div>
      <ButtonWithAudio
        onClick={() => changeValue(true)}
        disabled={disabled}
        className={cn(
          'flex-1 py-1 px-4 flex justify-center items-center relative z-2',
          checked ? 'text-[#373537]' : 'text-[#B3B1B4]'
        )}
      >
        {onText ?? t('on')}
      </ButtonWithAudio>
      <ButtonWithAudio
        onClick={() => changeValue(false)}
        disabled={disabled}
        className={cn(
          'flex-1 py-1 px-4 flex justify-center items-center relative z-2',
          checked ? 'text-[#B3B1B4]' : 'text-[#373537]'
        )}
      >
        {offText ?? t('off')}
      </ButtonWithAudio>
    </div>
  );
};
