import { QuestionIcon } from '@/components/common/icons';
import { HeaderMenuTemplate } from './_template';
import { ZmdAlert } from '@/components/common/endfield_components/alert';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const HeaderMenuAbout = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('header');

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <HeaderMenuTemplate icon={<QuestionIcon />} title={t('about.title')} onClick={handleOpen}>
      <ZmdAlert open={open} onOpenChange={setOpen} hideCancel>
        {/** TODO: about */}
        <h1 className="text-lg font-bold text-center">UP</h1>
        <div className="py-4">{/* <BilibiliCard /> */}</div>
        <h1 className="text-lg font-bold text-center">{t('about.title')}</h1>
        <p className="text-sm py-4 text-center">1233</p>
      </ZmdAlert>
    </HeaderMenuTemplate>
  );
};
