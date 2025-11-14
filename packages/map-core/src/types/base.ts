/** 键值类型 */
export type Keyable = string | number | symbol;
/** 值类型 */
export type Valuable = string | number | boolean | object | null | undefined;

/** 键值对象 */
export interface KeyValueObject<T extends Keyable = Keyable, K extends Valuable = Valuable> {
  key: K;
  value: T;
}
