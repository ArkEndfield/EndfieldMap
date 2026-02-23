import type { PresetStoreResponseItem } from '@endfieldmap/map-service';
import { useTranslation } from '@endfieldmap/map-service';
import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio, ZmdRoundIconButton } from '@endfieldmap/web-components';

import { EditIcon, ImportIcon, UserIcon, ViewAltIcon } from '@/components/common/icons';
import { Tooltip } from '@/components/common/tooltip';

export interface PresetStoreItemProps {
  item: PresetStoreResponseItem;
  onLike?: (id: number) => void;
  onOpen?: (id: number) => void;
  /** 删除回调，仅在「我的上传」中显示删除按钮 */
  onDelete?: (id: number) => void;
  /** 编辑回调 */
  onEdit?: (id: number) => void;
}

const HeartIcon = ({ filled, className }: { filled?: boolean; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    className={className}
  >
    {filled ? (
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="currentColor"
      />
    ) : (
      <path
        d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"
        fill="currentColor"
      />
    )}
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    className={className}
  >
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor" />
  </svg>
);

const TopDeco = ({ className }: { className?: string }) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g>
      <line x1="102.5" y1="3.98189e-07" x2="102.5" y2="105.464" stroke="currentColor" strokeWidth="35" />
      <line x1="12.3744" y1="12.315" x2="107.416" y2="107.357" stroke="currentColor" strokeWidth="35" />
      <line x1="17.5" y1="83.9409" x2="17.5" y2="120" stroke="currentColor" strokeWidth="35" />
    </g>
  </svg>
);

const formatCount = (count: number): string => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
};

const formatDate = (timestamp: number): string => {
  // 服务器返回秒级时间戳，需要转换为毫秒
  const date = new Date(timestamp * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const PresetStoreItem = ({ item, onLike, onOpen, onDelete, onEdit }: PresetStoreItemProps) => {
  const { t } = useTranslation(['sidebar']);

  return (
    <div
      className={cn(
        'group/preset-store-item relative rounded-xs bg-[#ece9e9] hover:bg-[#363636] hover:text-white',
        'transition-all duration-200 overflow-hidden',
        'hover:-translate-y-1'
      )}
    >
      <div className="absolute left-0 top-0 grid grid-cols-2 grid-rows-2">
        <div className="w-3 h-3 p-0.5 bg-[#313131] text-[#a6a5a5] group-hover/preset-store-item:bg-[#a6a5a5] group-hover/preset-store-item:text-[#363636] transition-all duration-200">
          <TopDeco className="w-full h-full" />
        </div>
        <div className="w-3 h-3 p-0.5 bg-[#d1cece] group-hover/preset-store-item:bg-[#525252] transition-all duration-200" />
        <div className="w-3 h-3 p-0.5 bg-[repeating-linear-gradient(-45deg,#d6d4d4_0px,#d6d4d4_1px,#e2dfdf_1px,#e2dfdf_2px)] group-hover/preset-store-item:bg-[repeating-linear-gradient(-45deg,#363636_0px,#363636_1px,#525252_1px,#525252_2px)] transition-all duration-200" />
      </div>
      <div className="w-36 h-36 rounded-full border-14 border-black/10 group-hover/preset-store-item:border-[#525252] absolute -top-2 -right-1" />
      <div className="absolute z-2 w-1 h-0.75 bg-[#a6a4a4] right-1 top-1 pointer-events-none" />
      <div className="absolute z-2 w-1 h-0.75 bg-[#888787] right-1 bottom-1 pointer-events-none" />
      <div className="absolute z-2 w-1 h-0.75 bg-[#888787] left-1 bottom-1 pointer-events-none" />

      <div className="absolute right-1 top-1 z-2 flex gap-1">
        {/* 删除按钮 */}
        {onDelete && (
          <Tooltip
            as={ZmdRoundIconButton}
            tooltip={t('sidebar:preset_store.delete', { defaultValue: '删除' })}
            asProps={{
              onClick: () => onDelete(item.id),
            }}
          >
            <TrashIcon className="text-xs text-[#ff3d3d]" />
          </Tooltip>
        )}

        {/* 编辑按钮 */}
        {onEdit && (
          <Tooltip
            as={ZmdRoundIconButton}
            tooltip={t('sidebar:preset_store.edit', { defaultValue: '编辑' })}
            asProps={{
              onClick: () => onEdit(item.id),
            }}
          >
            <EditIcon className="text-xs" />
          </Tooltip>
        )}
      </div>

      {/* 内容区 */}
      <ButtonWithAudio
        onClick={() => onOpen?.(item.id)}
        className={cn('flex flex-col gap-1.5 text-left z-1 relative', 'p-4 w-full h-full pb-16')}
      >
        {/* 标题 */}
        <div className="flex items-start gap-1.5">
          <h3 className="text-sm font-bold leading-snug line-clamp-1 flex-1">{item.name}</h3>
        </div>

        {/* 描述 */}
        <p className="text-xs opacity-50 leading-relaxed line-clamp-2 flex-1 break-all">{item.description}</p>
      </ButtonWithAudio>

      {/* 底部信息 */}
      <div
        className={cn(
          'pointer-events-none flex flex-col justify-center text-xs gap-0.5',
          'absolute left-0 right-0 bottom-0 z-1',
          'px-2 pb-1 pt-2 h-14 shrink-0',
          'bg-black/5 group-hover/preset-store-item:bg-white/5 backdrop-blur-xs text-[#999] group-hover/preset-store-item:text-[#939393]'
        )}
      >
        {/* 作者 */}
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-1 bg-[#313131] px-2 py-0.5 rounded-full group-hover/preset-store-item:bg-[#F4F4F0]">
            <UserIcon className="shrink-0" />
            <span className="truncate max-w-20 text-[#F4F4F0] group-hover/preset-store-item:text-[#313131]">
              {item.user_nickname}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between px-2">
          {/* 统计数据 */}
          <span className="shrink-0 scale-90 origin-left">{formatDate(item.created_at)}</span>
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-0.5"
              title={t('sidebar:preset_store.views', { defaultValue: '浏览' })}
            >
              <ViewAltIcon />
              {formatCount(item.view_count)}
            </span>
            <span
              className="flex items-center gap-0.5"
              title={t('sidebar:preset_store.imports', { defaultValue: '导入' })}
            >
              <ImportIcon />
              {formatCount(item.import_count)}
            </span>

            {/* 操作按钮 */}
            <ButtonWithAudio
              soundType={SoundType.TICK}
              className={cn(
                'flex items-center gap-0.5 rounded-xs transition-colors duration-200 cursor-pointer pointer-events-auto',
                item.is_liked ? 'text-[#ff4757] hover:text-[#ff6b81]' : 'hover:text-[#ff4757]'
              )}
              onClick={() => onLike?.(item.id)}
            >
              <HeartIcon filled={item.is_liked} className="text-xs" />
              <span>{formatCount(item.like_count)}</span>
            </ButtonWithAudio>
          </div>
        </div>
      </div>
    </div>
  );
};
