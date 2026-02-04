// ==================== 图标组件 ====================
export const SyncIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 0 0-9-9M3 12a9 9 0 0 0 9 9" strokeLinecap="round" />
    <path d="M21 3v9h-9M3 21v-9h9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LogoutIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LoginIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="10 17 15 12 10 7" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="15" y1="12" x2="3" y2="12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SwitchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 7H4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 21l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
