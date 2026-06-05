import type { CustomPointData, ElectricPoleData, EntityData } from '@endfieldmap/map-core';
import { invalidateGuideCache } from '@endfieldmap/map-hooks';
import type { GuideInfo } from '@endfieldmap/map-service';
import {
  type CreateGuideReq,
  GuideApiError,
  GuideErrorCode,
  type UpdateGuideReq,
} from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { service } from '@/services';

/** 描述字符上限（与后端 1..500 对齐） */
const DESCRIPTION_MAX = 500;
/** 单张图片大小上限（MB） */
const IMAGE_MAX_MB = 5;
/** 单次最多上传图片数 */
const IMAGE_MAX_COUNT = 5;
/** 接受的图片 mime */
const ACCEPTED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
type AcceptedMime = (typeof ACCEPTED_MIME)[number];

const isAcceptedMime = (mime: string): mime is AcceptedMime =>
  (ACCEPTED_MIME as readonly string[]).includes(mime);

interface PendingImage {
  /** 客户端临时 key，仅用于 React list 去重 */
  key: string;
  name: string;
  /** dataURL，提交时传给后端 */
  dataURL: string;
}

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('not_string'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('read_error'));
    reader.readAsDataURL(file);
  });

type Entity = EntityData | CustomPointData | ElectricPoleData;

interface GuideUploadPanelProps {
  /** 标点 entity，用于派生 internal_id / area / marker_type */
  entity: Entity;
  /** 已存在的 guide（若有），用于复用 record_id / area / marker_type */
  guide: GuideInfo | null | undefined;
}

/**
 * 派生 area：
 * - 已有 guide 时直接复用
 * - 否则 fallback 到 entity.mapId（后端 area 是 single-select，可能拒绝，但保留 UX 完整）
 */
const deriveArea = (entity: Entity, guide: GuideInfo | null | undefined): string => {
  if (guide?.area) return guide.area;
  return entity.entityInfo?.category ?? '';
};

/**
 * 派生 marker_type：
 * - 已有 guide 时直接复用
 * - 否则用 entity 的 category
 */
const deriveMarkerType = (entity: Entity, guide: GuideInfo | null | undefined): string => {
  if (guide?.marker_type) return guide.marker_type;
  return entity.entityInfo?.category ?? '';
};

export const GuideUploadPanel: React.FC<GuideUploadPanelProps> = observer(({ entity, guide }) => {
  const { t } = useTranslation('popup');
  const { isLogin } = service.userService.auth;

  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState<string>('');
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilePick = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const remaining = IMAGE_MAX_COUNT - pending.length;
      if (remaining <= 0) {
        alert.info(t('upload.validation.image_count_exceeded', { count: IMAGE_MAX_COUNT }));
        return;
      }
      const incoming = Array.from(files).slice(0, remaining);
      const added: PendingImage[] = [];
      for (const file of incoming) {
        if (!isAcceptedMime(file.type)) {
          alert.info(t('upload.validation.image_type_unsupported', { name: file.name }));
          continue;
        }
        if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
          alert.info(t('upload.validation.image_too_large', { name: file.name, size: IMAGE_MAX_MB }));
          continue;
        }
        try {
          const dataURL = await readFileAsDataURL(file);
          added.push({
            key: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            dataURL,
          });
        } catch {
          alert.info(t('upload.validation.image_read_failed', { name: file.name }));
        }
      }
      if (added.length > 0) {
        setPending((prev) => [...prev, ...added]);
      }
      if (files.length > remaining) {
        alert.info(t('upload.validation.image_count_exceeded', { count: IMAGE_MAX_COUNT }));
      }
    },
    [pending.length, t]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handleFilePick(e.target.files);
    // 允许重复选择相同文件
    e.target.value = '';
  };

  const handleRemoveImage = (key: string) => {
    setPending((prev) => prev.filter((item) => item.key !== key));
  };

  const handleSubmit = async () => {
    if (!isLogin) {
      alert.info(t('upload.result.not_login'));
      return;
    }
    const trimmed = description.trim();
    if (!trimmed) {
      alert.info(t('upload.validation.description_required'));
      return;
    }
    if (trimmed.length > DESCRIPTION_MAX) {
      alert.info(t('upload.validation.description_too_long'));
      return;
    }

    const internalId = entity.levelLogicId;
    if (!internalId || internalId <= 0) {
      alert.info(t('upload.result.submit_failed', { message: 'internal_id' }));
      return;
    }

    const images = pending.map((item) => item.dataURL);

    setSubmitting(true);
    const guideService = service.dataService.guideDataService;

    try {
      if (guide?.record_id) {
        const body: UpdateGuideReq = {
          description: trimmed,
        };
        if (images.length > 0) {
          body.images = images;
        }
        await guideService.updateGuide(guide.record_id, body);
        invalidateGuideCache(internalId);
        alert.info(t('upload.result.success'));
        resetForm();
        return;
      }

      const createBody: CreateGuideReq = {
        internal_id: internalId,
        area: deriveArea(entity, guide),
        marker_type: deriveMarkerType(entity, guide),
        description: trimmed,
      };
      if (images.length > 0) {
        createBody.images = images;
      }
      try {
        await guideService.createGuide(createBody);
        invalidateGuideCache(internalId);
        alert.info(t('upload.result.success'));
        resetForm();
      } catch (err) {
        // 80005: 已存在 -> fallback 走 PATCH（用 internal_id 拿 record_id 再 update）
        if (err instanceof GuideApiError && err.code === GuideErrorCode.AlreadyExists) {
          const existing = await guideService.getGuide(internalId);
          if (existing?.record_id) {
            const body: UpdateGuideReq = { description: trimmed };
            if (images.length > 0) body.images = images;
            await guideService.updateGuide(existing.record_id, body);
            invalidateGuideCache(internalId);
            alert.info(t('upload.result.already_exists_fallback'));
            resetForm();
            return;
          }
          alert.info(t('upload.result.submit_failed', { message: err.message }));
          return;
        }
        throw err;
      }
    } catch (err) {
      if (err instanceof GuideApiError && err.code === GuideErrorCode.UploadFailed) {
        alert.info(t('upload.result.upload_failed_retry'));
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      alert.info(t('upload.result.submit_failed', { message }));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setPending([]);
    setExpanded(false);
  };

  // 未登录直接展示登录提示，不展示表单
  if (!isLogin) {
    return (
      <div className="mt-3 mx-3 mb-2 px-3 py-2 text-xs text-[#aaaaaa] bg-white/[0.04] ring-1 ring-white/10 rounded">
        {t('upload.entry_login_required')}
      </div>
    );
  }

  const remaining = DESCRIPTION_MAX - description.length;
  const canAddMore = pending.length < IMAGE_MAX_COUNT;

  return (
    <div className="mt-3 mx-3 mb-2">
      <ButtonWithAudio
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'w-full text-left text-xs px-3 py-2 flex items-center justify-between',
          'bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.08] transition-colors',
          'text-[#dcdcdc]'
        )}
      >
        <span>{t('upload.entry')}</span>
        <span className="text-[10px] text-[#aaaaaa]">{expanded ? t('upload.close') : t('upload.open')}</span>
      </ButtonWithAudio>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="upload-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 px-3 py-3 bg-white/[0.03] ring-1 ring-white/10 flex flex-col gap-2">
              {/* 描述 */}
              <label className="text-[11px] text-[#aaaaaa]" htmlFor="guide-upload-description">
                {t('upload.description_label')}
              </label>
              <textarea
                id="guide-upload-description"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
                placeholder={t('upload.description_placeholder')}
                rows={3}
                disabled={submitting}
                className={cn(
                  'w-full resize-y rounded-md px-2 py-1.5 text-xs',
                  'bg-[#1f201f] text-white placeholder-[#888]',
                  'ring-1 ring-white/10 focus:ring-[#fcee21]/40 focus:outline-none',
                  'min-h-16 max-h-40'
                )}
              />
              <div className={cn('text-[10px] self-end', remaining < 0 ? 'text-red-400' : 'text-[#888]')}>
                {description.length} / {DESCRIPTION_MAX}
              </div>

              {/* 图片 */}
              <label className="text-[11px] text-[#aaaaaa] mt-1">{t('upload.images_label')}</label>
              <div className="text-[10px] text-[#888] leading-relaxed">
                {t('upload.images_hint', { size: IMAGE_MAX_MB, count: IMAGE_MAX_COUNT })}
              </div>

              {pending.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {pending.map((item) => (
                    <div key={item.key} className="relative group">
                      <img
                        src={item.dataURL}
                        alt={item.name}
                        className="w-full aspect-square object-cover ring-1 ring-white/15"
                      />
                      <ButtonWithAudio
                        type="button"
                        onClick={() => handleRemoveImage(item.key)}
                        disabled={submitting}
                        className={cn(
                          'absolute top-0.5 right-0.5 px-1 py-0.5 text-[10px]',
                          'bg-black/70 text-white ring-1 ring-white/20 hover:bg-black'
                        )}
                      >
                        {t('upload.remove_image')}
                      </ButtonWithAudio>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_MIME.join(',')}
                multiple
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="flex gap-2 flex-wrap">
                <ButtonWithAudio
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting || !canAddMore}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full ring-1',
                    canAddMore && !submitting
                      ? 'bg-white/10 ring-white/20 hover:bg-white/15 text-white'
                      : 'bg-white/5 ring-white/10 text-[#666] cursor-not-allowed'
                  )}
                >
                  {t('upload.add_image')}
                </ButtonWithAudio>
                <ButtonWithAudio
                  type="button"
                  onClick={() => {
                    resetForm();
                  }}
                  disabled={submitting}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full ring-1 ring-white/15 bg-white/5 text-[#dcdcdc]',
                    'hover:bg-white/10 disabled:opacity-50'
                  )}
                >
                  {t('upload.cancel')}
                </ButtonWithAudio>
                <ButtonWithAudio
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  className={cn(
                    'ml-auto text-xs px-3 py-1.5 rounded-full ring-1',
                    'bg-[#fcee21] text-[#272827] ring-[#fcee21]/40 hover:bg-[#fff14b] font-medium',
                    'disabled:opacity-60'
                  )}
                >
                  {submitting ? t('upload.submitting') : t('upload.submit')}
                </ButtonWithAudio>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
