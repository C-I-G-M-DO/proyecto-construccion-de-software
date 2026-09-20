import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  logoDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: '#E9B64D', right: 20, top: 20 },
  brandBadge: { backgroundColor: '#EBEBEB', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 24 },
  brandBadgeText: { color: '#737373', fontSize: 11, fontWeight: '600', textAlign: 'center', letterSpacing: 0.5 },
  phoneContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DEDEDE', borderRadius: 14, backgroundColor: '#FAFAFA' },
  countryCode: { paddingHorizontal: 14, color: '#222222', fontSize: 16, borderRightWidth: 1, borderRightColor: '#DEDEDE' },
  terminalCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
  terminalIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8F2F2', alignItems: 'center', justifyContent: 'center' },
  terminalTitle: { color: '#222222', fontSize: 12, fontWeight: '700' },
  terminalText: { color: '#737373', fontSize: 13 },
  screen: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },

  container: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    gap: 24,
  },

  brandRow: {
    alignItems: 'center',
    gap: 14,
  },

  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C00000',
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 56,
    lineHeight: 66,
    fontWeight: '400',
  },

  brandName: {
    color: '#222222',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  introduction: {
    alignItems: 'center',
    gap: 10,
  },

  title: {
    color: '#222222',
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },

  subtitle: {
    maxWidth: 380,
    textAlign: 'center',
    color: '#737373',
    fontSize: 16,
    lineHeight: 24,
  },

  formCard: {
    gap: 16,
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    boxShadow: '0 2px 3px rgba(0, 0, 0, 0.05)',
  },

  fieldGroup: {
    gap: 8,
  },

  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  label: {
    color: '#737373',
    fontSize: 14,
    fontWeight: '700',
  },

  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    color: '#222222',
    fontSize: 16,
  },

  passwordContainer: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DEDEDE',
    backgroundColor: '#FAFAFA',
  },

  passwordInput: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 16,
    color: '#222222',
    fontSize: 16,
  },

  inputError: {
    borderColor: '#C5413B',
  },

  errorText: {
    color: '#B53630',
    fontSize: 13,
    lineHeight: 18,
  },

  forgotText: {
    color: '#C00000',
    fontSize: 14,
    fontWeight: '500',
  },

  showPasswordText: {
    paddingHorizontal: 14,
    color: '#C00000',
    fontSize: 13,
    fontWeight: '700',
  },

  loginButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#C00000',
  },

  loginButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  helpText: {
    paddingHorizontal: 20,
    color: '#737373',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});