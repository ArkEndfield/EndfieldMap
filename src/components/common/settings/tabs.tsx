import { motion } from 'motion/react';

import { cn } from '@/utils/style';

const ActiveDeco = () => (
  <motion.div
    initial={{
      height: 0,
      opacity: 0,
    }}
    animate={{
      height: '100%',
      opacity: 1,
    }}
    exit={{
      height: 0,
      opacity: 0,
    }}
    transition={{
      duration: 0.1,
    }}
    className="absolute drop-shadow-md z-2 bg-[#ffee34] bg-[url(/images/bg/pag-button-texture.png)] bg-no-repeat bg-cover bg-bottom-right top-0 -left-px right-0 rounded-b-md before:absolute before:left-0 before:top-0 before:w-1.5 before:h-1.5 before:-translate-x-full before:bg-[radial-gradient(circle_at_bottom_left,transparent_6px,#FCF150_6px)] after:absolute after:right-0 after:top-0 after:w-1.5 after:h-1.5 after:translate-x-full after:bg-[radial-gradient(circle_at_bottom_right,transparent_6px,#FCF150_6px)]"
  />
);

const ActiveIcon = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{
      y: '-50%',
      opacity: 0,
      filter: 'blur(10px)',
    }}
    animate={{
      y: 0,
      opacity: 1,
      filter: 'blur(0)',
    }}
    exit={{
      y: '-50%',
      opacity: 0,
      filter: 'blur(10px)',
    }}
    transition={{
      duration: 0.1,
      delay: 0.05,
    }}
    className="absolute z-2 text-[#333] text-3xl"
  >
    {children}
  </motion.div>
);

const Icon = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{
      y: '50%',
    }}
    animate={{
      y: 0,
    }}
    exit={{
      y: '50%',
    }}
    transition={{
      duration: 0.1,
    }}
    className="relative z-1 text-white text-2xl "
  >
    {children}
  </motion.div>
);

const TabContainer = ({
  children,
  rightBorder,
  className,
  onClick,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
  rightBorder?: boolean;
  className?: string;
  onClick?: () => void;
}) => (
  <button
    className={cn(
      'relative px-4 z-1 flex items-center justify-center w-16 h-14 font-bold',
      rightBorder &&
        'after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-4 after:bg-white/25',
      className
    )}
    onClick={onClick}
  >
    {active && <ActiveDeco />}
    {active && <ActiveIcon>{children}</ActiveIcon>}
    {!active && <Icon>{children}</Icon>}
  </button>
);

const TabListDeco = () => (
  <div
    className="absolute z-0 w-full h-full top-0 bg-[linear-gradient(-45deg,#555_0,#555_12.5%,#5550_12.5%,#5550_37.5%,#555_37.5%,#555_62.5%,#5550_62.5%,#5550_87.5%,#555_87.5%,#555_100%)] bg-repeat bg-size-[0.2em_0.2em]"
    style={{
      maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
      WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
    }}
  ></div>
);

export interface TabItem<T extends string> {
  key: T;
  icon: React.ReactNode;
}

export interface TabListProps<T extends string> {
  menus: readonly TabItem<T>[];
  activeTab: T;
  setActiveTab: (tab: T) => void;
  className?: string;
}

export const TabList = <T extends string>({ menus, activeTab, setActiveTab, className }: TabListProps<T>) => {
  return (
    <div className={cn('flex h-14 relative justify-center items-center px-10', className)}>
      <TabListDeco />
      {menus.map((menu, index) => (
        <TabContainer
          key={index}
          rightBorder={index !== menus.length - 1}
          active={activeTab === menu.key}
          onClick={() => setActiveTab(menu.key)}
        >
          {menu.icon}
        </TabContainer>
      ))}
    </div>
  );
};
