export const BgDeco = () => (
  <div className="absolute -z-1 left-5 select-none">
    <div className="relative w-30 h-25 -top-2 bg-no-repeat bg-contain opacity-10 bg-[url(/images/bg/deco_common_logo_bg.png)]"></div>
    <div className="font-[Outfit] absolute top-2 left-2">
      <svg
        width="40"
        height="10"
        viewBox="0 0 40 10"
        fill="none"
        className="text-[#666]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text x="0" y="5" fill="currentColor" fontSize="4" fontFamily="Outfit" fontWeight="400">
          绝命笋干JMSG
        </text>
        <text x="0" y="10" fill="currentColor" fontSize="4" fontFamily="Outfit" fontWeight="400">
          ZMDMAP
        </text>
      </svg>
      <div className="flex items-center">
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="14" x2="8" y2="0" stroke="currentColor" strokeWidth="2" />
        </svg>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="14" x2="8" y2="0" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span className="ml-1">SETTINGS</span>
      </div>
    </div>
  </div>
);
