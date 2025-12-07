import { useTranslation, Trans } from 'react-i18next';

import { BilibiliIcon, DiscordIcon, QQIcon } from '@/components/common/icons';
import ShuffleText from '@/components/common/shuffle_text';
import { AboutTitle } from '@/components/common/settings/items/about/title';
import { CommunityCard } from '@/components/common/settings/items/about/community_card';
import { ContributorCard } from '@/components/common/settings/items/about/contributor';
import type { ContributorInfo } from '@/components/common/settings/items/about/contributor';
import { Recruit } from '@/components/common/settings/items/about/recruit';
import { getAssetUrls } from '@/utils/url';

const avatarURL = getAssetUrls().avatar;

const contributors: ContributorInfo[] = [
  {
    name: 'bietiaop',
    avatar: 'https://i2.hdslb.com/bfs/face/32dcf0a7744d4e39da30d5c81db0d4c79610b9cd.jpg',
    home: 'https://space.bilibili.com/152308001',
    noReferrer: true,
  },
  {
    name: 'qwerdvd',
    avatar: `${avatarURL}/qwerdvd.jpg`,
    home: 'https://space.bilibili.com/44495289',
  },
  {
    name: 'skadiD',
    avatar: `https://i2.hdslb.com/bfs/face/b8c2c0c2658355a50000bf97e4c7849f16d13f1f.webp`,
    home: 'https://space.bilibili.com/9934999',
    noReferrer: true,
  },
];

export const AboutPage = () => {
  const { t } = useTranslation('settings');

  return (
    <div className="space-y-2 pb-6">
      <div className="flex flex-col items-center pt-4 gap-2">
        <img
          src="https://i2.hdslb.com/bfs/face/dd225519e6fc79c251d3fc442ab161ca72ced644.jpg@256w_256h_1c_1s.webp"
          alt="绝命笋干"
          className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-sm"
          referrerPolicy="no-referrer"
        />
        <div className="flex items-center gap-2 bg-[linear-gradient(-45deg,#555_0,#555_12.5%,#5550_12.5%,#5550_37.5%,#555_37.5%,#555_62.5%,#5550_62.5%,#5550_87.5%,#555_87.5%,#555_100%)] bg-repeat bg-size-[0.2em_0.2em] p-2">
          <ShuffleText
            text="绝命笋干"
            shuffleDirection="right"
            className="font-serif font-black text-white/90"
            duration={1}
            loop
            loopDelay={1}
          />
          <a href="https://space.bilibili.com/432131619" target="_blank">
            <button className="py-1 px-3 rounded-full bg-[#fdde55] hover:bg-[#e8cc4f] active:bg-[#fdde55] text-[#333] flex items-center gap-2">
              <BilibiliIcon className="text-[#ea5781]" />
              <span>{t('about.subscrible')}</span>
            </button>
          </a>
        </div>
        <AboutTitle className="pt-12 mb-4">{t('about.community')}</AboutTitle>
        <div className="flex flex-col gap-2">
          <CommunityCard
            title={t('about.qq_group', { group_number: '1020923535' })}
            link="https://qm.qq.com/q/6NDYnkjXmU"
            icon={<QQIcon />}
            type="primary"
          />
          <CommunityCard title={t('about.discord')} link="https://discord.gg/DDgx65vaMF" icon={<DiscordIcon />} />
        </div>
        <div className="max-w-4xl text-sm mt-4 text-[#cbcbcb]">
          <Trans
            t={t}
            i18nKey="about.statement"
            components={{
              license: (
                <a
                  href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                  target="_blank"
                  className="text-[#FEFA53]"
                />
              ),
            }}
          />
        </div>
        <AboutTitle className="pt-8">{t('about.contributors')}</AboutTitle>
        <div className="text-xs text-[#cbcbcb] text-center mb-2">{t('about.contributors_tip')}</div>
        <div className="flex gap-2">
          {contributors
            .sort(() => Math.random() - 0.5)
            .map((item) => (
              <ContributorCard key={item.home} info={item} />
            ))}
        </div>
        <Recruit />
      </div>
    </div>
  );
};
