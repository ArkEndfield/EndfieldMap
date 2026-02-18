import { cn } from '@/utils/style';
import { userService } from '@/services/user';


export const ThirdPartyButton = ({
  icon,
  label,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
}) => {
  // 根据label获取登录URL
  const getLoginUrl = (provider: string) => {
    const urls = {
      qq: 'https://graph.qq.com/oauth2.0/authorize?client_id=102849620&response_type=token&redirect_uri=https%3A%2F%2Fapi.zmdmap.com%2Fapi%2Fv1%2Fauth%2Foauth%2Fqq%2Fcallback',
      bilibili: 'https://account.bilibili.com/pc/account-pc/auth/oauth?client_id=aadbd763480d47cb&gourl=https%3A%2F%2Fapi.zmdmap.com%2Fapi%2Fv1%2Fauth%2Foauth%2Fbilibili%2Fcallback',
      discord: 'https://discord.com/oauth2/authorize?client_id=1469921961961459712&response_type=code&scope=identify&redirect_uri=https%3A%2F%2Fapi.zmdmap.com%2Fapi%2Fv1%2Fauth%2Foauth%2Fdiscord%2Fcallback',
    };
    return urls[provider as keyof typeof urls];
  };

  const handleClick = () => {
    const state = btoa(Date.now().toString(36) + Math.random().toString(36).slice(2));
    const url = getLoginUrl(label.toLowerCase()) + `&state=${state}`;
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    // 打开登录窗口
    const loginWindow = window.open(
      url,
      label + ' Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // 监听登录结果
    const messageHandler = (event: MessageEvent) => {
      if (event.data.type === 'LOGIN_SUCCESS') {
        console.log('Login success');
        userService.thirdparty(event.data.userInfo.token);
        loginWindow?.close();
        window.removeEventListener('message', messageHandler);
      } else if (event.data.type === 'LOGIN_FAILED') {
        console.log('Login failed', event.data.error);
        window.removeEventListener('message', messageHandler);
      }
    };

    window.addEventListener('message', messageHandler);
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
