import { isDev } from '@/services/env';

export const Version = () => (
  <div className="text-xs text-[#cbcbcb] text-center mt-6 mb-6 font-[Outfit] flex gap-2">
    <span>PATCH: {isDev ? 'Dev Mode' : (__COMMIT_HASH__ ?? 'Unknown')}</span>
    <span>BuildAt: {__BUILD_TIME__ ?? 'Unknown'}</span>
  </div>
);
