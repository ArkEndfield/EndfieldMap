import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { TabBarGlass } from './tab-bar-glass';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const TAB_BAR_HEIGHT = 56;
const BUMP_HEIGHT = 16;
const BUMP_HALF_WIDTH = 46;
const ACTIVE_SCALE = 1.25;
const ACTIVE_TRANSLATE_Y = -10;
const BUMP_CP_RATIO = 0.55;
const BAR_RADIUS = 24;
const BAR_MARGIN_H = 16;
const BAR_MARGIN_BOTTOM = 8;

const TIMING_CONFIG = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

function buildBumpFill(
  numTabs: number,
  tabWidth: number,
  currIdx: number,
  prevIdx: number,
  t: number,
  barWidth: number,
): string {
  'worklet';
  const topY = BUMP_HEIGHT;
  let d = 'M 0 ' + topY;

  for (let i = 0; i < numTabs; i++) {
    const cx = tabWidth * i + tabWidth / 2;
    let h = 0;
    if (i === currIdx) h += BUMP_HEIGHT * t;
    if (i === prevIdx) h += BUMP_HEIGHT * (1 - t);

    const bL = cx - BUMP_HALF_WIDTH;
    const bR = cx + BUMP_HALF_WIDTH;

    d += ' L ' + bL + ' ' + topY;

    if (h >= 0.5) {
      const peakY = topY - h;
      const cpX = BUMP_HALF_WIDTH * BUMP_CP_RATIO;
      d +=
        ' C ' + (bL + cpX) + ' ' + topY + ' ' + (cx - cpX) + ' ' + peakY + ' ' + cx + ' ' + peakY +
        ' C ' + (cx + cpX) + ' ' + peakY + ' ' + (bR - cpX) + ' ' + topY + ' ' + bR + ' ' + topY;
    } else {
      d += ' L ' + bR + ' ' + topY;
    }
  }

  d += ' L ' + barWidth + ' ' + topY + ' Z';
  return d;
}

interface TabItemProps {
  label: string;
  renderIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
  isFocused: boolean;
  activeColor: string;
  inactiveColor: string;
  onPress: () => void;
  onLongPress: () => void;
}

function TabItem({ label, renderIcon, isFocused, activeColor, inactiveColor, onPress, onLongPress }: TabItemProps) {
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isFocused ? 1 : 0, TIMING_CONFIG);
  }, [isFocused, progress]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + (ACTIVE_SCALE - 1) * progress.value },
      { translateY: ACTIVE_TRANSLATE_Y * progress.value },
    ],
  }));

  const color = isFocused ? activeColor : inactiveColor;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.pressable}
    >
      <Animated.View style={iconAnimatedStyle}>{renderIcon?.({ focused: isFocused, color, size: 28 })}</Animated.View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function CurvedTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width: screenWidth } = useWindowDimensions();
  const barWidth = screenWidth - BAR_MARGIN_H * 2;
  const tabCount = state.routes.length;
  const tabWidth = barWidth / tabCount;
  const bottomPad = Math.max(insets.bottom, BAR_MARGIN_BOTTOM);

  const prevIndex = useSharedValue(state.index);
  const currIndex = useSharedValue(state.index);
  const bumpTransition = useSharedValue(1);
  const lastIndex = useRef(state.index);

  useEffect(() => {
    if (lastIndex.current !== state.index) {
      prevIndex.value = lastIndex.current;
      currIndex.value = state.index;
      bumpTransition.value = 0;
      bumpTransition.value = withTiming(1, TIMING_CONFIG);
      lastIndex.current = state.index;
    }
  }, [state.index, prevIndex, currIndex, bumpTransition]);

  const bumpPath = useDerivedValue(() =>
    buildBumpFill(tabCount, tabWidth, currIndex.value, prevIndex.value, bumpTransition.value, barWidth),
  );

  const bumpFillProps = useAnimatedProps(() => ({
    d: bumpPath.value,
  }));

  const bumpColor = isDark ? 'rgba(40,40,40,0.92)' : 'rgba(250,250,250,0.92)';
  const activeTint = isDark ? '#fff' : '#0a7ea4';
  const inactiveTint = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomPad }]}>
      <View style={styles.barOuter}>
        <Svg width={barWidth} height={BUMP_HEIGHT} style={styles.bumpSvg}>
          <AnimatedPath animatedProps={bumpFillProps} fill={bumpColor} />
        </Svg>

        <TabBarGlass className="overflow-hidden" style={{ borderRadius: BAR_RADIUS }} />

        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name);
            const isFocused = state.index === index;

            return (
              <TabItem
                key={route.key}
                label={label}
                renderIcon={options.tabBarIcon}
                isFocused={isFocused}
                activeColor={activeTint}
                inactiveColor={inactiveTint}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                }}
                onLongPress={() => {
                  navigation.emit({ type: 'tabLongPress', target: route.key });
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: BAR_MARGIN_H,
    pointerEvents: 'box-none',
  },
  barOuter: {
    height: TAB_BAR_HEIGHT,
    overflow: 'visible',
    borderRadius: BAR_RADIUS,
  },
  bumpSvg: {
    position: 'absolute',
    top: -BUMP_HEIGHT,
    left: 0,
  },
  tabRow: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
  },
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_BAR_HEIGHT,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
});
