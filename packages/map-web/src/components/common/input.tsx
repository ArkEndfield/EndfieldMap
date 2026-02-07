import { type InputProps } from '@themes/types/input';
import { observer } from 'mobx-react-lite';
import { Suspense } from 'react';

import uiManager from '@/services/ui_manager';

const InputRenderer = observer((props: InputProps) => {
  const PromptInputComponent = uiManager.ThemedComponents.Input;

  if (!PromptInputComponent) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <PromptInputComponent {...props} />
    </Suspense>
  );
});

export const Input = (props: InputProps) => {
  return <InputRenderer {...props} />;
};
