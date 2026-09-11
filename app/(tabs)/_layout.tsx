import { Tabs } from 'expo-router';
import { Platform, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { colors } from '@/constants/theme';

const iconNames = {
  index: { ios: 'house.fill', android: 'home', web: 'home' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  myShows: { ios: 'rectangle.stack.fill', android: 'video_library', web: 'video_library' },
  profile: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
} as const;

const MOBILE_TAB_BAR_CONTENT_HEIGHT = 63;
const MOBILE_SCENE_BOTTOM_GUTTER = 28;
const MOBILE_SAFE_AREA_PADDING = 'max(12px, env(safe-area-inset-bottom))';

// React Native Web passes CSS functions through to the DOM, but ViewStyle only
// types percentage strings. Keep the CSS safe-area fallback scoped to web.
const mobileWebTabBarStyle = {
  height: `calc(${MOBILE_TAB_BAR_CONTENT_HEIGHT}px + ${MOBILE_SAFE_AREA_PADDING})`,
  paddingBottom: MOBILE_SAFE_AREA_PADDING,
} as unknown as ViewStyle;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const desktop = useWindowDimensions().width >= 900;
  const mobileTabBarStyle = Platform.OS === 'web'
    ? mobileWebTabBarStyle
    : {
        height: MOBILE_TAB_BAR_CONTENT_HEIGHT + Math.max(12, insets.bottom),
        paddingBottom: Math.max(12, insets.bottom),
      };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: [
          {
            height: desktop ? '100%' : undefined,
            width: desktop ? 220 : undefined,
            paddingTop: desktop ? 28 : 7,
            paddingBottom: desktop ? 28 : undefined,
            backgroundColor: '#0D0F13',
            borderTopColor: colors.border,
            borderTopWidth: desktop ? 0 : StyleSheet.hairlineWidth,
            borderRightColor: colors.border,
            borderRightWidth: desktop ? StyleSheet.hairlineWidth : 0,
          },
          !desktop && mobileTabBarStyle,
        ],
        tabBarPosition: desktop ? 'left' : 'bottom',
        tabBarItemStyle: desktop ? { maxHeight: 64 } : undefined,
        tabBarLabelStyle: { fontSize: desktop ? 13 : 10, fontWeight: '700' },
        sceneStyle: desktop ? undefined : styles.mobileScene,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <AppIcon name={iconNames.index} color={color} size={focused ? 24 : 22} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => <AppIcon name={iconNames.search} color={color} size={focused ? 24 : 22} />,
        }}
      />
      <Tabs.Screen
        name="rate"
        options={{
          title: 'Rate',
          tabBarLabelStyle: styles.rateLabel,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.rateIcon, desktop && styles.rateIconDesktop, focused && styles.rateIconFocused]}>
              <AppIcon
                name={{ ios: 'star.fill', android: 'star', web: 'star' }}
                color={colors.black}
                size={25}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="my-shows"
        options={{
          title: 'My Shows',
          tabBarIcon: ({ color, focused }) => <AppIcon name={iconNames.myShows} color={color} size={focused ? 24 : 22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <AppIcon name={iconNames.profile} color={color} size={focused ? 24 : 22} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Clears the portion of the floating Rate button that extends above the bar.
  mobileScene: { paddingBottom: MOBILE_SCENE_BOTTOM_GUTTER },
  rateIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginTop: -25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderWidth: 5,
    borderColor: colors.background,
    shadowColor: colors.accent,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  rateIconFocused: { backgroundColor: colors.white, transform: [{ scale: 1.04 }] },
  rateIconDesktop: { marginTop: 0, width: 42, height: 42, borderRadius: 15, borderWidth: 0 },
  rateLabel: { color: colors.text, fontSize: 10, fontWeight: '800' },
});
