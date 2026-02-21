import { useTranslation } from '@endfieldmap/map-service';
import { motion } from 'motion/react';

import { EditIcon, LogoutIcon, PlusIcon } from '@/components/common/icons';
import { ActionButton } from '@/components/features/user/info/action_button';

// ==================== 操作面板组件 ====================
interface ActionPanelProps {
  onBindUid?: () => void;
  onEditInfo?: () => void;
  onLogout?: () => void;
}

export const ActionPanel = ({ onBindUid, onEditInfo, onLogout }: ActionPanelProps) => {
  const { t } = useTranslation('header');
  return (
    <motion.div
      className="flex flex-col items-end gap-4 w-40 shrink-0"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      {/* 标题区域 */}
      <div className="text-right">
        <h2 className="text-[#FDFB73] text-3xl font-bold tracking-wider">{t('user.info.title')}</h2>
        <p className="text-white/30 text-xs mt-1 font-[Outfit] tracking-widest">PROFILE</p>
      </div>

      {/* 操作按钮组 */}
      <div className="flex flex-col gap-2 w-full mt-auto">
        <ActionButton variant="primary" icon={<PlusIcon />} onClick={onBindUid} className="w-full">
          {t('user.uid.bind')}
        </ActionButton>
        <ActionButton variant="secondary" icon={<EditIcon />} onClick={onEditInfo} className="w-full">
          {t('user.info.edit')}
        </ActionButton>
        <ActionButton variant="danger" icon={<LogoutIcon />} onClick={onLogout} className="w-full">
          {t('user.logout')}
        </ActionButton>
      </div>
    </motion.div>
  );
};
