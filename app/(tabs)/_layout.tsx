import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          height: 63 + insets.bottom,
          paddingTop: 7,
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: '#0D0F13',
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
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
            <View style={[styles.rateIcon, focused && styles.rateIconFocused]}>
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
  rateLabel: { color: colors.text, fontSize: 10, fontWeight: '800' },
});
