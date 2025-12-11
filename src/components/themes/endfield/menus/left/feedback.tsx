import { HeaderMenuTemplate } from '@themes/endfield/menus/left/_template';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ZmdAlert } from '@/components/common/alert/alert';
import { FeedbackIcon } from '@/components/common/icons';
import { useCurrentLanguage } from '@/hooks/use_current_language';

export const HeaderMenuFeedback = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('header');
  const currentLocale = useCurrentLanguage();

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <HeaderMenuTemplate icon={<FeedbackIcon />} title={t('feedback.title')} onClick={handleOpen}>
      <ZmdAlert open={open} onOpenChange={setOpen} hideCancel>
        <h1 className="text-lg font-bold text-center mb-2">{t('feedback.title')}</h1>
        <div className="px-4">
          {['zh-CN', 'zh-TW'].includes(currentLocale) && (
            <div>
              <h3 className="text-lg font-bold text-center mb-2">
                <a
                  className="text-blue-500"
                  href="https://doc.weixin.qq.com/smartsheet/form/1_wpnwIrLAAAcKWVEyT5ubQwEKcvi5O1oA_15824f"
                  target="_blank"
                >
                  点击链接
                </a>
                使用微信登录后填写，或在「设置-关于」中加入QQ群或者Discord群
              </h3>
            </div>
          )}
          <h3 className="text-lg font-bold text-center mb-2">
            <a className="text-blue-500" href="https://discord.gg/DDgx65vaMF" target="_blank">
              Click here
            </a>{' '}
            to join the Discord server
          </h3>
        </div>
      </ZmdAlert>
    </HeaderMenuTemplate>
  );
};
