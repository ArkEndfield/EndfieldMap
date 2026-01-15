export const RewardTitle = ({ children = 'Title' }: React.PropsWithChildren) => {
  return (
    <div className="mb-2">
      <div className="text-lg font-bold">{children}</div>
      <div className="h-2 flex items-stretch">
        <div className="w-18 bg-[#434343]"></div>
        <div className="flex-1 bg-[linear-gradient(-45deg,#434343,#43434300_20.58050117%,#434343_0,#434343_29.41949883%,#43434300_0,#43434300_70.58050117%,#434343_0,#434343_79.41949883%,#43434300_0,#43434300)] bg-repeat bg-size-[0.2em_0.2em]"></div>
      </div>
    </div>
  );
};
