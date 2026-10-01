import { cn } from '@endfieldmap/tools';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { service } from '@/services';

// 回调页由后端（VITE_BACKEND_HOST）渲染并与本站跨源：postMessage 的 event.origin
// 是发送方（后端）的源，钉到后端源而不是 window.location.origin，否则合法登录消息
// 会被整体丢弃。同源部署/本地 oauth.html 流程兜底放行本站源。
const allowedOrigins = (() => {
  const origins = [window.location.origin];
  try {
    origins.push(new URL(import.meta.env.VITE_BACKEND_HOST ?? window.location.origin).origin);
  } catch {
    // VITE_BACKEND_HOST 缺失或非法时退化为仅本站源
  }
  return origins;
})();

export const ThirdPartyButton = ({
  icon,
  label,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
}) => {
  const { t } = useTranslation('error');
  // 根据label获取登录URL
  const getLoginUrl = (provider: string) => {
    const urls = {
      qq: 'https://graph.qq.com/oauth2.0/authorize?client_id=102898137&response_type=code&redirect_uri=https%3A%2F%2Fapi.zmdmap.com%2Fapi%2Fv1%2Fauth%2Foauth%2Fqq%2Fcallback',
      bilibili:
        'https://account.bilibili.com/h5/account-h5/auth/oauth?client_id=aadbd763480d47cb&callback=skip&gourl=https%3A%2F%2Fapi.zmdmap.com%2Fapi%2Fv1%2Fauth%2Foauth%2Fbilibili%2Fcallback',
      discord:
        'https://discord.com/oauth2/authorize?client_id=1469921961961459712&response_type=code&scope=identify&redirect_uri=https%3A%2F%2Fapi.zmdmap.com%2Fapi%2Fv1%2Fauth%2Foauth%2Fdiscord%2Fcallback',
      github: 'https://github.com/login/oauth/authorize?client_id=Ov23li62rQCYlLUffuSz',
    };
    return urls[provider as keyof typeof urls];
  };

  const handleClick = () => {
    const url = getLoginUrl(label.toLowerCase());
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const loginWindow = window.open(url, label + ' Login', `width=${width},height=${height},left=${left},top=${top}`);

    // 监听登录结果。origin（后端回调源，见 allowedOrigins）/source 双校验缺一不可：
    // 只看 type 的话，任何持有本窗口引用的页面（钓鱼 opener / 内嵌 iframe）
    // 都能伪造 LOGIN_SUCCESS 把会话换成攻击者账号（会话固定）。
    const messageHandler = (event: MessageEvent) => {
      if (!allowedOrigins.includes(event.origin) || event.source !== loginWindow) return;
      const data = event.data as { type?: string; userInfo?: { token?: string }; error?: string } | null;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'LOGIN_SUCCESS' && data.userInfo?.token) {
        void service.userService.thirdparty(data.userInfo.token);
        loginWindow?.close();
        window.removeEventListener('message', messageHandler);
      } else if (data.type === 'LOGIN_FAILED') {
        loginWindow?.close();
        window.removeEventListener('message', messageHandler);
        alert.info({ content: <div className="text-center">{t('login_failed') + t(data.error ?? '')}</div> });
      }
    };

    window.addEventListener('message', messageHandler);
    // 弹窗被拦截（返回 null）或用户直接关掉时兜底移除监听，避免 handler 泄漏常驻
    if (!loginWindow) {
      window.removeEventListener('message', messageHandler);
      return;
    }
    const pollClosed = window.setInterval(() => {
      if (loginWindow.closed) {
        window.clearInterval(pollClosed);
        window.removeEventListener('message', messageHandler);
      }
    }, 1000);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded',
        'bg-white/10 hover:bg-white/20 border border-white/20',
        'text-white/90 hover:text-white text-xs font-medium',
        'transition-all duration-200',
        className
      )}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
};
