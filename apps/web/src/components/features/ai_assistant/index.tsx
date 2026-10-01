import { cn } from '@endfieldmap/tools';
import {
  ButtonWithAudio,
  ChatIcon,
  Deco7Dots,
  DecoTriTriangle,
  EndfieldCloseIcon,
  ScrollArea,
  shortcutService,
  TrashIcon,
  useIsMobile,
  useWindow,
  ZmdSquareButton,
} from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { AiMessage } from '@/components/features/ai_assistant/message';
import { SETTINGS_PAGE } from '@/const/settings';
import { service } from '@/services';
import uiManager from '@/services/ui_manager';

/** 空会话时给的示例问题，降低「不知道能问什么」的门槛。 */
const SUGGESTION_KEYS = [
  'ai.panel.suggestion.nearby_chest',
  'ai.panel.suggestion.plan_route',
  'ai.panel.suggestion.progress',
] as const;

/** 面板顶部装饰条：复刻 Dialog 头部的黄块 + 灰条语言，尺寸压到浮层可用 */
const HeaderStrip = () => (
  <div className="flex h-3.5 shrink-0 items-stretch">
    <div className="w-10 bg-[#ffff21]" />
    <div className="flex flex-1 items-center justify-between bg-[#999] px-1.5">
      <span className="font-[Outfit] text-[8px] leading-none font-bold text-[#363636] italic">// AI ASSISTANT</span>
      <Deco7Dots className="w-6 text-[#363636]/40" />
    </div>
  </div>
);

const PanelHeader = observer(({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation('settings');
  const assistant = service.aiService.assistant;
  const model = service.aiService.config.model.value;

  return (
    <header className="relative shrink-0">
      <HeaderStrip />
      <div className="flex h-11 items-center gap-2 bg-[#363636] px-2">
        <div className="grid size-8 shrink-0 place-content-center bg-[#484848] text-lg text-[#d3d3d3]">
          <ChatIcon />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm leading-tight font-bold text-white">{t('ai.title')}</div>
          <div className="truncate font-mono text-[10px] leading-tight text-[#9a9a9a]">{model}</div>
        </div>
        <ButtonWithAudio
          className="shrink-0 p-1 text-[#b9b9b9] transition-colors hover:text-white disabled:opacity-40"
          disabled={assistant.isEmpty}
          title={t('ai.panel.clear')}
          aria-label={t('ai.panel.clear')}
          onClick={() => assistant.clear()}
        >
          <TrashIcon />
        </ButtonWithAudio>
        <ButtonWithAudio
          className="grid size-7 shrink-0 place-content-center bg-[#ffff21] text-lg text-[#363636] transition-colors hover:bg-[#eddd32]"
          title={t('ai.panel.close')}
          aria-label={t('ai.panel.close')}
          onClick={onClose}
        >
          <EndfieldCloseIcon />
        </ButtonWithAudio>
      </div>
      {/* 头部与内容之间的黄/灰分隔条，同 Dialog */}
      <div className="h-1 bg-[linear-gradient(90deg,#ffff1b,#ffff1b_45%,#d3d3d3_45%)]" />
    </header>
  );
});

const NotConfigured = () => {
  const { t } = useTranslation('settings');
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <DecoTriTriangle className="text-lg text-[#fcee21]/60" />
      <p className="text-xs leading-relaxed text-[#b9b9b9]">{t('ai.panel.not_configured')}</p>
      <ZmdSquareButton
        className="min-w-32 text-xs"
        showIcon={false}
        onClick={() => uiManager.navigateSettings(SETTINGS_PAGE.AI)}
      >
        {t('ai.panel.goto_settings')}
      </ZmdSquareButton>
    </div>
  );
};

const Suggestions = ({ onPick }: { onPick: (text: string) => void }) => {
  const { t } = useTranslation('settings');
  return (
    <div className="flex flex-1 flex-col justify-end gap-1.5 px-3 py-3">
      <p className="mb-0.5 flex items-center gap-1.5 text-[11px] text-[#8f8f8f]">
        <DecoTriTriangle className="text-[8px] text-[#fcee21]" />
        {t('ai.panel.suggestion_title')}
      </p>
      {SUGGESTION_KEYS.map((key) => {
        const text = t(key);
        return (
          <ButtonWithAudio
            key={key}
            className={cn(
              'group relative border border-[#444] bg-[#333] px-2 py-1.5 text-left text-[11px] leading-snug text-gray-400',
              'transition-colors hover:border-[#fcee21]/60 hover:bg-[#3d3d3d] hover:text-white'
            )}
            onClick={() => onPick(text)}
          >
            {text}
            <div
              className="absolute right-0 bottom-0 h-0 w-0 rotate-90 border-r-8 border-b-8 border-b-transparent border-r-[#444] transition-colors group-hover:border-r-[#fcee21]"
              aria-hidden="true"
            />
          </ButtonWithAudio>
        );
      })}
    </div>
  );
};

const MessageList = observer(() => {
  const assistant = service.aiService.assistant;
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = assistant.messages;
  // 流式输出时内容持续变长，跟着最后一条一起滚
  const lastContent = messages.length > 0 ? messages[messages.length - 1].content : '';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, lastContent]);

  return (
    <div className="min-h-0 flex-1">
      <ScrollArea scrollX={false} contentClassName="px-3 py-3">
        <div className="flex flex-col gap-2">
          {messages.map((message) => (
            <AiMessage key={message.id} message={message} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
});

const Composer = observer(() => {
  const { t } = useTranslation('settings');
  const assistant = service.aiService.assistant;
  const [draft, setDraft] = useState('');

  const submit = () => {
    const text = draft.trim();
    if (!text || assistant.running) return;
    setDraft('');
    void assistant.send(text);
  };

  return (
    <div className="shrink-0 border-t border-[#3c3c3c] bg-[#232323] px-3 py-2">
      {assistant.lastError && (
        <p className="mb-1.5 line-clamp-2 border-l-2 border-[#ff6b6b] pl-1.5 text-[10px] leading-snug text-[#ffb3b3]">
          {assistant.lastError}
        </p>
      )}
      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          rows={2}
          aria-label={t('ai.title')}
          placeholder={t('ai.panel.placeholder')}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          className={cn(
            'max-h-32 min-w-0 flex-1 resize-none border border-[#444] bg-[#1a1a1a] px-2 py-1.5',
            'text-xs leading-relaxed text-[#e4e4e4] outline-none transition-colors',
            'placeholder:text-[#6f6f6f] focus:border-[#fcee21]/70'
          )}
        />
        {assistant.running ? (
          <ButtonWithAudio
            className={cn(
              'shrink-0 self-stretch border border-[#fcee21] bg-[rgba(252,238,33,0.15)] px-3 text-[11px] font-medium text-[#fcee21]',
              'shadow-[inset_0_0_10px_rgba(252,238,33,0.1)] transition-colors hover:bg-[rgba(252,238,33,0.25)]'
            )}
            onClick={() => assistant.stop()}
          >
            {t('ai.panel.stop')}
          </ButtonWithAudio>
        ) : (
          <ZmdSquareButton
            className="min-w-16 shrink-0 self-stretch rounded-none py-0 text-xs"
            showIcon={false}
            disabled={!draft.trim()}
            onClick={submit}
          >
            {t('ai.panel.send')}
          </ZmdSquareButton>
        )}
      </div>
    </div>
  );
});

/**
 * AI 助手面板。
 *
 * 刻意做成非模态浮层：助手会移动视角、高亮和标记点位，用户需要一边看地图一边
 * 对话，用 Dialog 把地图挡住就失去意义了。PC 上贴右侧但让开缩放条 / 操作列
 * （right-16）与底部轮播（bottom-52），移动端占满可视区。
 */
const AiAssistantPanel = observer(() => {
  const assistant = service.aiService.assistant;
  const isMobile = useIsMobile();
  const currentWindow = useWindow();
  const open = uiManager.aiPanelOpen && service.aiService.config.enabled.value;
  const configured = service.aiService.config.isConfigured;

  useEffect(() => {
    if (!open) return;
    return shortcutService.register('Escape', (event: KeyboardEvent) => {
      event.preventDefault();
      uiManager.setAiPanelOpen(false);
      return true;
    });
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
          className={cn(
            'fixed z-10 flex flex-col overflow-hidden text-white shadow-[0_0_1.5em_rgba(0,0,0,0.6)]',
            // 矮屏下 min-h 会把面板往下推出「让开轮播」的区域，总比压扁成一条缝强
            isMobile ? 'inset-x-2 top-16 bottom-2' : 'top-20 right-16 bottom-52 min-h-[18rem] w-[23rem]'
          )}
        >
          <PanelHeader onClose={() => uiManager.setAiPanelOpen(false)} />

          <div className="flex min-h-0 flex-1 flex-col border-x border-[#3c3c3c] bg-[#272727]">
            {!configured ? (
              <NotConfigured />
            ) : assistant.isEmpty ? (
              <Suggestions onPick={(text) => void assistant.send(text)} />
            ) : (
              <MessageList />
            )}
            {configured && <Composer />}
          </div>

          {/* 底部三色条，同 Dialog 内容区收尾 */}
          <div className="h-1 shrink-0 bg-[linear-gradient(90deg,#00ffa2,#00ffa2_42.5%,#ffff21_42.5%,#ffff21_79.2%,#ff00f0_79.2%)]" />
        </motion.aside>
      )}
    </AnimatePresence>,
    currentWindow.document.body
  );
});

export default AiAssistantPanel;
