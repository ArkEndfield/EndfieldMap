/**
 * 地图符号层字体栈。服务端 glyph URL 只认单字体路径，故仅用一种字体。
 * 区域名多为简体中文时用 SC_Regular 可减少缺字；若需繁体显示可改为 HarmonyOS_Sans_TC_Regular。
 */
export const MAP_SYMBOL_FONT_STACK = ['HarmonyOS_Sans_SC_Regular'] as const;
