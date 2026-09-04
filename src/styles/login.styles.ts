import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F7F3',
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  container: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    gap: 32,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#176B3A',
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },

  brandName: {
    color: '#16231B',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  introduction: {
    gap: 10,
  },

  title: {
    color: '#16231B',
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },

  subtitle: {
    maxWidth: 380,
    color: '#5C685F',
    fontSize: 16,
    lineHeight: 24,
  },

  formCard: {
    gap: 22,
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8E3',
    boxShadow: '0 10px 30px rgba(30, 61, 42, 0.08)',
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
    color: '#26352B',
    fontSize: 14,
    fontWeight: '700',
  },

  input: {
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D6DED8',
    backgroundColor: '#FAFBFA',
    color: '#16231B',
    fontSize: 16,
  },

  passwordContainer: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D6DED8',
    backgroundColor: '#FAFBFA',
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    color: '#16231B',
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
    color: '#176B3A',
    fontSize: 13,
    fontWeight: '700',
  },

  showPasswordText: {
    paddingHorizontal: 14,
    color: '#176B3A',
    fontSize: 13,
    fontWeight: '700',
  },

  loginButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#176B3A',
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
    color: '#68736B',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});