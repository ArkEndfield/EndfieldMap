import { cn } from '@endfieldmap/tools';
import { motion } from 'motion/react';

import { getDeviceId, getLastSentryEventId } from '@/services/sentry_diagnostics';

export const Feedback = ({ hidden }: { hidden?: boolean }) => {
  const feedbackUrl = new URL('https://docs.zmdmap.com/share/shrc22t2uOoeZGKm3eP/view');
  feedbackUrl.searchParams.set('embed', 'true');
  feedbackUrl.searchParams.set('deviceId', getDeviceId());

  const lastEventId = getLastSentryEventId();
  if (lastEventId) {
    feedbackUrl.searchParams.set('lastEvent', lastEventId);
  }

  return (
    <motion.iframe
      initial={false}
      animate={{ opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.2 }}
      src={feedbackUrl.toString()}
      className={cn('absolute inset-0 border-0 w-full h-full', hidden && 'pointer-events-none')}
    />
  );
};
