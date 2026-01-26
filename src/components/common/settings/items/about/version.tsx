import { getVersionInfo } from '@endfieldmap/tools';
import { isDev } from '@/services/env';

const { commitHash, buildTime } = getVersionInfo();

export const Version = () => (
  <div className="text-xs text-[#cbcbcb] text-center mt-6 mb-6 font-[Outfit] flex gap-2">
    <span>PATCH: {isDev ? 'Dev Mode' : commitHash}</span>
    <span>BuildAt: {buildTime}</span>
  </div>
);
