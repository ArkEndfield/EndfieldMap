import { motion } from 'motion/react';
import { observer } from 'mobx-react-lite';

import { cn } from '@/utils/style';
import type { UidInfo, UserInfo } from '@eftypes/user';
import { SyncStatus } from '@eftypes/sync';
import { CheckCircleIcon, RefreshIcon } from '@/components/common/icons';
import { userService } from '@/services/user';
import { ZmdSquareButton } from '@/components/common/endfield_components/button/square_button';

// ==================== 用户头像组件 ====================
const UserAvatar = ({
  src,
  alt = '用户头像',
  size = 'lg',
  className,
}: {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
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
          <img
            src={src || 'https://bbs.hycdn.cn/asset/endfield.png'}
            alt={alt}
            className="w-full h-full rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
};

// ==================== 同步状态徽章 ====================

// 同步中的三点浮动动画组件
const SyncingDots = () => (
  <span className="inline-flex items-center gap-0.5 h-4">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-1 h-1 rounded-full bg-[#FDFB73]"
        animate={{
          y: [0, -3, 0, 0],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          delay: i * 0.15,
          ease: 'easeInOut',
          times: [0, 0.2, 0.4, 1],
        }}
      />
    ))}
  </span>
);

const SyncBadge = observer(({ className }: { className?: string }) => {
  const syncService = userService.data.syncService;
  const status = syncService.status;

  const statusConfig = {
    [SyncStatus.Idle]: { text: '已同步', color: 'text-[#01ffa2]', icon: true },
    [SyncStatus.Syncing]: { text: '', color: 'text-[#FDFB73]', icon: false },
    [SyncStatus.Error]: { text: '同步失败', color: 'text-red-400', icon: false },
    [SyncStatus.Offline]: { text: '离线', color: 'text-white/50', icon: false },
  };

  const config = statusConfig[status];

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', config.color, className)}>
      {config.icon && <CheckCircleIcon className="w-3 h-3" />}
      {status === SyncStatus.Syncing ? <SyncingDots /> : config.text}
    </span>
  );
});

// ==================== 用户资料组件 ====================
export const UserProfile = observer(({ uidInfo, userInfo }: { uidInfo?: UidInfo; userInfo: UserInfo }) => {
  const syncService = userService.data.syncService;
  const isSyncing = syncService.status === SyncStatus.Syncing;

  const handleSync = async () => {
    await userService.triggerSync();
  };

  return (
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
      <h3 className="text-[#FDFB73] text-lg font-bold tracking-wide">{userInfo.nickname || '未命名'}</h3>
      {uidInfo?.nickname && <h3 className="tracking-wide">{uidInfo.nickname}</h3>}

      {/* UID 和同步状态 */}
      <div className="flex flex-col items-center gap-1 text-sm">
        <div className="flex items-center gap-2">
          {uidInfo?.uid && <span className="text-white/80">UID: {uidInfo.uid}</span>}
        </div>
        {uidInfo?.uid ? (
          <SyncBadge />
        ) : (
          <span className="text-white/80 text-xs text-center">切换一个UID后开始同步数据</span>
        )}
      </div>

      {/* 立即同步按钮 */}
      {uidInfo?.uid && (
        <ZmdSquareButton icon={<RefreshIcon />} onClick={handleSync} className="mt-2 w-full" loading={isSyncing}>
          {isSyncing ? '同步中' : '立即同步'}
        </ZmdSquareButton>
      )}
    </motion.div>
  );
});
