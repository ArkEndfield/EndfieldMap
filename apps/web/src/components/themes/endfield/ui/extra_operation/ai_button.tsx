import { cn } from '@endfieldmap/tools';
import { ChatIcon, Tooltip, ZmdRoundIconButton } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { service } from '@/services';
import uiManager from '@/services/ui_manager';

/** AI 助手开关。设置里没启用时整个入口不出现，不打扰不用这功能的人。 */
export const AiAssistantButton = observer(() => {
  const { t } = useTranslation('settings');
  const enabled = service.aiService.config.enabled.value;
  const open = uiManager.aiPanelOpen;
  const running = service.aiService.assistant.running;

  if (!enabled) return null;

  return (
    <Tooltip
      as={ZmdRoundIconButton}
      tooltip={t('ai.title')}
      placement="left"
      asProps={{
        onClick: () => uiManager.toggleAiPanel(),
        'aria-label': t('ai.title'),
        className: cn(
          'w-8 h-8 text-lg md:text-base md:w-6 md:h-6',
          // 面板打开时按钮保持高亮，和分层 / 画中画等其它开关一致
          open && 'bg-[#fffa00] md:hover:bg-[#eeea00]',
          // 助手正在跑工具时轻微呼吸，提示后台还在动
          running && 'animate-pulse'
        ),
      }}
    >
      <ChatIcon />
    </Tooltip>
  );
});
