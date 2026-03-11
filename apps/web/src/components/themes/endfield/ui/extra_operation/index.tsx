import { BackToCenter } from '@themes/endfield/ui/extra_operation/backto_center';
import { EnableTier } from '@themes/endfield/ui/extra_operation/enable_tier';
import { PiPButton } from '@themes/endfield/ui/extra_operation/pip_button';

const ExtraOperation = () => {
  return (
    <div className="fixed right-4.5 bottom-42 flex flex-col gap-2 md:bottom-1/2 md:translate-y-1/2 md:-mb-45">
      <BackToCenter />
      <EnableTier />
      <PiPButton />
    </div>
  );
};

export default ExtraOperation;
