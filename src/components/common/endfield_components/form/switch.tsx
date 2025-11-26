import { motion } from 'motion/react';
import { cn } from '@/utils/style';
import { useTranslation } from 'react-i18next';

export interface EndfieldSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const EndfieldSwitch = ({ checked, onChange, disabled, className }: EndfieldSwitchProps) => {
  const { t } = useTranslation('common');

  const changeValue = (value: boolean) => {
    if (disabled) return;
    if (value === checked) return;
    onChange(value);
  };

  return (
    <div className={cn('flex items-center relative shadow-[0_0_3px_#00000044] rounded-full bg-[#5C5A5D]', className)}>
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
      <button
        onClick={() => changeValue(true)}
        disabled={disabled}
        className={cn(
          'flex-1 py-1 px-4 flex justify-center items-center relative z-2',
          checked ? 'text-[#373537]' : 'text-[#B3B1B4]'
        )}
      >
        {t('on')}
      </button>
      <button
        onClick={() => changeValue(false)}
        disabled={disabled}
        className={cn(
          'flex-1 py-1 px-4 flex justify-center items-center relative z-2',
          checked ? 'text-[#B3B1B4]' : 'text-[#373537]'
        )}
      >
        {t('off')}
      </button>
    </div>
  );
};
