import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, type ComponentProps } from 'react';
import { Platform, View } from 'react-native';

/** Icon fonts can be collected during static rendering in a different order than in the browser. */
export default function BusinessIcon(props: ComponentProps<typeof Ionicons>) {
  const [ready, setReady] = useState(Platform.OS !== 'web');
  useEffect(() => setReady(true), []);
  if (!ready) return <View accessible={false} style={{ width: props.size ?? 20, height: props.size ?? 20 }} />;
  return <Ionicons accessible={false} {...props} />;
}
