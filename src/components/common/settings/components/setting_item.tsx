import { cn } from '@/utils/style';
import { Tooltip } from '../../endfield_components/tooltip';
import { QuestionIcon } from '../../icons';
import { useIsMobile } from '@/hooks/use_is_mobile';

export interface SettingItemProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  question?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  tailDeco?: boolean;
  classNames?: {
    left?: {
      container?: string;
      title?: {
        container?: string;
        content?: string;
        question?: {
          tooltip?: string;
          button?: string;
        };
      };
      description?: string;
    };
    content?: string;
  };
}

const Deco = ({ withTail }: { withTail?: boolean }) => (
  <div className="absolute h-full w-full flex z-0 left-0 top-0 opacity-30">
    <div
      className="h-full shrink-0 grow-0 w-12 rounded-l-sm bg-[linear-gradient(-45deg,#555_0,#555_12.5%,#5550_12.5%,#5550_37.5%,#555_37.5%,#555_62.5%,#5550_62.5%,#5550_87.5%,#555_87.5%,#555_100%)] bg-repeat bg-size-[0.2em_0.2em]"
      style={{
        maskImage: 'linear-gradient(to right, black, black 60%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, black 10%, black 60%, transparent)',
      }}
    ></div>
    <div
      className="h-full -ml-2 flex-1 bg-no-repeat bg-size-[auto_100%] bg-left bg-[url(/images/bg/deco_settings_bg_contour.png)]"
      style={{
        maskImage: 'linear-gradient(to bottom right, transparent, black 5em, black)',
        WebkitMaskImage: 'linear-gradient(to bottom right, transparent, black 5em, black)',
      }}
    ></div>
    {withTail && (
      <div
        className="h-full shrink-0 grow-0 w-64 rounded-l-sm bg-[linear-gradient(-45deg,#555_0,#555_12.5%,#5550_12.5%,#5550_37.5%,#555_37.5%,#555_62.5%,#5550_62.5%,#5550_87.5%,#555_87.5%,#555_100%)] bg-repeat bg-size-[0.2em_0.2em]"
        style={{
          maskImage: 'linear-gradient(to left, black, black 60%, transparent)',
          WebkitMaskImage: 'linear-gradient(to left, black 10%, black 60%, transparent)',
        }}
      ></div>
    )}
  </div>
);

export const SettingItem = ({
  title,
  description,
  question,
  children,
  className,
  classNames,
  tailDeco,
}: SettingItemProps) => {
  const isMobile = useIsMobile();
  return (
    <div
      className={cn('flex relative p-2 items-center border-[1.5px] rounded-sm bg-white/10 border-white/30', className)}
    >
      <Deco withTail={tailDeco} />
      <div className={cn('flex-1 p-1 relative z-1', classNames?.left?.container)}>
        <div className={cn('flex md:ml-4', classNames?.left?.title?.container)}>
          <div className={cn(classNames?.left?.title?.content)}>{title}</div>
          {question && (
            <Tooltip
              tooltip={question}
              asProps={{
                className: cn('text-sm', classNames?.left?.title?.question?.tooltip),
              }}
            >
              <button className={cn('text-sm', classNames?.left?.title?.question?.button)}>
                <QuestionIcon />
              </button>
            </Tooltip>
          )}
        </div>
        {description && (
          <div className={cn('text-xs md:ml-4 text-zinc-300', classNames?.left?.description)}>{description}</div>
        )}
      </div>
      <div
        className={cn(
          'flex shrink-0 grow-0 relative z-1 min-w-32 md:min-w-64',
          isMobile && 'text-sm',
          classNames?.content
        )}
      >
        {children}
      </div>
    </div>
  );
};
