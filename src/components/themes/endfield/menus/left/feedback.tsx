import { FeedbackIcon } from '@/components/common/icons';
import { HeaderMenuTemplate } from './_template';
import { ZmdAlert } from '@/components/common/endfield_components/alert';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const HeaderMenuFeedback = () => {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation('header');

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <HeaderMenuTemplate icon={<FeedbackIcon />} title={t('feedback.title')} onClick={handleOpen}>
      <ZmdAlert open={open} onOpenChange={setOpen} hideCancel>
        <h1 className="text-lg font-bold text-center mb-2">{t('feedback.title')}</h1>
        <div className="px-4">
          {['cn', 'tc'].includes(i18n.language) && (
            <div>
              <div className="w-full flex justify-center">
                <img
                  src="https://www.zmdmap.com/images/feedback/qq_group_qr_code.png"
                  alt="qq_group_qr_code"
                  className="w-32"
                />
              </div>
              <h3 className="text-lg font-bold text-center mb-2">
                请使用微信扫码后填写，或
                <a
                  className="text-blue-500"
                  href="https://doc.weixin.qq.com/smartsheet/form/1_wpnwIrLAAAcKWVEyT5ubQwEKcvi5O1oA_15824f"
                  target="_blank"
                >
                  点击链接
                </a>
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
