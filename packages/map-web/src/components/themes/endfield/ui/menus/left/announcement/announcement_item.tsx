import type { AnnouncementBreifWithRead } from '@endfieldmap/map-service/@types/announcement';
import { SoundType } from '@endfieldmap/map-web-theme-types';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio } from '@endfieldmap/web-components';

export interface AnnouncementItemProps {
  item: AnnouncementBreifWithRead;
  active?: boolean;
  isRead?: boolean;
  onClick?: () => void;
}

export const AnnouncementItem = ({ item, active, isRead, onClick }: AnnouncementItemProps) => {
  const time = new Date(item.published_at * 1000);
  const month = time.getMonth() + 1;
  const day = time.getDate();

  return (
    <div className="w-full h-12 pl-2 pr-10 relative">
      {/* 未读标记 */}
      <div className="absolute right-8 -top-1.5 z-2 pointer-events-none" hidden={isRead}>
        <img src="/images/bg/announcement_unread.png" className="h-4 pointer-events-none" />
      </div>

      {/* 内容 */}
      <ButtonWithAudio
        soundType={SoundType.PRIZE_CONFIRM}
        className={cn('relative w-full h-full p-1', active ? 'text-black' : 'text-white')}
        onClick={onClick}
        disabled={active}
      >
        <div
          className="absolute top-0 -bottom-2.5 -left-1 -right-10 bg-size-[100%_100%] bg-no-repeat bg-center bg-[url(/images/bg/bulletin-item-active.png)] z-2 pointer-events-none"
          hidden={!active}
        />
        <div
          className={cn(
            'absolute inset-0 bg-[#2c2c2d] hover:bg-[#4F4F4F] border border-[#898989] rounded-md z-1',
            !active && 'shadow-[0_0.28125rem_0.28125rem_rgba(0,0,0,.4)]'
          )}
        />
        <div className="relative z-3 flex h-full pl-2 gap-2 pointer-events-none">
          <div className={cn('shrink-0 w-10 h-full relative text-[#989898]', active && 'text-[#313131]')}>
            <div className="absolute top-0 left-0">{day}</div>
            <div
              className={cn(
                'absolute top-0 left-1/2 -translate-x-1/2 w-px h-[110%] rotate-45',
                active ? 'bg-[#313131]' : 'bg-[#989898]'
              )}
            />
            <div className="absolute bottom-0 right-0 text-xs">{month}月</div>
            <div className={cn('absolute -right-2 top-2 bottom-2 w-[1.5px] bg-[#989898]', active && 'bg-[#313131]')} />
          </div>
          <div className="flex-1 line-clamp-2 text-sm font-medium my-auto">{item.title}</div>
        </div>
      </ButtonWithAudio>
    </div>
  );
};
