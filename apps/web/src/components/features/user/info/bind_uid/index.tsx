import type { BindType } from '@endfieldmap/map-service';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { GameRole } from '@/@types/game_role';
import { alert } from '@/components/common/alert/alert_api';
import { BindUidList } from '@/components/features/user/info/bind_uid/bind_uid_list';
import { Login } from '@/components/features/user/info/bind_uid/login';
import { service } from '@/services';
import { catchErrorWithTip } from '@/utils/handler';

type View = 'login' | 'list';

/**
 * UID 绑定主入口组件
 * 控制登录视图和绑定列表视图的切换
 */
export const BindUid = observer(() => {
  const [view, setView] = useState<View>('login');
  const [roles, setRoles] = useState<GameRole[]>([]);
  const [loginMethod, setLoginMethod] = useState<BindType>('scan');
  const [binding, setBinding] = useState(false);
  const { t } = useTranslation('header');

  // 获取已绑定的 UID 列表
  const boundUids = service.userService.auth.uidList.map((item) => item.uid);

  // 登录成功处理
  const handleLogin = (roleList: GameRole[], method: BindType, _code?: string) => {
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

    await catchErrorWithTip(async () => {
      // 根据登录方式选择不同的绑定接口
      await service.userService.bindUid(roleId, loginMethod);
      alert.info(t('user.uid.bind_success'));
    });

    setBinding(false);
  };

  return (
    <div className="h-full min-h-72">
      <AnimatePresence mode="wait">
        {view === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
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
            className="h-full"
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
});
