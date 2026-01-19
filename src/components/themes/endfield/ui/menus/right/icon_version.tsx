import { Logo } from '@/components/common/icons';
import { isDev } from '@/services/env';

export const IconVersion = () => (
  <div className="ml-auto z-1 flex shrink-0 overflow-hidden h-full py-2.5 gap-1">
    <svg xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 0 190 25">
      <text x="190" y="11" fontFamily="Outfit, sans-serif" fontSize="12" fill="#626262" textAnchor="end">
        PATCH: {isDev ? 'Dev Mode' : (__COMMIT_HASH__ ?? 'Unknown')}
      </text>
      <text x="190" y="24" fontFamily="Outfit, sans-serif" fontSize="12" fill="#626262" textAnchor="end">
        BuildAt: {__BUILD_TIME__ ?? 'Unknown'}
      </text>
    </svg>
    <Logo height="100%" />
  </div>
);
