import type { AiDisplayMessage } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { DecoTriTriangle } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';

/** 右下角的直角三角装饰，与侧边栏操作按钮同一套语言 */
const CornerDeco = ({ color }: { color: string }) => (
  <div
    className={cn('absolute bottom-0 right-0 h-0 w-0 rotate-90 border-r-8 border-b-8 border-b-transparent', color)}
    aria-hidden="true"
  />
);

/**
 * 工具调用折叠成一行：用户关心的是「助手做了什么」，完整 JSON 对人没有价值。
 */
const ToolLine = ({ message }: { message: AiDisplayMessage }) => (
  <div
    className={cn(
      'relative flex items-center gap-1.5 self-stretch border-l-2 px-2 py-1 text-[11px] leading-tight',
      message.error
        ? 'border-l-[#ff6b6b] bg-[#ff6b6b]/10 text-[#ffb3b3]'
        : 'border-l-[#01ffa2] bg-black/40 text-[#b9b9b9]'
    )}
  >
    <DecoTriTriangle className={cn('shrink-0 text-[8px]', message.error ? 'text-[#ff6b6b]' : 'text-[#01ffa2]')} />
    <span className="shrink-0 font-mono text-[#fcee21]">{message.toolName}</span>
    <span className="min-w-0 flex-1 truncate">{message.toolSummary}</span>
    <CornerDeco color={message.error ? 'border-r-[#ff6b6b]/60' : 'border-r-[#3c3c3c]'} />
  </div>
);

export const AiMessage = observer(({ message }: { message: AiDisplayMessage }) => {
  if (message.role === 'tool') {
    return <ToolLine message={message} />;
  }

  const isUser = message.role === 'user';
  return (
    <div
      className={cn(
        'relative max-w-[92%] px-2.5 py-1.5 text-xs leading-relaxed break-words whitespace-pre-wrap',
        isUser
          ? 'self-end border-r-2 border-[#fcee21] bg-[#3a3a3a] text-[#f4f2ea]'
          : 'self-start border-l-2 border-[#5a5a5a] bg-[#1f1f1f] text-[#e4e4e4]',
        // 助手气泡叠一层极淡的斜纹，和分组标题栏保持同一质感
        !isUser &&
          'after:pointer-events-none after:absolute after:inset-0 after:bg-[repeating-linear-gradient(135deg,transparent,transparent_0.35em,rgba(255,255,255,0.02)_0.4em,rgba(255,255,255,0.02)_0.75em)]',
        message.error && 'border-[#ff6b6b] bg-[#ff6b6b]/10 text-[#ffb3b3]'
      )}
    >
      <span className="relative z-1">
        {/* 流式期间内容可能还是空的，给个光标条免得气泡看着像坏了 */}
        {message.content || <span className="inline-block h-3 w-1.5 animate-pulse bg-[#fcee21]/80 align-middle" />}
      </span>
    </div>
  );
});
