export interface ZmdButtonProps {
  type?: 'primary' | 'default';
  text?: string;
  showIcon?: boolean;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  classNames?: {
    button?: string | ((isPrimary: boolean) => string);
    text?: string | ((isPrimary: boolean) => string);
    icon?: string | ((isPrimary: boolean) => string);
  };
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface ZmdIconButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  children: React.ReactElement;
}
