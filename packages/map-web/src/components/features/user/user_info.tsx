import { UserModal } from '@/components/common/user/modal';

export const UserInfoModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  return (
    <UserModal open={open} onClose={onClose}>
      <div>Modal content</div>
    </UserModal>
  );
};
