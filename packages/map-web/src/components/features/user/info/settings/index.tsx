import { motion } from 'motion/react';
import { observer } from 'mobx-react-lite';

import { alert } from '@/components/common/alert/alert_api';
import { TrashIcon } from '@/components/common/icons';
import { ZmdSquareButton } from '@/components/common/endfield_components/button/square_button';
import { userService } from '@/services/user';

import { BaseInfo } from '@/components/features/user/info/settings/base_info';
import { ChangePassword } from '@/components/features/user/info/settings/change_password';

/**
 * 用户设置面板组件
 */
export const Settings = observer(() => {
  const userInfo = userService.auth.userInfo;

  if (!userInfo) {
    return null;
  }

  /** 注销账户（预留） */
  const handleDeleteAccount = () => {
    alert.confirm({
      content: '注销账户功能暂未开放',
    });
  };

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
          <ZmdSquareButton
            type="default"
            icon={<TrashIcon />}
            onClick={handleDeleteAccount}
            className="flex-1 text-base py-2"
            classNames={{ text: 'text-red-500' }}
          >
            注销账户
          </ZmdSquareButton>
        </div>
      </div>
    </motion.div>
  );
});
