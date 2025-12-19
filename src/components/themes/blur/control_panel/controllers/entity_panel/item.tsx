import { CustomPointKey, ElectricPoleKey } from '@endfieldmap/map-core';
import { observer } from 'mobx-react-lite';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Counter from '@/components/common/count_up';
import { Tooltip } from '@/components/common/tooltip/tooltip';
import { useAdapter } from '@/hooks/use_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { getEntityIcon } from '@/utils/entity';
import { cn } from '@/utils/style';

/**
 * EntityItem 通用属性类型
 * 兼容 EntityInfoStats 和手动构造的数据
 */
interface EntityItemData {
  category: string;
  entityDataIdKey: string;
  entityInfo: {
    point: string;
    pic: string;
  };
  count: number;
  markedCount?: number;
  visible?: boolean;
}

interface EntityItemProps {
  hideCount?: boolean;
  hideMarked?: boolean;
  markCount?: number;
  entity?: EntityItemData;
  category?: string;
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const EntityItem = observer(
  ({ hideCount = false, entity, category, active = false, onClick, children, hideMarked = false }: EntityItemProps) => {
    const { t } = useTranslation(['common', 'sidebar', 'lang']);
    const isMobile = useIsMobile();
    const { dataService } = useAdapter();

    const displayName = useMemo(() => {
      if (entity) {
        if (entity.category === ElectricPoleKey) {
          return '';
        }

        if (entity.category === CustomPointKey) {
          return t(`common:custom_point.type.${entity.entityDataIdKey}`, {
            defaultValue: entity.entityDataIdKey,
          });
        }

        return t(`lang:${dataService.langHashDataService.getHash(entity.entityDataIdKey)}`, {
          defaultValue: entity.entityDataIdKey,
        });
      }
      return 'unnamed';
    }, [dataService.langHashDataService, entity, t]);

    const progressWidth = useMemo(() => {
      if (entity && entity.count > 0) {
        const percentage = ((entity.markedCount || 0) / entity.count) * 100;
        return `${percentage}%`;
      }
      return '0%';
    }, [entity]);

    const iconSrc = useMemo(() => {
      if (entity && category) {
        return getEntityIcon(category, entity.entityInfo.pic);
      }
      return '';
    }, [entity, category]);

    return (
      <Tooltip
        tooltip={displayName}
        placement="right"
        offset={0}
        disabled={isMobile}
        keepOnHover={false}
        as="button"
        asProps={{
          onClick,
          className: cn('flex items-center relative overflow-hidden select-none cursor-pointer w-full'),
        }}
      >
        <div
          className={cn(
            'relative z-1 rounded-xl grow overflow-hidden flex items-center',
            'transition-all duration-200',
            'border border-white/10',
            active ? 'bg-white/20 shadow-sm shadow-blue-500/20' : 'bg-white/5 hover:bg-white/10 active:scale-[0.98]'
          )}
        >
          <div className="w-8 h-8 flex justify-center items-center shrink-0 ml-2 my-1.5">
            <div
              className={cn(
                'w-full h-full rounded-lg flex items-center justify-center',
                'transition-all duration-200',
                active ? 'bg-white/20' : 'bg-white/10'
              )}
            >
              {children || (iconSrc && <img src={iconSrc} alt={displayName} className="w-5 h-5 object-contain" />)}
            </div>
          </div>

          <div className="py-1.5 pl-2 pr-2 flex flex-1 relative z-3 items-center justify-between overflow-hidden">
            <div
              className={cn(
                'flex-1 text-xs mr-1 whitespace-nowrap overflow-hidden text-ellipsis min-w-0 text-left font-medium',
                active ? 'text-white' : 'text-white/70'
              )}
            >
              {displayName}
            </div>

            {!hideCount && entity && (
              <div
                className={cn(
                  'shrink-0 w-fit font-medium px-2 py-0.5 rounded-md min-w-8 grow-0',
                  'text-center inline-flex items-center justify-center leading-none relative overflow-hidden',
                  'border border-white/10',
                  active ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60'
                )}
              >
                <div
                  className="absolute left-0 top-0 h-full bg-blue-500/20 transition-[width] duration-300 ease-in-out"
                  style={{ width: progressWidth }}
                />
                <div className="relative z-1 text-[10px] font-mono leading-none inline-flex items-center gap-0.5">
                  {!hideMarked && <Counter value={entity.markedCount || 0} />}
                  {!hideMarked && <span>/</span>}
                  <span>{entity.count}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Tooltip>
    );
  }
);

export default EntityItem;
