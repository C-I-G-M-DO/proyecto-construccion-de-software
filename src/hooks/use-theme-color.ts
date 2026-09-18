import { useColorScheme } from './use-color-scheme';

const themeColors = {
  light: {
    text: '#1C1C1C',
    background: '#FFFFFF',
    border: '#E0E0E0',
    card: '#F7F7F7',
    primary: '#C00000',
  },
  dark: {
    text: '#FFFFFF',
    background: '#121212',
    border: '#3A3A3A',
    card: '#1F1F1F',
    primary: '#C0392B',
  },
} as const;

type ThemeColorName = keyof typeof themeColors.light;

type ThemeColorProps = {
  light?: string;
  dark?: string;
};

export function useThemeColor(
  props: ThemeColorProps,
  colorName: ThemeColorName,
) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colorFromProps = props[theme];

  return colorFromProps ?? themeColors[theme][colorName];
}