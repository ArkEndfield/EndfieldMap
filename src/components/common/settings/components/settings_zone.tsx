import { cn } from '@/utils/style';

export interface SettingsZoneProps {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  classNames?: {
    title?: string;
    content?: string;
  };
}

const Deco = () => (
  <svg height="5px" viewBox="0 0 922 107" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M86.8622 26.2048H166.529V80.7952H86.8622V26.2048Z" fill="currentColor" />
    <path d="M369.777 26.2048H449.444V80.7952H369.777V26.2048Z" fill="currentColor" />
    <path d="M178.712 26.2048H357.594V80.7952H178.712V26.2048Z" fill="currentColor" />
    <path d="M461.627 26.2048H640.509V80.7952H461.627V26.2048Z" fill="currentColor" />
    <path d="M7.08191 80.0695L37.3396 22.4837M30.0772 80.0695L60.3349 22.4837" stroke="currentColor" strokeWidth="16" />
    <rect x="711.725" y="10" width="87" height="87" stroke="currentColor" strokeWidth="20" />
    <rect x="824.819" y="10" width="87" height="87" stroke="currentColor" strokeWidth="20" />
    <rect x="726.954" y="25.2293" width="56.5414" height="56.5414" fill="currentColor" />
  </svg>
);

export const SettingsZone: React.FC<SettingsZoneProps> = ({ title, children, className, classNames }) => {
  return (
    <div className={cn('flex flex-col gap-2 ml-4 mr-16', className)}>
      <div
        className={cn(
          'relative text-lg font-bold border-l-4 pl-2 border-[#ffee34] text-[#ffee34]',
          'before:absolute before:left-2 before:bottom-0 before:right-12 before:h-[1.5px] before:bg-[#ffffff7d]',
          classNames?.title
        )}
      >
        {title}
        <div className='absolute right-0 -bottom-px text-[#ffffff7d]'>
            <Deco />
        </div>
      </div>
      <div className={cn('space-y-2 mx-2', classNames?.content)}>{children}</div>
    </div>
  );
};
