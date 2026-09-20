import { useMemo } from 'react';
import { useColorScheme } from './use-color-scheme';

export function useSurtioTheme() {
  const dark = useColorScheme() === 'dark';
  return { dark, background: dark ? '#121212' : '#FCF9F8', card: dark ? '#202022' : '#FFFFFF', muted: dark ? '#2B2828' : '#F0EDED', text: dark ? '#F8F5F4' : '#1B1B1C', secondary: dark ? '#C9BDBA' : '#5D3F3B', border: dark ? '#403B3A' : '#E5E2E1', primary: dark ? '#FF7770' : '#C00000', button: '#C00000', tint: dark ? '#3B2222' : '#FFF0ED' };
}

/** Apply system colors to legacy styles without changing white labels on red buttons. */
export function useSurtioStyles<T extends Record<string, object>>(source: T): T {
  const theme = useSurtioTheme();
  return useMemo(() => {
    if (!theme.dark) return source;
    const adapt = (value: unknown, key = ''): unknown => {
      if (typeof value === 'string' && value.startsWith('#')) {
        const color = value.toUpperCase();
        if (key.toLowerCase().includes('border') && key.endsWith('Color')) return theme.border;
        if (key === 'backgroundColor') {
          if (['#FFFFFF', '#FFF'].includes(color)) return theme.card;
          if (['#FCF9F8','#F7F7F7','#FAFAFA','#FAFBFA','#F5F7F3'].includes(color)) return theme.background;
          if (['#EBEBEB','#F0EDED','#F8F2F2','#F0ECEB','#F6F3F2','#F4EFEE','#F8F5F4','#F1F1F1','#FFF5F5','#FFF9E8','#FFE9E5'].includes(color)) return theme.muted;
        }
        if (/^#[0-9A-F]{6}$/.test(color)) {
          const channels = [1,3,5].map(index => parseInt(color.slice(index,index+2),16));
          const neutral = Math.max(...channels) - Math.min(...channels) < 65;
          if (key === 'backgroundColor' && neutral && Math.min(...channels) > 190) return theme.muted;

        }
        if (key === 'color') {
          if (['#1B1B1C','#222222','#171211','#1C1C1C','#000000','#16231B','#1F1F1F'].includes(color)) return theme.text;
          if (['#737373','#796763','#5D3F3B','#887571','#634A46','#4B302C','#60433E','#806F6C','#6F302A','#6B6B6B','#8A5A1F'].includes(color)) return theme.secondary;
          if (['#C00000','#C90000','#A80000'].includes(color)) return theme.primary;
        }
      }
      if (Array.isArray(value)) return value.map(item => adapt(item));
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,adapt(v,k)]));
      return value;
    };
    return adapt(source) as T;
  }, [source, theme.dark]);
}

