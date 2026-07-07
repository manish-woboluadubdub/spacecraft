import { DarkTheme, DefaultTheme, ThemeProvider, usePathname, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();

  const isPlayScreen = pathname === '/play';

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {isPlayScreen ? <Slot /> : <AppTabs />}
    </ThemeProvider>
  );
}
