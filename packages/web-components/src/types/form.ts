// region FormButton

export interface EndfieldFormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  left?: React.ReactNode;
  right?: React.ReactNode;
  variant?: 'primary' | 'default' | 'warning' | 'danger';
}

// endregion FormButton

// region Select

export interface EndfieldSelectItem<T extends string> {
  label: React.ReactNode;
  value: T;
  left?: React.ReactNode | ((active: boolean) => React.ReactNode);
  right?: React.ReactNode | ((active: boolean) => React.ReactNode);
  disabled?: boolean;
  hidden?: boolean;
  description?: React.ReactNode;
}

export interface EndfieldSelectProps<T extends string> {
  options: readonly EndfieldSelectItem<T>[];
  value: T;
  disabled?: boolean;
  className?: string;
  classNames?: {
    container?: string;
    trigger?: string;
    option?: string;
    optionContainer?: string;
    optionScrollArea?: string;
  };
  onChange: (value: T) => void;
}

export interface EndfieldSelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  expand?: boolean;
}

export interface EndfieldSelectOptionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  left?: React.ReactNode | ((active: boolean) => React.ReactNode);
  right?: React.ReactNode | ((active: boolean) => React.ReactNode);
  select?: boolean;
}

// endregion Select

// region Switch

export interface EndfieldSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  onText?: React.ReactNode;
  offText?: React.ReactNode;
}

// endregion Switch

// region Toggle

export interface EndfieldToggleOption<T extends React.Key> {
  key: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface EndfieldToggleProps<T extends React.Key> {
  options: readonly EndfieldToggleOption<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  disabled?: boolean;
  className?: string;
}

// endregion Toggle
