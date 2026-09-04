import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from 'react-native';

import { colors, styles } from '@/styles/login.styles.web';

type AreaCode = '809' | '829' | '849';

type LoginErrors = {
  phone?: string;
  password?: string;
};

type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
};

const AREA_CODES: AreaCode[] = ['809', '829', '849'];

const FEATURES: FeatureCardProps[] = [
  {
    icon: '▣',
    title: 'Inventario y stock',
    description: 'Alertas de existencias y pedidos a distribuidores.',
  },
  {
    icon: '▤',
    title: 'Cuentas de fiao',
    description: 'Control de deudas de clientes con historial claro.',
  },
  {
    icon: '$',
    title: 'Cuadre de caja',
    description: 'Ventas del día en efectivo, transferencias y tarjetas.',
  },
  {
    icon: '✓',
    title: 'Multidispositivo',
    description: 'Información disponible desde distintos dispositivos.',
  },
];

function formatLocalPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 7);

  if (digits.length <= 3) {
    return digits;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

function BrandLogo() {
  return (
    <View style={styles.logo}>
      <Text style={styles.logoLetter}>S</Text>
      <View style={styles.logoDot} />
    </View>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>
        <Text style={styles.featureIconText}>{icon}</Text>
      </View>

      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

export default function LoginWebScreen() {
  const { width } = useWindowDimensions();

  const compact = width < 1050;
  const hideHeaderDetails = width < 760;

  const [areaCode, setAreaCode] = useState<AreaCode>('809');
  const [showAreaCodes, setShowAreaCodes] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});

  function validateForm() {
    const newErrors: LoginErrors = {};
    const localDigits = phone.replace(/\D/g, '');

    if (localDigits.length !== 7) {
      newErrors.phone = 'Escribe los últimos 7 dígitos.';
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

    const localDigits = phone.replace(/\D/g, '');

    const loginData = {
      phone: `+1${areaCode}${localDigits}`,
      password,
      rememberSession,
    };

    console.log('Datos preparados para el backend:', loginData);

    setSubmitting(true);

    // Acceso temporal mientras se desarrolla POST /api/auth/login.
    setTimeout(() => {
      router.replace('/home');
    }, 600);
  }

  function handleForgotPassword() {
    Alert.alert(
      'Recuperar contraseña',
      'La recuperación estará disponible cuando se conecte el backend.',
    );
  }

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.header,
          hideHeaderDetails ? styles.headerCompact : undefined,
        ]}
      >
        <View style={styles.brandContainer}>
          <BrandLogo />

          <Text style={styles.brandName}>Surtío</Text>

          {!hideHeaderDetails && (
            <View style={styles.portalBadge}>
              <Text style={styles.portalText}>
                Portal web negocios
              </Text>
            </View>
          )}
        </View>

        {!hideHeaderDetails && (
          <View style={styles.headerActions}>
            <View style={styles.statusContainer}>
              <View style={styles.successDot} />
              <Text style={styles.headerText}>Portal disponible</Text>
            </View>

            <View style={styles.dividerVertical} />

            <Pressable
              onPress={() =>
                Alert.alert(
                  'Soporte técnico',
                  'El canal de soporte será configurado próximamente.',
                )
              }
            >
              <Text style={styles.headerText}>Soporte técnico</Text>
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.mainContent,
          compact ? styles.mainContentCompact : undefined,
        ]}
      >
        <View
          style={[
            styles.columns,
            compact ? styles.columnsCompact : undefined,
          ]}
        >
          {!compact && (
            <View style={styles.informationColumn}>
              <View style={styles.heroGroup}>
                <View style={styles.secureBadge}>
                  <Text style={styles.secureBadgeText}>
                    Acceso para comercios dominicanos
                  </Text>
                </View>

                <Text style={styles.heroTitle}>
                  Control total de tu negocio,{' '}
                  <Text style={styles.heroHighlight}>
                    en tiempo real.
                  </Text>
                </Text>

                <Text style={styles.heroDescription}>
                  Inicia sesión desde cualquier computadora o
                  tableta para administrar inventario, registrar
                  ventas de mostrador y llevar al día tus cuentas
                  de fiao.
                </Text>
              </View>

              <View style={styles.featuresGrid}>
                {FEATURES.map((feature) => (
                  <FeatureCard
                    key={feature.title}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                  />
                ))}
              </View>

              <View style={styles.countryNotice}>
                <View style={styles.accentDot} />

                <Text style={styles.countryNoticeText}>
                  Plataforma diseñada para colmados, minimarkets
                  y pequeños negocios de República Dominicana.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.formColumn}>
            <View
              style={[
                styles.formCard,
                compact ? styles.formCardCompact : undefined,
              ]}
            >
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  Iniciar sesión
                </Text>

                <Text style={styles.formSubtitle}>
                  Ingresa tus credenciales comerciales para
                  acceder al panel.
                </Text>
              </View>

              <View style={styles.form}>
                <View style={[styles.fieldGroup, { zIndex: 20 }]}>
                  <Text style={styles.label}>
                    Número de teléfono
                  </Text>

                  <View
                    style={[
                      styles.phoneContainer,
                      phoneFocused
                        ? styles.inputFocused
                        : undefined,
                      errors.phone
                        ? styles.inputError
                        : undefined,
                    ]}
                  >
                    <View style={styles.prefixContainer}>
                      <Text style={styles.prefixText}>DO</Text>
                      <Text style={styles.prefixText}>+1</Text>
                    </View>

                    <Pressable
                      style={styles.areaSelector}
                      onPress={() =>
                        setShowAreaCodes((current) => !current)
                      }
                    >
                      <Text style={styles.areaSelectorText}>
                        ({areaCode})
                      </Text>

                      <Text style={styles.selectorArrow}>▼</Text>
                    </Pressable>

                    <TextInput
                      value={phone}
                      onChangeText={(value) => {
                        setPhone(formatLocalPhone(value));
                        setErrors((current) => ({
                          ...current,
                          phone: undefined,
                        }));
                      }}
                      onFocus={() => {
                        setPhoneFocused(true);
                        setShowAreaCodes(false);
                      }}
                      onBlur={() => setPhoneFocused(false)}
                      placeholder="000-0000"
                      placeholderTextColor="#9E9E9E"
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      maxLength={8}
                      style={styles.phoneInput}
                    />

                    {showAreaCodes && (
                      <View style={styles.areaMenu}>
                        {AREA_CODES.map((code) => {
                          const selected = code === areaCode;

                          return (
                            <Pressable
                              key={code}
                              style={[
                                styles.areaOption,
                                selected
                                  ? styles.areaOptionSelected
                                  : undefined,
                              ]}
                              onPress={() => {
                                setAreaCode(code);
                                setShowAreaCodes(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.areaOptionText,
                                  selected
                                    ? styles.areaOptionTextSelected
                                    : undefined,
                                ]}
                              >
                                {code}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  <Text style={styles.fieldHint}>
                    Códigos disponibles: 809, 829 y 849.
                  </Text>

                  {errors.phone && (
                    <Text style={styles.errorText}>
                      {errors.phone}
                    </Text>
                  )}
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Contraseña</Text>

                    <Pressable onPress={handleForgotPassword}>
                      <Text style={styles.forgotText}>
                        ¿Olvidaste tu contraseña?
                      </Text>
                    </Pressable>
                  </View>

                  <View
                    style={[
                      styles.passwordContainer,
                      passwordFocused
                        ? styles.inputFocused
                        : undefined,
                      errors.password
                        ? styles.inputError
                        : undefined,
                    ]}
                  >
                    <Text style={styles.passwordIcon}>▣</Text>

                    <TextInput
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        setErrors((current) => ({
                          ...current,
                          password: undefined,
                        }));
                      }}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      onSubmitEditing={handleLogin}
                      placeholder="Escribe tu contraseña"
                      placeholderTextColor="#9E9E9E"
                      secureTextEntry={!showPassword}
                      autoComplete="current-password"
                      returnKeyType="done"
                      style={styles.passwordInput}
                    />

                    <Pressable
                      style={styles.visibilityButton}
                      onPress={() =>
                        setShowPassword((current) => !current)
                      }
                    >
                      <Text style={styles.visibilityText}>
                        {showPassword ? 'Ocultar' : 'Mostrar'}
                      </Text>
                    </Pressable>
                  </View>

                  {errors.password && (
                    <Text style={styles.errorText}>
                      {errors.password}
                    </Text>
                  )}
                </View>

                <View style={styles.rememberRow}>
                  <Pressable
                    style={styles.checkboxLabel}
                    onPress={() =>
                      setRememberSession((current) => !current)
                    }
                  >
                    <View
                      style={[
                        styles.checkbox,
                        rememberSession
                          ? styles.checkboxSelected
                          : undefined,
                      ]}
                    >
                      {rememberSession && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>

                    <Text style={styles.rememberText}>
                      Recordar este navegador
                    </Text>
                  </Pressable>

                  <Text style={styles.authorizedText}>
                    Solo personal autorizado
                  </Text>
                </View>

                <Pressable
                  disabled={submitting}
                  onPress={handleLogin}
                  style={({ pressed }) => [
                    styles.loginButton,
                    pressed
                      ? styles.loginButtonPressed
                      : undefined,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>
                        Iniciar sesión
                      </Text>
                      <Text style={styles.buttonArrow}>→</Text>
                    </>
                  )}
                </Pressable>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.accessNotice}>
                <View style={styles.accessIcon}>
                  <Text style={styles.accessIconText}>▥</Text>
                </View>

                <View style={styles.accessTextContainer}>
                  <Text style={styles.accessTitle}>
                    Acceso gestionado
                  </Text>

                  <Text style={styles.accessDescription}>
                    ¿Necesitas credenciales? Contacta al
                    administrador de tu comercio.
                  </Text>
                </View>
              </View>

              <Text style={styles.securityText}>
                Inicio de sesión para personal autorizado · Surtío RD
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          hideHeaderDetails ? styles.footerCompact : undefined,
        ]}
      >
        <Text style={styles.footerText}>
          © {new Date().getFullYear()} Surtío Negocios ·
          República Dominicana
        </Text>

        {!hideHeaderDetails && (
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>Términos</Text>
            <Text style={styles.footerLink}>Privacidad</Text>
            <Text style={styles.footerLink}>Centro de ayuda</Text>
          </View>
        )}
      </View>
    </View>
  );
}