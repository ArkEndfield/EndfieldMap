import { observer } from 'mobx-react-lite';

import { UserInfoModal } from '@/components/features/user/info';
import { LoginModal } from '@/components/features/user/login';
import { service } from '@/services';

export const UserCenter = observer(({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
  const { isLogin } = service.userService.auth;
  if (!isLogin) {
    return <LoginModal open={open} onClose={() => setOpen(false)} />;
  }
  return <UserInfoModal open={open} onClose={() => setOpen(false)} />;
});
