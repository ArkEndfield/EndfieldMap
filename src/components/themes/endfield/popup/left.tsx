import { cn } from '@/utils/style';
import { PowerIcon } from '@/components/common/icons';
import { observer } from 'mobx-react-lite';
import type { EndfieldMapAdapter, MapFeature } from '@endfieldmap/map-core';
import { getEntityIcon } from '@/utils/entity';
import { ScrollArea } from '@/components/common/ScrollArea';
import { ClipSquare, Deco } from './deco';
import { Guide } from '../../../common/guide';
import { ZmdButton } from '@/components/common/zmd_button';

export interface LeftContentProps {
  adapter: EndfieldMapAdapter;
  activeFeature: MapFeature;
}

/** 描边 */
const Border = () => (
  <div
    className="absolute inset-0 bottom-[18px] pointer-events-none -z-1"
    style={{
      filter: 'url(#stroke-filter)',
    }}
  >
    <ClipSquare className="bg-[#272827]" />
    <div className="w-full h-[calc(100%-1rem+1.5rem)] bg-[#272827]" />
  </div>
);

/** 关闭按钮 */
export const CloseButton = ({ onClick }: { onClick?: () => void }) => (
  <button className="no-underline absolute top-3 right-5 text-3xl text-[#ece065] z-2" onClick={onClick}>
    <PowerIcon />
  </button>
);

/** 顶部图标和标题 */
const Header = ({ name, pic }: { name: string; pic: string }) => (
  <div className="flex items-center gap-2 shrink-0">
    <div className="shrink-0">
      <img src={pic} className="w-6 h-6 rounded-full" />
    </div>
    <div className="truncate overflow-hidden">{name}</div>
  </div>
);

/** 左边弹窗内容 */
export const LeftContent: React.FC<LeftContentProps> = observer(({ adapter, activeFeature }) => {
  const entityData = activeFeature?.data;

  if (!adapter || !activeFeature || !entityData) return null;

  const handleToggleMarked = () => {
    if (activeFeature) {
      activeFeature.toggleMarked();
    }
  };

  return (
    <div className={cn('w-full', 'border-b-6 border-[#656465] relative')}>
      {/* 描边层 */}
      <Border />

      <CloseButton onClick={() => adapter.activeFeatureController.clearActiveFeature?.()} />

      <ClipSquare className="bg-[#272827]" />

      <div
        className={cn(
          'w-full bg-[#272827] text-white p-3 pt-0 shadow-[0_-2px_0_#272827]',
          'after:absolute after:z-0 after:left-0 after:h-32 after:bottom-0 after:w-54 after:bg-linear-to-tr after:from-white/25 after:via-white/0 after:to-black/0'
        )}
      >
        <Deco />

        <div className="relative z-1 flex flex-col max-h-78">
          <Header
            name={entityData.entityInfo.entityInfo.point}
            pic={getEntityIcon(entityData.entityInfo.category, entityData.entityInfo.entityInfo.pic)}
          />

          <div className="my-2 text-sm flex flex-wrap items-center gap-2 px-4 shrink-0">
            <span className="ml-auto text-zinc-400">id: {entityData.levelLogicId}</span>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <Guide entity={entityData} />
          </ScrollArea>

          {/* 操作按钮 */}
          <div className="mt-3 pt-3 shrink-0 flex">
            <ZmdButton
              onClick={(e) => {
                e.stopPropagation();
                handleToggleMarked();
              }}
              iconPosition={activeFeature.marked ? 'left' : 'right'}
            >
              {activeFeature.marked ? '取消标记' : '标记'}
            </ZmdButton>
          </div>
        </div>
      </div>
    </div>
  );
});
