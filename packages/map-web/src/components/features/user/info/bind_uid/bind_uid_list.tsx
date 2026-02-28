import { useTranslation } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio, ScrollArea,ZmdRoundIconButton } from '@endfieldmap/web-components';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

import type { GameRole } from '@/@types/game_role';
import { ArrowLeftIcon, CheckCircleIcon, QuestionIcon } from '@endfieldmap/web-components';

interface BindUidListProps {
  /** 可绑定的角色列表 */
  roles: GameRole[];
  /** 已绑定的 UID 列表 */
  boundUids: string[];
  /** 绑定回调 */
  onBind: (roleId: string, uid: string) => void;
  /** 返回登录页面 */
  onBack: () => void;
  /** 是否正在绑定 */
  loading?: boolean;
}

/**
 * 可绑定角色列表项组件
 */
const RoleListItem = ({
  role,
  isBound,
  onBind,
  loading,
}: {
  role: GameRole;
  isBound: boolean;
  onBind: () => void;
  loading?: boolean;
}) => {
  const { t } = useTranslation('header');
  return (
    <div className="flex items-center gap-3 px-3 py-2 relative">
      {/* 背景层 - 应用 mask 渐变 */}
      <div
        className={cn(
          'absolute inset-0 border rounded-l-lg transition-colors border-r-0 z-0',
          'mask-[linear-gradient(to_right,black_70%,transparent)]',
          isBound ? 'border-[#E8C832] bg-[#E8C832]/10' : 'border-black group-hover:border-black/10 bg-black/5'
        )}
      />
      {/* 左侧装饰 */}
      <div
        className={cn('absolute -left-0.5 top-4 bottom-4 w-1 rounded-full', isBound ? 'bg-[#E8C832]' : 'bg-black')}
      />

      {/* 头像占位 */}
      <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center shrink-0 overflow-hidden relative z-1">
        <svg className="w-5 h-5 text-black/30" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </div>

      {/* 角色信息 */}
      <div className="flex-1 min-w-0 relative z-1">
        <div className="flex items-center gap-2">
          <span className="text-black font-medium">{role.nick_name}</span>
          <span className="text-xs rounded-sm font-medium text-[#E8C832] bg-black px-1.5 py-0.5 tracking-wider">
            LV.{role.level}
          </span>
        </div>
        <div className="text-xs text-black/50">
          UID {role.role_id} · {role.server_name}
        </div>
      </div>

      {/* 绑定按钮 */}
      {!isBound && (
        <ButtonWithAudio
          onClick={onBind}
          disabled={loading}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded transition-colors relative z-1',
            loading ? 'bg-black/10 text-black/30 cursor-not-allowed' : 'bg-[#E8C832] text-black hover:bg-[#E8C832]/80'
          )}
        >
          {t('user.bind')}
        </ButtonWithAudio>
      )}

      {isBound && (
        <span className="text-xs text-[#E8C832] font-medium bg-[#E8C832]/10 border border-[#E8C832]/30 px-2 py-0.5 rounded-sm flex items-center gap-1">
          <CheckCircleIcon className="w-3 h-3" />
          {t('user.binded')}
        </span>
      )}
    </div>
  );
};

/**
 * 可绑定 UID 列表组件
 */
const AUTO_RETURN_SECONDS = 5 * 60; // 5 分钟

/** 格式化剩余时间为 mm:ss 格式 */
const formatRemainingTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const BindUidList = ({ roles, boundUids, onBind, onBack, loading }: BindUidListProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState(AUTO_RETURN_SECONDS);
  const { t } = useTranslation(['common', 'header']);

  // 倒计时逻辑
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onBack]);

  return (
    <motion.div
      className="flex flex-col h-full font-[Outfit]"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 shrink-0">
        <ZmdRoundIconButton onClick={onBack}>
          <ArrowLeftIcon />
        </ZmdRoundIconButton>
        <span className="text-xs text-black/50">
          {t('common:back_after_time', { time: formatRemainingTime(remainingSeconds) })}
        </span>
      </div>

      {/* 列表内容 */}
      {roles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-black/50">
          <QuestionIcon className="w-6 h-6" />
          <span className="text-xs">{t('header:user.uid.no_roles_to_bind')}</span>
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0" scrollY scrollX={false} scrollbarY="auto">
          <div className="flex flex-col gap-2 p-4">
            {roles.map((role) => (
              <RoleListItem
                key={role.role_id}
                role={role}
                isBound={boundUids.includes(role.role_id)}
                onBind={() => onBind(role.role_id, role.uid)}
                loading={loading}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </motion.div>
  );
};
