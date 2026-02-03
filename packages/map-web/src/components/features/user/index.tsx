import { useState } from 'react';
import { LoginModal } from '@/components/features/user/login';
import { UserInfoModal } from '@/components/features/user/user_info';

export const UserCenter = ({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
  const [isLogin] = useState(false);

  if (!isLogin) {
    return <LoginModal open={open} onClose={() => setOpen(false)} />;
  }
  return <UserInfoModal open={open} onClose={() => setOpen(false)} />;
};
