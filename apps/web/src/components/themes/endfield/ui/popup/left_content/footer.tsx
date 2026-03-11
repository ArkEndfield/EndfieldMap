/** 底部图标和标题 */
export const Footer = ({
  name,
  pic,
  id,
  categoryName,
}: {
  name: string;
  pic: string;
  id: string | number;
  categoryName: string;
}) => (
  <div className="shrink-0 relative px-3 pt-1 pb-1 overflow-hidden">
    <div className="absolute -left-1 top-0 -bottom-1 z-0">
      <img src={pic} className="h-full opacity-20 object-cover" />
    </div>
    <div className="relative flex z-1 w-full items-end font-[Outfit]">
      <div className="overflow-hidden flex-1">
        <div className="text-xs text-[#7d7d7d] truncate -mb-1">{categoryName}</div>
        <div className="text-lg font-bold truncate">{name}</div>
      </div>
      <span className="ml-auto text-[#7d7d7d] text-xs">ID {id}</span>
    </div>
  </div>
);
