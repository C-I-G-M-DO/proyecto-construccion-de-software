import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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

import { styles } from '@/styles/login.styles';

type LoginErrors = {
  phone?: string;
  password?: string;
};

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
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});

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

  function handleLogin() {
    if (!validateForm()) {
      return;
    }

    // Acceso temporal mientras se desarrolla el backend.
    router.replace('/home');
  }

  function handleForgotPassword() {
    Alert.alert(
      'Recuperar contraseña',
      'Esta función estará disponible cuando se conecte el backend.',
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.container}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>S</Text>
            </View>

            <Text style={styles.brandName}>Surtío</Text>
          </View>

          <View style={styles.introduction}>
            <Text style={styles.title}>Bienvenido</Text>

            <Text style={styles.subtitle}>
              Inicia sesión para administrar tu negocio desde un solo lugar.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Número de teléfono</Text>

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

              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Contraseña</Text>

                <Pressable onPress={handleForgotPassword} hitSlop={8}>
                  <Text style={styles.forgotText}>¿La olvidaste?</Text>
                </Pressable>
              </View>

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
                  onPress={() =>
                    setShowPassword((current) => !current)
                  }
                  hitSlop={8}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </Pressable>
              </View>

              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.loginButton,
                pressed ? styles.loginButtonPressed : undefined,
              ]}
            >
              <Text style={styles.loginButtonText}>
                Iniciar sesión
              </Text>
            </Pressable>
          </View>

          <Text style={styles.helpText}>
            ¿Necesitas acceso? Contacta al administrador de tu negocio.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}