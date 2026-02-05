import { motion } from 'motion/react';

import { CheckIcon } from '@/components/features/user/info/icons';
import { cn } from '@/utils/style';
import type { UidInfo } from '@eftypes/user';

// ==================== 用户头像组件 ====================
interface UserAvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserAvatar = ({ src, alt = '用户头像', size = 'lg', className }: UserAvatarProps) => {
  const sizeStyles = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  return (
    <div className={cn('relative', className)}>
      {/* 外层装饰边框 */}
      <div
        className={cn(
          'rounded-full p-0.5',
          'bg-linear-to-br from-[#01ffa2] via-[#FDFB73] to-[#ff1aac]',
          sizeStyles[size]
        )}
      >
        {/* 内层深色边框 */}
        <div className="w-full h-full rounded-full bg-[#111] p-0.5">
          {/* 头像图片 */}
          <img src={src} alt={alt} className="w-full h-full rounded-full object-cover" />
        </div>
      </div>
    </div>
  );
};

// ==================== 同步状态徽章 ====================
interface SyncBadgeProps {
  isSynced: boolean;
  className?: string;
}

export const SyncBadge = ({ isSynced, className }: SyncBadgeProps) => (
  <span
    className={cn('inline-flex items-center gap-1 text-xs', isSynced ? 'text-[#01ffa2]' : 'text-white/50', className)}
  >
    {isSynced && <CheckIcon className="w-3 h-3" />}
    {isSynced ? '已同步' : '未同步'}
  </span>
);

// ==================== 用户资料组件 ====================
interface UserProfileProps {
  uidInfo?: UidInfo;
}

export const UserProfile = ({ uidInfo }: UserProfileProps) => (
  <motion.div
    className={cn(
      'relative flex flex-col items-center gap-3 w-48 shrink-0 py-5 px-4',
      'bg-black/10',
      '[clip-path:polygon(16px_0,100%_0,100%_calc(100%-16px),calc(100%-16px)_100%,0_100%,0_16px)]'
    )}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay: 0.1 }}
  >
    {/* 左上角斜切黄色描边 */}
    <div className="absolute left-0 top-4 w-[22.6px] h-0.5 bg-[#FDFB73] origin-left -rotate-45" />
    {/* 右下角斜切黄色描边 */}
    <div className="absolute right-0 bottom-4 w-[22.6px] h-0.5 bg-[#FDFB73] origin-right -rotate-45" />

    {/* 用户头像 */}
    <UserAvatar src={uidInfo?.avatar} />

    {/* 用户昵称 */}
    <h3 className="text-[#FDFB73] text-lg font-bold tracking-wide">{uidInfo?.nickname || 'UnSelectBind'}</h3>

    {/* UID 和同步状态 */}
    <div className="flex flex-col items-center gap-1 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-white/80">UID: {uidInfo?.uid || 'UnSelectBind'}</span>
        {/* <SyncBadge isSynced={user.isSynced} /> */}
      </div>
      {/* <span className="text-white/50 text-xs">当前绑定UID: {user.boundUidCount}</span> */}
    </div>

    {/* 立即同步按钮 */}
    {/* <ActionButton variant="outline" size="md" icon={<SyncIcon className="w-full h-full" />} onClick={onSync} className="mt-2">
      立即同步
    </ActionButton> */}
  </motion.div>
);
