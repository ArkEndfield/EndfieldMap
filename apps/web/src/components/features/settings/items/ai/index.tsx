import { DEFAULT_AI_BASE_URL } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import {
  ChatIcon,
  CheckCircleIcon,
  CloseSquareIcon,
  EndfieldFormButton,
  EndfieldInput,
  EndfieldSelect,
  EndfieldSwitch,
  KeyIcon,
} from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Loading } from '@/components/common/settings/components/loading';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SettingsZone } from '@/components/common/settings/components/settings_zone';
import { SETTINGS_KEYS } from '@/const/settings';
import { usePromiseState } from '@/hooks/use_promise_state';
import { service } from '@/services';

const TEMPERATURE_OPTIONS: string[] = ['0', '0.3', '0.7', '1'];

/** 输入框在设置页里统一占满右侧内容区，且不能抢焦点（同页有多个）。 */
const FIELD_CONTENT_CLASS = 'md:min-w-96';

const TestResult = ({ ok, text }: { ok: boolean; text: string }) => (
  <span className={cn('flex items-center gap-1', ok ? 'text-[#01ffa2]' : 'text-[#ff6b6b]')}>
    <span className="shrink-0 text-sm">{ok ? <CheckCircleIcon /> : <CloseSquareIcon />}</span>
    <span className="min-w-0 break-all">{text}</span>
  </span>
);

export const AiSettings = observer(() => {
  const { t } = useTranslation(['settings', 'common']);
  const aiService = service.aiService;
  const config = aiService.config;
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  const { loading, execute: refreshModels } = usePromiseState({
    fun: () => aiService.refreshModels(),
    onSuccess: (models) => {
      // 用 num 而不是 count：count 会触发 i18next 复数解析，去找并不存在的 _one / _other
      setTestResult({ ok: true, text: t('settings:ai.provider.test_success', { num: models.length }) });
    },
    onFailed: (error) => {
      setTestResult({ ok: false, text: t('settings:ai.provider.test_failed', { reason: error.message }) });
    },
  });

  const modelOptions = config.models.map((model) => ({ value: model.id, label: model.id }));

  return (
    <div className="space-y-4">
      <SettingsZone title={t('settings:ai.title')} icon={<ChatIcon />}>
        <SettingItem
          id={SETTINGS_KEYS.AI.ENABLED}
          title={t('settings:ai.enabled.title')}
          description={t('settings:ai.enabled.description')}
          tailDeco
        >
          <EndfieldSwitch
            checked={config.enabled.value}
            onChange={(value) => (config.enabled.value = value)}
            onText={t('common:yes')}
            offText={t('common:no')}
          />
        </SettingItem>
      </SettingsZone>

      <SettingsZone title={t('settings:ai.provider.title')} icon={<KeyIcon />}>
        <SettingItem
          id={SETTINGS_KEYS.AI.PROVIDER}
          title={t('settings:ai.provider.base_url.title')}
          description={t('settings:ai.provider.base_url.description')}
          classNames={{ content: FIELD_CONTENT_CLASS }}
        >
          <EndfieldInput
            className="w-full"
            autoFocus={false}
            value={config.baseUrl.value}
            placeholder={DEFAULT_AI_BASE_URL}
            onValueChange={(value) => (config.baseUrl.value = value)}
          />
        </SettingItem>

        <SettingItem
          title={t('settings:ai.provider.api_key.title')}
          description={t('settings:ai.provider.api_key.description')}
          classNames={{ content: FIELD_CONTENT_CLASS }}
        >
          <EndfieldInput
            className="w-full"
            autoFocus={false}
            inputType="password"
            value={config.apiKey.value}
            placeholder="sk-..."
            onValueChange={(value) => (config.apiKey.value = value)}
          />
        </SettingItem>

        <SettingItem
          id={SETTINGS_KEYS.AI.MODEL}
          title={t('settings:ai.provider.model.title')}
          description={testResult ? <TestResult {...testResult} /> : t('settings:ai.provider.model.description')}
          classNames={{ content: FIELD_CONTENT_CLASS }}
        >
          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center gap-2">
              <EndfieldInput
                className="min-w-0 flex-1"
                autoFocus={false}
                value={config.model.value}
                placeholder="deepseek-chat"
                onValueChange={(value) => (config.model.value = value)}
              />
              <EndfieldFormButton
                // 收窄成自适应宽度后，左侧 spinner 是绝对定位的，得自己让出位置
                className={cn('w-auto shrink-0', loading && 'pl-9')}
                variant="primary"
                disabled={loading}
                left={loading ? <Loading /> : undefined}
                onClick={() => refreshModels()}
              >
                {t('settings:ai.provider.test')}
              </EndfieldFormButton>
            </div>
            {/* 拉到列表后再出现：多数供应商模型名很长，下拉比手打可靠 */}
            {modelOptions.length > 0 && (
              <EndfieldSelect
                value={config.model.value}
                options={modelOptions}
                onChange={(value) => (config.model.value = value)}
                classNames={{ optionScrollArea: 'max-h-60' }}
              />
            )}
          </div>
        </SettingItem>

        <SettingItem
          id={SETTINGS_KEYS.AI.TEMPERATURE}
          title={t('settings:ai.provider.temperature.title')}
          description={t('settings:ai.provider.temperature.description')}
          tailDeco
        >
          <EndfieldSelect
            value={String(config.temperature.value)}
            options={TEMPERATURE_OPTIONS.map((value) => ({ value, label: value }))}
            onChange={(value) => (config.temperature.value = Number(value))}
          />
        </SettingItem>
      </SettingsZone>
    </div>
  );
});
