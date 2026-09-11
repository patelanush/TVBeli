import { Tabs } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { colors } from '@/constants/theme';

const iconNames = {
  index: { ios: 'house.fill', android: 'home', web: 'home' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  myShows: { ios: 'rectangle.stack.fill', android: 'video_library', web: 'video_library' },
  profile: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
} as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const desktop = useWindowDimensions().width >= 900;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          height: desktop ? '100%' : 63 + insets.bottom,
          width: desktop ? 220 : undefined,
          paddingTop: desktop ? 28 : 7,
          paddingBottom: desktop ? 28 : Math.max(insets.bottom, 8),
          backgroundColor: '#0D0F13',
          borderTopColor: colors.border,
          borderTopWidth: desktop ? 0 : StyleSheet.hairlineWidth,
          borderRightColor: colors.border,
          borderRightWidth: desktop ? StyleSheet.hairlineWidth : 0,
        },
        tabBarPosition: desktop ? 'left' : 'bottom',
        tabBarItemStyle: desktop ? { maxHeight: 64 } : undefined,
        tabBarLabelStyle: { fontSize: desktop ? 13 : 10, fontWeight: '700' },
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
