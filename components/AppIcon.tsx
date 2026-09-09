import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { ColorValue, StyleProp, ViewStyle } from 'react-native';

type Props = {
  name: SymbolViewProps['name'];
  color: ColorValue;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function AppIcon({ name, color, size = 22, style }: Props) {
  return <SymbolView name={name} tintColor={color} size={size} style={style} />;
}
