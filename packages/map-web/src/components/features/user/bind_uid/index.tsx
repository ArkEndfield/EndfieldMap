import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { serverService } from '@/services/server';
import { userService } from '@/services/user';
import { catchErrorWithTip } from '@/utils/handler';
import { alert } from '@/components/common/alert/alert_api';

import type { GameRole } from '@/@types/game_role';

import { BindUidList } from './bind_uid_list';
import { Login, type LoginMethod } from './login';

type View = 'login' | 'list';

interface BindUidProps {
  /** 绑定成功后的回调 */
  onSuccess?: () => void;
}

/**
 * UID 绑定主入口组件
 * 控制登录视图和绑定列表视图的切换
 */
export const BindUid = ({ onSuccess }: BindUidProps) => {
  const [view, setView] = useState<View>('login');
  const [roles, setRoles] = useState<GameRole[]>([]);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('qrcode');
  const [binding, setBinding] = useState(false);

  // 获取已绑定的 UID 列表
  const boundUids = userService.auth.uidList.map((item) => item.uid);

  // 登录成功处理
  const handleLogin = (roleList: GameRole[], method: LoginMethod, _code?: string) => {
    setRoles(roleList);
    setLoginMethod(method);
    setView('list');
  };

  // 返回登录页面
  const handleBack = () => {
    setView('login');
    setRoles([]);
  };

  // 绑定角色
  const handleBind = async (roleId: string, _uid: string) => {
    if (binding) return;

    setBinding(true);

    const result = await catchErrorWithTip(async () => {
      // 根据登录方式选择不同的绑定接口
      if (loginMethod === 'qrcode') {
        await serverService.apiPost('/user/game-roles/scan/bind', { role_id: roleId });
      } else {
        await serverService.apiPost('/user/game-roles/bind', { role_id: roleId });
      }
      return true;
    });

    setBinding(false);

    if (result) {
      alert.info('绑定成功');
      // 刷新 UID 列表
      await userService.updateUidList(false);
      onSuccess?.();
    }
  };

  return (
    <div className="min-h-87.5">
      <AnimatePresence mode="wait">
        {view === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Login onLogin={handleLogin} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <BindUidList
              roles={roles}
              boundUids={boundUids}
              onBind={handleBind}
              onBack={handleBack}
              loading={binding}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
