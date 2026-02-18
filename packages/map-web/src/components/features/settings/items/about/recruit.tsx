import { observer } from 'mobx-react-lite';
import { useTranslation } from '@endfieldmap/map-service';

import { UserIcon } from '@/components/common/icons';
import { AboutTitle } from '@/components/common/settings/components/about_title';
import { cn } from '@/utils/style';
import { getAssetUrls } from '@/utils/url';

const assetURLs = getAssetUrls();

const qrCode = `${assetURLs.misc}/qrcode_1765130086921.jpg`;

export const Recruit = observer(() => {
  const { t } = useTranslation('settings');

  return (
    <div className="flex flex-col items-center pt-8 gap-6 w-full max-w-125">
      <AboutTitle>{t('about.recruit.title')}</AboutTitle>

      <div
        className={cn(
          'relative w-full p-6 text-white overflow-hidden',
          'bg-[url(/images/bg/button-texture.png)] bg-contain bg-right bg-no-repeat',
          'bg-[#333333] rounded-xs shadow-[0_0_.75rem_rgba(0,0,0,.4)]',
          'border border-[#444]' // Base border
        )}
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#fdde55]" />

        {/* Diagonal Stripe Decoration */}
        <div className="absolute top-1 right-2 w-16 h-1 bg-[#ffffff]/10 transform skew-x-[-45deg]" />

        <div className="relative z-10 flex flex-col gap-4">
          <p className="text-center font-bold text-sm leading-relaxed px-4">{t('about.recruit.description')}</p>
          <div className="w-full h-px bg-[#ffffff]/20" />
          <div className="flex flex-col gap-2.5 text-xs text-white/90">
            {[
              t('about.recruit.point1'),
              t('about.recruit.point2'),
              t('about.recruit.point3'),
              t('about.recruit.point4'),
            ].map((point, index) => (
              <div key={index} className="flex items-start gap-3 group">
                <div className="mt-1.5 shrink-0 w-1.5 h-1.5 bg-[#fdde55] rotate-45 group-hover:bg-[#ea5781] transition-colors duration-300" />
                <span className="leading-5">{point}</span>
              </div>
            ))}
          </div>
          <div className="w-full h-px bg-[#ffffff]/20" />
        </div>

        {/* Faded Background Icon */}
        <UserIcon className="absolute -bottom-4 -right-4 w-24 h-24 text-[#ffffff]/5 pointer-events-none" />

        {/* Bottom Accent */}
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#fdde55]/50" />

        <img src={qrCode} alt="QR Code" className="w-full h-full opacity-90" />
      </div>
    </div>
  );
});
