export const Loading = () => (
  <div className="relative flex w-[1em] h-[1em]">
    <i className="absolute w-full h-full rounded-full border-2 border-b-primary animate-spinner-ease-spin border-solid border-t-transparent border-l-transparent border-r-transparent"></i>
    <i className="absolute w-full h-full rounded-full border-2 border-b-primary opacity-75 animate-spinner-linear-spin border-dotted border-t-transparent border-l-transparent border-r-transparent"></i>
  </div>
);