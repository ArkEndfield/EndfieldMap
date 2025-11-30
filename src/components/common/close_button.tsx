import { cn } from '@/utils/style';

export const CloseButton = ({ onClose, className }: { onClose: () => void; className?: string }) => {
  return (
    <button
      className={cn(
        'shrink-0 grow-0 top-4 w-6.5 h-6.5',
        'text-[#FFFEFE] hover:text-[#c9c9c9]',
        'flex justify-center items-center',
        'rounded-full drop-shadow-sm active:scale-95 transition-[transform_colors]',
        className
      )}
      onClick={onClose}
    >
      <svg width="100%" height="100%" viewBox="0 0 75 75" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M37.5 0C58.2107 0 75 16.7893 75 37.5C75 58.2107 58.2107 75 37.5 75C16.7893 75 0 58.2107 0 37.5C0 16.7893 16.7893 0 37.5 0ZM40.3301 40.3271L37.502 43.1553L56.8457 62.5L62.5029 56.8428L43.1592 37.499L40.3301 40.3271ZM37.498 31.8457L18.1543 12.502L12.498 18.1582L31.8408 37.501L12.502 56.8398L18.1582 62.4961L37.5049 43.1504L34.6758 40.3223L31.8506 37.4971L34.6719 34.6758L37.498 31.8486L43.1533 37.5039L62.501 18.1562L56.8447 12.5L37.498 31.8457Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
};
