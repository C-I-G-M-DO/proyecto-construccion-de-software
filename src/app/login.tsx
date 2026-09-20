import { useSurtioTheme, useSurtioStyles } from '@/hooks/use-surtio-theme';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { styles as baseStyles } from '@/styles/login.styles';

type LoginErrors = {
  phone?: string;
  password?: string;
};

type LoginResponse = {
  message?: string;
  user?: { id?: string; name?: string; phone?: string; businessName?: string };
  token?: string;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

if (!API_URL) {
  throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env');
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function LoginScreen() {
  const theme = useSurtioTheme();
  const styles = useSurtioStyles(baseStyles);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState(false);

  function validateForm() {
    const newErrors: LoginErrors = {};
    const phoneDigits = phone.replace(/\D/g, '');

    if (phoneDigits.length !== 10) {
      newErrors.phone = 'Escribe un número de teléfono de 10 dígitos.';
    }

    if (password.length < 6) {
      newErrors.password =
        'La contraseña debe tener al menos 6 caracteres.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validateForm() || loading) {
      return;
    }

    setLoading(true);

    try {
      const phoneDigits = phone.replace(/\D/g, '');

      // La base de datos guarda el número con el código de país 1.
      // Ejemplo: 8091234567 se envía como 18091234567.
      const phoneForApi = `+1${phoneDigits}`;

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneForApi,
          password,
        }),
      });

      const data: LoginResponse = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        Alert.alert(
          'Error',
          data.message || 'No se pudo iniciar sesión.',
        );
        return;
      }

      const token = data.token;

      if (!token) {
        Alert.alert(
          'Error',
          'El servidor no devolvió un token de autenticación.',
        );
        return;
      }

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.removeItem('surtio.user');
      if (data.user) {
        const { id, name, phone, businessName } = data.user;
        await AsyncStorage.setItem('surtio.user', JSON.stringify({ id, name, phone, businessName }));
      }



      router.replace('/home');
    } catch (error) {
      console.error('Error de login:', error);

      Alert.alert(
        'Error de conexión',
        'No se pudo conectar con el servidor.',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword() {
    Alert.alert(
      'Recuperar contraseña',
      'Contacta al administrador de tu negocio para recuperar el acceso.',
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={theme.dark ? "light" : "dark"} />

      <ScrollView
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.container}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>S</Text>
              <View style={styles.logoDot} />
            </View>

            <Text style={styles.brandName}>Surtío</Text>
            <View style={styles.brandBadge}><Text style={styles.brandBadgeText}>PUNTO DE VENTA Y GESTIÓN</Text></View>
          </View>

          <View style={styles.introduction}>
            <Text style={styles.title}>Bienvenido</Text>

            <Text style={styles.subtitle}>
              Inicia sesión para administrar tu negocio desde un solo lugar.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>NÚMERO DE TELÉFONO</Text>
              <View style={[styles.phoneContainer, errors.phone ? styles.inputError : undefined]}>
                <Text style={styles.countryCode}>+1</Text>

              <TextInput
                value={phone}
                onChangeText={(value) => {
                  setPhone(formatPhone(value));
                  setErrors((current) => ({
                    ...current,
                    phone: undefined,
                  }));
                }}
                placeholder="(809) 000-0000"
                placeholderTextColor="#8B958E"
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                maxLength={14}
                style={[
                  styles.input,
                  errors.phone ? styles.inputError : undefined,
                ]}
              />

              </View>

              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>CONTRASEÑA</Text>

              <View
                style={[
                  styles.passwordContainer,
                  errors.password ? styles.inputError : undefined,
                ]}
              >
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setErrors((current) => ({
                      ...current,
                      password: undefined,
                    }));
                  }}
                  placeholder="Escribe tu contraseña"
                  placeholderTextColor="#8B958E"
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  style={styles.passwordInput}
                />

                <Pressable
                  onPress={() => {
                    setShowPassword((current) => !current);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Image source={showPassword ? 'sf:eye.slash' : 'sf:eye'} style={{ width: 22, height: 22 }} tintColor="#737373" />
                </Pressable>
              </View>

              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <Pressable onPress={handleForgotPassword} accessibilityRole="button" style={{ alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center' }}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: loading }}
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && !loading
                  ? styles.loginButtonPressed
                  : undefined,
              ]}
            >
              <Text style={styles.loginButtonText}>
                {loading
                  ? 'Iniciando sesión...'
                  : 'Iniciar sesión  →'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.terminalCard}>
            <View style={styles.terminalIcon}><Image source="sf:storefront" style={{ width: 26, height: 26 }} tintColor="#C00000" /></View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.terminalTitle}>PUNTO DE VENTA SURTÍO</Text>
              <Text style={styles.terminalText}>Tu negocio siempre listo</Text>
            </View>
          </View>

          <Text style={styles.helpText}>
            ¿Necesitas acceso? Contacta al administrador de tu negocio.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}