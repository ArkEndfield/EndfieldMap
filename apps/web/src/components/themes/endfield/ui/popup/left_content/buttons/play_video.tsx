import { ButtonWithAudio, PlayVideoIcon, Tooltip } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

export interface PlayVideoButtonProps {
  videoLink: string;
}

// TODO: 播放视频组件，多个视频该如何展示
export const PlayVideoButton: React.FC<PlayVideoButtonProps> = observer(({ videoLink }) => {
  const { t } = useTranslation();

  if (!videoLink) return null;

  return (
    <Tooltip
      tooltip={t('delete')}
      as={ButtonWithAudio}
      placement="bottom"
      asProps={{
        className: 'text-xl p-1 text-white hover:text-red-500 transition-colors',
        onClick: () => {
          console.log('videoLink', videoLink);
        },
      }}
    >
      <PlayVideoIcon />
    </Tooltip>
  );
});
