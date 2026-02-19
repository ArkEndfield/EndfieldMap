import { observer } from 'mobx-react-lite';
import { motion } from 'motion/react';

import { BaseInfo } from '@/components/features/user/info/settings/base_info';
import { ChangePassword } from '@/components/features/user/info/settings/change_password';
import { DeleteAccount } from '@/components/features/user/info/settings/delete_account';
import { service } from '@/services';

/**
 * 用户设置面板组件
 */
export const Settings = observer(() => {
  const userInfo = service.userService.auth.userInfo;

  if (!userInfo) {
    return null;
  }

  return (
    <motion.div
      className="flex flex-col font-[Outfit]"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* 内容区域 */}
      <div className="flex flex-col p-3">
        {/* 用户信息列表 */}
        <BaseInfo />

        {/* 操作按钮 */}
        <div className="flex gap-2 mt-3">
          <ChangePassword />
          <DeleteAccount />
        </div>
      </div>
    </motion.div>
  );
});
