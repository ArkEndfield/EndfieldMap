import { type PromptInputProps } from '@themes/types/alert';
import { observer } from 'mobx-react-lite';
import { Suspense } from 'react';

import uiManager from '@/services/ui_manager';

const AlertPromptInputRenderer = observer((props: PromptInputProps) => {
  const PromptInputComponent = uiManager.ThemedComponents.alert.AlertPromptInput;

  if (!PromptInputComponent) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <PromptInputComponent {...props} />
    </Suspense>
  );
});

export const PromptInput = (props: PromptInputProps) => {
  return <AlertPromptInputRenderer {...props} />;
};

export type { PromptInputProps };
