import { motion } from 'motion/react';

import { ActionButton } from './action_button';
import { CheckIcon, LoginIcon, LogoutIcon, SwitchIcon } from './icons';

// ==================== 操作面板组件 ====================
interface ActionPanelProps {
  syncedDataCount: number;
  onLogout?: () => void;
  onLogin?: () => void;
  onSwitchUid?: () => void;
}

export const ActionPanel = ({ syncedDataCount, onLogout, onLogin, onSwitchUid }: ActionPanelProps) => (
  <motion.div
    className="flex flex-col items-end gap-4 w-40 shrink-0"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay: 0.15 }}
  >
    {/* 标题区域 */}
    <div className="text-right">
      <h2 className="text-[#FDFB73] text-3xl font-bold tracking-wider">个人信息</h2>
      <p className="text-white/30 text-xs mt-1 font-mono tracking-widest">PROFILE_SYSTEM</p>
    </div>

    {/* 操作按钮组 */}
    <div className="flex flex-col gap-2 w-full mt-auto">
      <ActionButton variant="primary" icon={<LogoutIcon className="w-full h-full" />} onClick={onLogout} className="w-full">
        登出
      </ActionButton>
      <ActionButton variant="primary" icon={<LoginIcon className="w-full h-full" />} onClick={onLogin} className="w-full">
        登录
      </ActionButton>
      <ActionButton variant="secondary" icon={<SwitchIcon className="w-full h-full" />} onClick={onSwitchUid} className="w-full">
        切换UID
      </ActionButton>
    </div>

    {/* 同步数据统计 */}
    <div className="flex items-center gap-2 text-sm mt-auto">
      <CheckIcon className="w-4 h-4 text-[#01ffa2]" />
      <span className="text-white/80">
        已同步 <span className="text-[#FDFB73] font-bold">{syncedDataCount}</span> 条数据
      </span>
    </div>
  </motion.div>
);
