export interface SubPopupComponentPropsWrapper<T> {
  prop: T;
}

export type SubPopupComponentProps<T> = React.FC<SubPopupComponentPropsWrapper<T>>;
