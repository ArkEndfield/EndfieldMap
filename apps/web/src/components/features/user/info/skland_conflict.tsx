import type { SklandSyncPreview } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio, Dialog, ZmdSquareButton } from '@endfieldmap/web-components';
import { SyncIcon, ZmdAlertTickIcon } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/** 用户对一批差异选择的处理方式。 */
export type SklandConflictChoice = 'remote' | 'local' | 'skip';

/** 两个方向各自的选择结果。 */
export interface SklandConflictResolution {
  /** 「森空岛有、本地没有」这批：用森空岛(remote) 还是跳过(skip) */
  remote: SklandConflictChoice;
  /** 「本地有、森空岛没有」这批：用本地(local) 还是跳过(skip) */
  local: SklandConflictChoice;
}

const countIds = (byMap: Record<string, number[]>) => Object.values(byMap).reduce((sum, ids) => sum + ids.length, 0);

/** 一行差异摘要：标题 + 数量 + 说明。 */
const DiffRow = ({
  title,
  count,
  description,
  tone,
}: {
  title: string;
  count: number;
  description: string;
  tone: 'remote' | 'local';
}) => (
  <div
    className={cn(
      'relative flex items-start gap-3 border px-3 py-2.5',
      tone === 'remote' ? 'border-[#01ffa2]/30 bg-[#01ffa2]/5' : 'border-[#FDFB73]/30 bg-[#FDFB73]/5'
    )}
  >
    <div className={cn('absolute left-0 top-3 bottom-3 w-1', tone === 'remote' ? 'bg-[#01ffa2]' : 'bg-[#FDFB73]')} />
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline gap-2">
        <span className="text-white font-medium">{title}</span>
        <span className={cn('font-[Outfit] font-bold', tone === 'remote' ? 'text-[#01ffa2]' : 'text-[#FDFB73]')}>
          {count}
        </span>
      </div>
      <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{description}</p>
    </div>
  </div>
);

interface SklandConflictDialogProps {
  open: boolean;
  preview: SklandSyncPreview | null;
  loading?: boolean;
  onResolve: (resolution: SklandConflictResolution) => void;
  onCancel: () => void;
}

/**
 * 森空岛双向同步的差异确认弹窗。
 *
 * 两个方向分别给一次选择：
 * - 「森空岛有、本地没有」→ 选「用森空岛」把远端标记合并进本地，选「跳过」不动；
 * - 「本地有、森空岛没有」→ 选「用本地」把本地标记写回森空岛，选「跳过」不动。
 *
 * 只有一侧有差异时，只问那一侧。
 */
export const SklandConflictDialog = observer(
  ({ open, preview, loading, onResolve, onCancel }: SklandConflictDialogProps) => {
    const { t } = useTranslation(['header', 'common']);
    const [remoteChoice, setRemoteChoice] = useState<SklandConflictChoice>('remote');
    const [localChoice, setLocalChoice] = useState<SklandConflictChoice>('local');

    const remoteCount = preview ? countIds(preview.remoteOnlyByMap) : 0;
    const localCount = preview ? countIds(preview.localOnlyByMap) : 0;
    const hasRemote = remoteCount > 0;
    const hasLocal = localCount > 0;

    const submit = () => {
      // 只处理存在差异的方向；无差异的一侧固定 skip。
      onResolve({
        remote: hasRemote ? remoteChoice : 'skip',
        local: hasLocal ? localChoice : 'skip',
      });
    };

    return (
      <Dialog
        open={open}
        title={t('user.skland.conflict.title')}
        icon={<ZmdAlertTickIcon />}
        width="30rem"
        dismissible={false}
        keyboardCloseable={!loading}
        onClose={onCancel}
        onDismiss={onCancel}
      >
        <div className="flex flex-col gap-4 px-5 pb-5 pt-1 font-[Outfit]">
          <p className="text-white/60 text-sm leading-relaxed">{t('user.skland.conflict.intro')}</p>

          {preview?.unresolved ? (
            <div className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50">
              <span className="w-1.5 h-1.5 bg-white/30 rotate-45 shrink-0" />
              {t('user.skland.conflict.unresolved', { count: preview.unresolved })}
            </div>
          ) : null}

          {hasRemote && (
            <div className="flex flex-col gap-2">
              <DiffRow
                tone="remote"
                count={remoteCount}
                title={t('user.skland.conflict.remoteOnly')}
                description={t('user.skland.conflict.remoteOnlyDesc')}
              />
              <div className="flex gap-2">
                <ChoiceButton
                  active={remoteChoice === 'remote'}
                  onClick={() => setRemoteChoice('remote')}
                  label={t('user.skland.conflict.useRemote')}
                />
                <ChoiceButton
                  active={remoteChoice === 'skip'}
                  onClick={() => setRemoteChoice('skip')}
                  label={t('user.skland.conflict.skip')}
                />
              </div>
            </div>
          )}

          {hasLocal && (
            <div className="flex flex-col gap-2">
              <DiffRow
                tone="local"
                count={localCount}
                title={t('user.skland.conflict.localOnly')}
                description={t('user.skland.conflict.localOnlyDesc')}
              />
              <div className="flex gap-2">
                <ChoiceButton
                  active={localChoice === 'local'}
                  onClick={() => setLocalChoice('local')}
                  label={t('user.skland.conflict.useLocal')}
                />
                <ChoiceButton
                  active={localChoice === 'skip'}
                  onClick={() => setLocalChoice('skip')}
                  label={t('user.skland.conflict.skip')}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <ButtonWithAudio
              onClick={onCancel}
              disabled={loading}
              className={cn(
                'px-4 py-1.5 text-sm rounded border border-white/20 bg-white/10 text-white',
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20'
              )}
            >
              {t('common:cancel')}
            </ButtonWithAudio>
            <ZmdSquareButton icon={<SyncIcon />} onClick={submit} loading={loading}>
              {loading ? t('user.skland.conflict.applying') : t('user.skland.conflict.apply')}
            </ZmdSquareButton>
          </div>
        </div>
      </Dialog>
    );
  }
);

const ChoiceButton = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
  <ButtonWithAudio
    onClick={onClick}
    className={cn(
      'flex-1 px-3 py-1.5 text-xs rounded border transition-colors',
      active
        ? 'border-[#FDFB73] bg-[#FDFB73]/15 text-[#FDFB73]'
        : 'border-white/15 bg-white/5 text-white/60 hover:bg-white/10'
    )}
  >
    {label}
  </ButtonWithAudio>
);
