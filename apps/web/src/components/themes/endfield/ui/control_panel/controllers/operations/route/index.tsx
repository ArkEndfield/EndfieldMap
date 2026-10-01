import type { StoredRoute } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio, ScrollArea, useIsMobile } from '@endfieldmap/web-components';
import { InVisibleIcon, TrashIcon, VisibleIcon } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { service } from '@/services';
import { catchErrorWithTip } from '@/utils/handler';

const routeService = () => service.dataService.mapDataService.routeDataService;

/** 草稿区：描点进行中显示名称输入 + 保存/取消。 */
const DraftEditor = observer(() => {
  const { t } = useTranslation('sidebar');
  const svc = routeService();
  const [name, setName] = useState('');

  if (!svc.isPicking) return null;

  const handleSave = () => {
    void catchErrorWithTip(async () => {
      await svc.saveDraft(name);
      return true;
    });
    setName('');
  };

  return (
    <div className="flex flex-col gap-2 border border-[#FDFB73]/30 bg-[#FDFB73]/5 px-3 py-2.5">
      <div className="text-[#FDFB73] text-xs">{t('operation.route.pick.in_mode')}</div>
      <div className="text-white/50 text-xs">
        {svc.draftPointCount > 0
          ? t('operation.route.point_count', { count: svc.draftPointCount })
          : t('operation.route.empty_tip')}
      </div>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('operation.route.name_placeholder')}
          className="flex-1 min-w-0 bg-white/5 border border-white/15 rounded px-2 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#FDFB73]/50"
        />
        <ButtonWithAudio
          onClick={handleSave}
          className="px-3 py-1.5 text-xs rounded border border-[#FDFB73]/50 text-[#FDFB73] hover:bg-[#FDFB73]/10"
        >
          {t('operation.route.save')}
        </ButtonWithAudio>
        <ButtonWithAudio
          onClick={() => svc.cancelPicking()}
          className="px-3 py-1.5 text-xs rounded border border-white/20 bg-white/10 text-white/70 hover:bg-white/20"
        >
          {t('operation.route.cancel')}
        </ButtonWithAudio>
      </div>
    </div>
  );
});

/** 一条已保存路线：名称 / 来源 / 点数，以及重命名、发布与删除操作。 */
const RouteItem = observer(({ route }: { route: StoredRoute }) => {
  const { t } = useTranslation('sidebar');
  const svc = routeService();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(route.name);
  const pointCount = route.segments.reduce((sum, seg) => sum + seg.points.length, 0);
  const sourceLabel = t(`operation.route.source.${route.source}`);

  /** 提交内联重命名；空名或未变化时静默放弃。 */
  const commitRename = () => {
    setRenaming(false);
    const next = name.trim();
    if (!next || next === route.name) return;
    void catchErrorWithTip(async () => {
      await svc.renameRoute(route.id, next);
      return true;
    });
  };

  const handleDelete = () => {
    alert.confirm({
      content: t('operation.route.delete.confirm', { name: route.name }),
      onConfirm: async () => {
        await svc.deleteRoute(route.id);
        return true;
      },
    });
  };

  const handlePublish = () => {
    void catchErrorWithTip(async () => {
      const result = await svc.pushToSkland(route.id);
      alert.info(t('operation.route.publish.success'));
      return result;
    });
  };

  const handleUnpublish = () => {
    const sklandRouteId = route.sklandRouteId;
    if (!sklandRouteId) return;
    alert.confirm({
      content: t('operation.route.unpublish.confirm'),
      onConfirm: async () => {
        await svc.deleteOnSkland(route.id, sklandRouteId);
        alert.info(t('operation.route.unpublish.success'));
        return true;
      },
    });
  };

  return (
    <div className="group flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {renaming ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                } else if (e.key === 'Escape') {
                  setRenaming(false);
                }
              }}
              onBlur={commitRename}
              placeholder={t('operation.route.name_placeholder')}
              className="flex-1 min-w-0 bg-white/5 border border-white/15 rounded px-2 py-0.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#FDFB73]/50"
            />
          ) : (
            <span
              className="text-white text-sm truncate cursor-text hover:text-[#FDFB73] transition-colors"
              title={t('operation.route.rename')}
              onClick={() => {
                setName(route.name);
                setRenaming(true);
              }}
            >
              {route.name}
            </span>
          )}
          <span
            className={cn(
              'shrink-0 text-[10px] px-1.5 py-0.5 border rounded',
              route.source === 'skland'
                ? 'border-[#01ffa2]/40 text-[#01ffa2]'
                : 'border-white/20 text-white/50'
            )}
          >
            {sourceLabel}
          </span>
        </div>
        <div className="text-white/40 text-xs mt-0.5 flex gap-2">
          <span>
            {pointCount} · {route.segments.length}
          </span>
          {route.author ? <span className="truncate">{route.author}</span> : null}
          {route.sklandRouteId ? <span className="shrink-0 text-[#01ffa2]/70">SK</span> : null}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {route.source === 'local' && (
          <button
            onClick={handlePublish}
            title={t('operation.route.publish.start')}
            className="px-2 py-1 text-xs text-[#01ffa2]/80 hover:text-[#01ffa2] border border-[#01ffa2]/30 hover:border-[#01ffa2]/60 rounded transition-colors"
          >
            {t('operation.route.publish.start')}
          </button>
        )}
        {route.sklandRouteId && (
          <button
            onClick={handleUnpublish}
            title={t('operation.route.unpublish.start')}
            className="px-2 py-1 text-xs text-[#FDFB73]/70 hover:text-[#FDFB73] border border-[#FDFB73]/30 hover:border-[#FDFB73]/60 rounded transition-colors"
          >
            {t('operation.route.unpublish.start')}
          </button>
        )}
        <button
          onClick={handleDelete}
          title={t('operation.route.delete.confirm', { name: route.name })}
          className="p-1.5 text-white/40 hover:text-white rounded transition-colors"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

/**
 * 路线管理面板：显示开关 + 草稿编辑 + 路线列表。
 */
export const RouteManager = observer(() => {
  const { t } = useTranslation('sidebar');
  const isMobile = useIsMobile();
  const svc = routeService();

  return (
    <div
      className={cn(
        'top-0 left-0 h-full w-full pt-1 overflow-hidden transition-all bg-[#272727] z-2 flex flex-col',
        isMobile ? 'relative' : 'absolute z-5'
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="text-white text-sm font-medium">{t('operation.route_manager')}</div>
        <button
          onClick={() => svc.toggleVisibility()}
          className="p-1.5 text-white/60 hover:text-white rounded transition-colors"
          title={t('operation.route.display')}
        >
          {svc.visible ? <VisibleIcon className="w-4 h-4" /> : <InVisibleIcon className="w-4 h-4" />}
        </button>
      </div>

      <ScrollArea className="flex-1 min-h-0" scrollY>
        <div className="flex flex-col gap-2 px-3 py-3">
          <DraftEditor />
          {svc.routes.length === 0 && !svc.isPicking && (
            <div className="text-white/40 text-xs py-6 text-center">{t('operation.route.no_data')}</div>
          )}
          {svc.routes.map((route) => (
            <RouteItem key={route.id} route={route} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
});
