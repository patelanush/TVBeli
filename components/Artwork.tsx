import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors } from '@/constants/theme';

type Props = {
  uri: string | null | undefined;
  title: string;
  accentColor: string;
  style?: StyleProp<ViewStyle>;
  blurRadius?: number;
  fallbackMark?: string;
};

export function Artwork({ uri, title, accentColor, style, blurRadius, fallbackMark = 'TV' }: Props) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const failed = !uri || failedUri === uri;

  return (
    <View style={[styles.container, { backgroundColor: accentColor }, style]}>
      {!failed ? (
        <Image
          source={uri!}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
          cachePolicy="memory-disk"
          blurRadius={blurRadius}
          accessibilityLabel={`${title} artwork`}
          onError={() => setFailedUri(uri)}
        />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.fallbackMark}>{fallbackMark}</Text>
          <Text numberOfLines={2} style={styles.fallbackTitle}>{title}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  fallback: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  fallbackMark: {
    color: colors.white,
    fontSize: 42,
    fontWeight: '900',
    opacity: 0.2,
    position: 'absolute',
    right: 10,
    top: 6,
  },
  fallbackTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
});
