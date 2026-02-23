import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio } from '@endfieldmap/web-components';

export const CommunityCard = ({
  title,
  icon,
  link,
  type = 'default',
}: {
  title: string;
  icon: React.ReactNode;
  link: string;
  type?: 'default' | 'primary';
}) => {
  const isPrimary = type === 'primary';

  return (
    <a href={link} target="_blank">
      <ButtonWithAudio
        className={cn(
          'bg-[url(/images/bg/button-texture.png)] bg-no-repeat bg-right bg-cover',
          'flex items-center relative gap-2 text-[#191919] p-2 pr-4 rounded-xs shadow-[0_0_.75rem_rgba(0,0,0,.4)]',
          'border-l-2 group transition-colors duration-300 min-w-64',
          isPrimary
            ? 'border-[#fff500] bg-[#fffa00] hover:border-[#efe701]'
            : 'border-[#ccc] bg-[#f2f2f2] hover:border-[#aaa]'
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 19 9"
          className="absolute top-0.5 left-1 w-2 h-auto text-[#7e7e7e]"
        >
          <path
            fillRule="evenodd"
            opacity="0.502"
            fill="currentColor"
            d="M16.562,3.528 C15.639,3.528 14.892,2.798 14.892,1.898 C14.892,0.998 15.639,0.268 16.562,0.268 C17.484,0.268 18.231,0.998 18.231,1.898 C18.231,2.798 17.484,3.528 16.562,3.528 ZM11.887,8.092 C10.965,8.092 10.218,7.362 10.218,6.462 C10.218,5.562 10.965,4.832 11.887,4.832 C12.809,4.832 13.557,5.562 13.557,6.462 C13.557,7.362 12.809,8.092 11.887,8.092 ZM11.887,3.528 C10.965,3.528 10.218,2.798 10.218,1.898 C10.218,0.998 10.965,0.268 11.887,0.268 C12.809,0.268 13.557,0.998 13.557,1.898 C13.557,2.798 12.809,3.528 11.887,3.528 ZM7.212,8.092 C6.290,8.092 5.543,7.362 5.543,6.462 C5.543,5.562 6.290,4.832 7.212,4.832 C8.134,4.832 8.882,5.562 8.882,6.462 C8.882,7.362 8.134,8.092 7.212,8.092 ZM7.212,3.528 C6.290,3.528 5.543,2.798 5.543,1.898 C5.543,0.998 6.290,0.268 7.212,0.268 C8.134,0.268 8.882,0.998 8.882,1.898 C8.882,2.798 8.134,3.528 7.212,3.528 ZM2.538,8.092 C1.616,8.092 0.868,7.362 0.868,6.462 C0.868,5.562 1.616,4.832 2.538,4.832 C3.460,4.832 4.207,5.562 4.207,6.462 C4.207,7.362 3.460,8.092 2.538,8.092 ZM2.538,3.528 C1.616,3.528 0.868,2.798 0.868,1.898 C0.868,0.998 1.616,0.268 2.538,0.268 C3.460,0.268 4.207,0.998 4.207,1.898 C4.207,2.798 3.460,3.528 2.538,3.528 Z"
          ></path>
        </svg>
        <div className="rounded-full text-3xl flex items-center justify-center">{icon}</div>
        <div
          className={cn(
            'relative self-stretch shrink-0 grow-0 w-0.5 transition-colors duration-300',
            isPrimary ? 'bg-[#fff500] group-hover:bg-[#efe701]' : 'bg-[#ccc] group-hover:bg-[#aaa]'
          )}
        />
        <div className="flex flex-1 items-center gap-1 px-2 justify-center">
          <div className="text-center">{title}</div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="rotate-180 mt-1 group-hover:ml-1 transition-all duration-300"
            viewBox="0 0 18 27"
            width="0.6em"
            height="0.6em"
          >
            <path
              fillRule="evenodd"
              fill="currentColor"
              d="M14.142,0.127 L17.753,3.737 L7.963,13.527 L17.753,23.318 L14.142,26.928 L0.743,13.527 L14.142,0.127 Z"
            ></path>
          </svg>
        </div>
      </ButtonWithAudio>
    </a>
  );
};
