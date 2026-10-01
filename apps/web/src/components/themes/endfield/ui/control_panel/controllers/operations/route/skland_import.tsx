import type { SklandRouteAgg } from '@endfieldmap/map-service';
import { cn, logger } from '@endfieldmap/tools';
import { ButtonWithAudio, Dialog, ZmdSquareButton } from '@endfieldmap/web-components';
import { ZmdAlertTickIcon } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { service } from '@/services';
import { catchErrorWithTip } from '@/utils/handler';

const PAGE_SIZE = 20;

/** 一条路线广场条目：标题 + 作者 + 段数 + 点赞，右侧「导入到本地」。 */
const RouteRow = ({
  agg,
  importing,
  onImport,
  title,
}: {
  agg: SklandRouteAgg;
  importing: boolean;
  onImport: () => void;
  title: string;
}) => {
  const { t } = useTranslation('sidebar');
  const segmentCount = agg.route?.routeSegments?.length ?? 0;
  const likeCount = agg.routeRts?.liked ?? '0';

  return (
    <div className="flex items-center gap-3 border border-white/10 bg-white/5 px-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm truncate">{agg.route?.title || title}</div>
        <div className="text-white/40 text-xs mt-0.5 flex gap-2">
          <span className="truncate">
            {t('operation.route.import.author')}: {agg.poster?.nickname || '-'}
          </span>
          <span className="shrink-0">{t('operation.route.import.segments', { count: segmentCount })}</span>
          <span className="shrink-0">♥ {likeCount}</span>
        </div>
      </div>
      <ButtonWithAudio
        disabled={importing}
        onClick={onImport}
        className={cn(
          'shrink-0 px-3 py-1.5 text-xs rounded border border-[#01ffa2]/40 text-[#01ffa2]',
          importing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#01ffa2]/10'
        )}
      >
        {importing ? t('operation.route.import.importing') : t('operation.route.import.import')}
      </ButtonWithAudio>
    </div>
  );
};

interface RouteImportDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 森空岛路线广场浏览 / 手动导入。
 *
 * 数据只在用户点击「导入」时才拉取详情并写入浏览器本地（route collection），
 * 列表本身也不做任何缓存；本站服务端全程不落库。
 */
export const RouteImportDialog = observer(({ open, onClose }: RouteImportDialogProps) => {
  const { t } = useTranslation('sidebar');
  const [items, setItems] = useState<SklandRouteAgg[]>([]);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [sortNewest, setSortNewest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const roleId = service.userService.auth.currentUidInfo?.uid;

  const fetchPage = useCallback(
    async (token: string | null, append: boolean, search: string, newest: boolean) => {
      setLoading(true);
      try {
        const res = await service.sklandRouteService.fetchRouteList({
          roleId,
          sort: newest ? 2 : 3,
          size: PAGE_SIZE,
          pageToken: token ?? undefined,
          title: search || undefined,
        });
        setFailed(false);
        setPageToken(res.pageToken ?? null);
        setHasMore(Boolean(res.hasMore));
        setItems((prev) => (append ? [...prev, ...(res.routeAggs ?? [])] : res.routeAggs ?? []));
      } catch (error) {
        logger.error('[RouteImportDialog] fetch route list failed', error);
        setFailed(true);
        setHasMore(false);
        if (!append) setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [roleId]
  );

  useEffect(() => {
    if (open) {
      void fetchPage(null, false, keyword, sortNewest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sortNewest]);

  const handleSearch = () => {
    void fetchPage(null, false, keyword, sortNewest);
  };

  const handleImport = (agg: SklandRouteAgg) => {
    if (!agg.route?.routeId) return;
    setImportingId(agg.route.routeId);
    catchErrorWithTip(async () => {
      await service.dataService.mapDataService.routeDataService.importFromSkland(agg.route.routeId, roleId);
      alert.info(t('operation.route.import.success'));
      return true;
    }).finally(() => setImportingId(null));
  };

  return (
    <Dialog
      open={open}
      title={t('operation.route.import.title')}
      icon={<ZmdAlertTickIcon />}
      width="34rem"
      keyboardCloseable
      onClose={onClose}
      onDismiss={onClose}
    >
      <div className="flex flex-col gap-3 px-5 pb-5 pt-1 font-[Outfit]">
        <p className="text-white/50 text-xs leading-relaxed">{t('operation.route.import.desc')}</p>

        <div className="flex gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('operation.route.import.search_placeholder')}
            className="flex-1 min-w-0 bg-white/5 border border-white/15 rounded px-2 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#01ffa2]/50"
          />
          <ButtonWithAudio
            onClick={handleSearch}
            className="px-3 py-1.5 text-xs rounded border border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            {t('common:confirm')}
          </ButtonWithAudio>
          <ButtonWithAudio
            onClick={() => setSortNewest((v) => !v)}
            className={cn(
              'px-3 py-1.5 text-xs rounded border',
              sortNewest
                ? 'border-[#FDFB73]/50 text-[#FDFB73] bg-[#FDFB73]/10'
                : 'border-white/20 bg-white/10 text-white/70 hover:bg-white/20'
            )}
          >
            {sortNewest ? t('operation.route.import.sort_new') : t('operation.route.import.sort_hot')}
          </ButtonWithAudio>
        </div>

        <div className="max-h-80 overflow-y-auto">
          <div className="flex flex-col gap-2 pr-1">
            {failed && <div className="text-white/40 text-xs py-4 text-center">{t('operation.route.import.empty')}</div>}
            {!failed && items.length === 0 && !loading && (
              <div className="text-white/40 text-xs py-4 text-center">{t('operation.route.import.empty')}</div>
            )}
            {items.map((agg) => (
              <RouteRow
                key={agg.route?.routeId}
                agg={agg}
                importing={importingId === agg.route?.routeId}
                onImport={() => handleImport(agg)}
                title=""
              />
            ))}
            {loading && <div className="text-white/30 text-xs py-2 text-center">...</div>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          {hasMore ? (
            <ButtonWithAudio
              disabled={loading}
              onClick={() => void fetchPage(pageToken, true, keyword, sortNewest)}
              className="px-3 py-1.5 text-xs rounded border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-50"
            >
              {t('operation.route.import.load_more')}
            </ButtonWithAudio>
          ) : (
            <span />
          )}
          <ZmdSquareButton onClick={onClose}>{t('common:back')}</ZmdSquareButton>
        </div>
      </div>
    </Dialog>
  );
});
