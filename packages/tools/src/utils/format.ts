/**
 * 给数字补充位数，当数字位数不够的时候补充字符（够了就原样返回字符串）
 * @param val 要补的数字
 * @param padLength 最小长度
 * @param place 补充字符
 * @returns 补充后的字符串
 */
export const numberPadString = (val: number, padLength: number, place: number | string = 0): string => {
  const str = String(val);
  const padChar = String(place);
  return str.length >= padLength ? str : padChar.repeat(padLength - str.length) + str;
}