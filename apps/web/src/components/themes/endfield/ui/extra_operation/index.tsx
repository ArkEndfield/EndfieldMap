import { AiAssistantButton } from '@themes/endfield/ui/extra_operation/ai_button';
import { BackToCenter } from '@themes/endfield/ui/extra_operation/backto_center';
import { EnableTier } from '@themes/endfield/ui/extra_operation/enable_tier';
import { PiPButton } from '@themes/endfield/ui/extra_operation/pip_button';
import { PlayerLocateButton } from '@themes/endfield/ui/extra_operation/player_locate';

const ExtraOperation = () => {
  return (
    <div className="fixed right-4.5 bottom-42 flex flex-col gap-2 md:bottom-1/2 md:translate-y-1/2 md:-mb-45">
      <BackToCenter />
      <PlayerLocateButton />
      <EnableTier />
      <PiPButton />
      <AiAssistantButton />
    </div>
  );
};

export default ExtraOperation;
