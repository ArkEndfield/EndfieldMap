import { View, type ViewStyle } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { cn } from '@/utils/cn';

interface TabBarGlassProps {
  className?: string;
  style?: ViewStyle;
}

export function TabBarGlass({ className, style }: TabBarGlassProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className={cn('absolute inset-0', className, isDark ? 'bg-[rgba(25,25,25,0.92)]' : 'bg-[rgba(250,250,250,0.92)]')}
      style={style}
      pointerEvents="none"
    />
  );
}
