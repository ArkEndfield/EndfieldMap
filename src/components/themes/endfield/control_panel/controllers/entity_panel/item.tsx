import { CustomPointKey, ElectricPoleKey } from '@endfieldmap/map-core';
import type { EntityInfoItemData } from '@endfieldmap/map-core/types/entity';
import { observer } from 'mobx-react-lite';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Counter from '@/components/common/count_up';
import { Tooltip } from '@/components/common/tooltip/tooltip';
import { useAdapter } from '@/hooks/use_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { getEntityIcon } from '@/utils/entity';
import { cn } from '@/utils/style';

interface EntityItemProps {
  hideCount?: boolean;
  hideMarked?: boolean;
  markCount?: number;
  entity?: EntityInfoItemData;
  category?: string;
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const EntityItem = observer(
  ({ hideCount = false, entity, category, active = false, onClick, children, hideMarked = false }: EntityItemProps) => {
    const { dataService } = useAdapter();
    const { t } = useTranslation(['common', 'sidebar', 'lang']);
    const isMobile = useIsMobile();

    const displayName = useMemo(() => {
      if (entity) {
        if (entity.category === ElectricPoleKey) {
          return '';
        }

        // 检查是否是自定义标点类型（以 custom_point_ 开头）
        if (entity.category === CustomPointKey) {
          return t(`common:custom_point.type.${entity.entityDataIdKey}`, {
            defaultValue: entity.entityDataIdKey,
          });
        }
        return t(`lang:${dataService.langHashDataService.getHash(entity.entityDataIdKey)}`, { defaultValue: entity.entityDataIdKey });
      }
      return 'unnamed';
    }, [entity, t]);

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
          className: cn(
            'flex items-center relative overflow-hidden select-none cursor-pointer w-full',
            'filter-[drop-shadow(0_0_0.2em_rgba(0,0,0,0.6))]',
            active && 'filter-[drop-shadow(0_0_0.3em_rgba(253,251,85,0.3))]'
          ),
        }}
      >
        <div
          className={cn(
            'bg-[#1d1d1d] relative z-1 rounded-full grow overflow-hidden flex items-center',
            'shadow-[0_0_0_0.1em_#242424_inset]',
            active && 'bg-[#252525] shadow-[0_0_0_0.1em_rgba(253,251,85,0.4)_inset]',
            !active && 'hover:bg-[#222222]'
          )}
        >
          <div className="w-6 h-6 flex justify-center items-center shrink-0 ml-1 my-1">
            <div
              className={cn(
                'w-full h-full rounded-full bg-[#2a2a2a] p-0.5 flex items-center justify-center',
                'shadow-[0_0_0.1em_rgba(0,0,0,0.5),0_0_0_1px_#1a1a1a_inset]',
                'transition-all duration-200',
                active && 'bg-[#333333] shadow-[0_0_0.3em_rgba(253,251,85,0.3),0_0_0_1px_rgba(253,251,85,0.2)_inset]',
                !active && 'hover:bg-[#303030]'
              )}
            >
              {children ||
                (iconSrc && <img src={iconSrc} alt={displayName} className="w-full h-full object-contain" />)}
            </div>
          </div>

          <div className="py-1 pl-1 pr-1.5 flex flex-1 relative z-3 items-center justify-between overflow-hidden">
            <div
              className={cn(
                'flex-1 text-[0.8em] mr-0.5 text-[#cccccc] whitespace-nowrap overflow-hidden text-ellipsis min-w-0 text-left',
                active && 'text-[#fdfb55]',
                !active && 'hover:text-[#dddddd]'
              )}
            >
              {displayName}
            </div>

            {!hideCount && entity && (
              <div
                className={cn(
                  'shrink-0 w-fit font-medium bg-[#2a2a2a] text-[#aaaaaa] px-[0.3em] py-[0.15em] rounded-full min-w-[1.2em] grow-0',
                  'text-center shadow-[0_0_0_1px_#333333] inline-flex items-center justify-center leading-none ml-[0.1em] relative overflow-hidden',
                  active && 'bg-[rgba(253,251,85,0.15)] text-[#fdfb55]',
                  !active && 'hover:bg-[#333333] hover:text-[#bbbbbb]'
                )}
              >
                <div
                  className="absolute left-0 top-0 h-full bg-[rgba(253,251,85,0.2)] transition-[width] duration-300 ease-in-out"
                  style={{ width: progressWidth }}
                />
                <div className="relative z-1 text-[10px] font-[JetBrains_Mono] leading-none inline-flex items-center">
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
