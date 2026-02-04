import { observer } from 'mobx-react-lite';

import { UserInfoModal } from '@/components/features/user/info';
import { LoginModal } from '@/components/features/user/login';
import { userService } from '@/services/user';

export const UserCenter = observer(({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
  const { isLogin } = userService.auth;
  if (!isLogin) {
    return <LoginModal open={open} onClose={() => setOpen(false)} />;
  }
  return <UserInfoModal open={open} onClose={() => setOpen(false)} />;
});
