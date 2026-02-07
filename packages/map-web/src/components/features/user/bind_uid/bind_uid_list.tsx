import { useEffect, useState } from 'react';

import { motion } from 'motion/react';

import { cn } from '@/utils/style';

import type { GameRole } from '@/@types/game_role';
import { ButtonWithAudio } from '@/components/common/button_with_audio';
import { ArrowLeftIcon, CheckCircleIcon, QuestionIcon } from '@/components/common/icons';
import { ScrollArea } from '@/components/common/scroll_area';
import { ZmdRoundIconButton } from '@/components/common/endfield_components/button/round_icon_button';

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
}) => (
  <div
    className={cn(
      'flex items-center gap-3 px-3 py-2.5 transition-colors',
      'bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded',
      isBound && 'border-green-300 bg-green-50 hover:bg-green-50'
    )}
  >
    {/* 勾选图标 */}
    <div
      className={cn(
        'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
        isBound ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
      )}
    >
      <CheckCircleIcon className="w-3 h-3" />
    </div>

    {/* 角色信息 */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-gray-800 font-medium">{role.nick_name}</span>
        <span className="text-xs text-gray-400">Lv.{role.level}</span>
      </div>
      <div className="text-xs text-gray-500">
        UID {role.role_id} · {role.server_name}
      </div>
    </div>

    {/* 绑定按钮 */}
    {!isBound && (
      <ButtonWithAudio
        onClick={onBind}
        disabled={loading}
        className={cn(
          'px-3 py-1.5 text-xs font-medium rounded transition-colors',
          loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#363636] text-[#FDFB73] hover:bg-[#484848]'
        )}
      >
        绑定
      </ButtonWithAudio>
    )}

    {isBound && <span className="text-xs text-green-600 font-medium">已绑定</span>}
  </div>
);

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
      className="flex flex-col h-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <ZmdRoundIconButton onClick={onBack}>
          <ArrowLeftIcon />
        </ZmdRoundIconButton>
        <span className="text-xs text-gray-400">{formatRemainingTime(remainingSeconds)} 后自动返回</span>
      </div>

      {/* 列表内容 */}
      {roles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400">
          <QuestionIcon className="w-8 h-8" />
          <span className="text-sm">没有可绑定的角色</span>
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
