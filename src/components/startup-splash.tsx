import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Platform, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { startupStyles as styles } from '@/styles/startup.styles';

const scene = require('../../assets/images/surtio-splash.png');

type Props = {
  ready: boolean;
  failed: boolean;
  onRetry: () => void;
  onFinish: () => void;
};

export function StartupSplash({ ready, failed, onRetry, onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(1)).current;
  const [imageReady, setImageReady] = useState(false);
  const handleImageLoad = useCallback(() => setImageReady(true), []);

  useEffect(() => {
    if (!ready || !imageReady || failed) return;
    const animation = Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: Platform.OS !== 'web' });
    animation.start(({ finished }) => { if (finished) onFinish(); });
    return () => animation.stop();
  }, [ready, imageReady, failed, opacity, onFinish]);

  return (
    <Animated.View style={[styles.screen, { opacity }]}>
      <StatusBar style="light" />
      <Image accessible={false} source={scene} resizeMode="cover" blurRadius={18} style={styles.backdrop} />
      <View pointerEvents="none" style={styles.shade} />
      <Image
        accessible={false}
        source={scene}
        resizeMode="contain"
        onLoadEnd={handleImageLoad}
        style={styles.image}
      />
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <View accessibilityLiveRegion="polite" style={styles.notice}>
          {failed ? <>
            <Text style={styles.text}>No se pudo recuperar la sesión guardada.</Text>
            <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </> : <>
            <ActivityIndicator accessibilityLabel="Iniciando Surtío" color="#FFFFFF" />
            <Text style={styles.text}>Preparando tu negocio…</Text>
          </>}
        </View>
      </View>
    </Animated.View>
  );
}
