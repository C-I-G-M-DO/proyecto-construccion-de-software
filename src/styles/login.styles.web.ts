import { StyleSheet } from 'react-native';

export const colors = {
  brand: '#C00000',
  brandDark: '#9E0000',
  accent: '#D9A441',
  background: '#F7F7F7',
  surface: '#FFFFFF',
  text: '#1F1F1F',
  muted: '#6B6B6B',
  border: '#E0E0E0',
  inputBackground: '#FAFAFA',
  success: '#10B981',
  error: '#B42318',
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: colors.background,
  },

  header: {
    minHeight: 80,
    paddingHorizontal: 48,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  headerCompact: {
    paddingHorizontal: 24,
  },

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  logo: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.brand,
  },

  logoLetter: {
    color: colors.surface,
    fontSize: 27,
    fontWeight: '700',
    fontStyle: 'italic',
  },

  logoDot: {
    position: 'absolute',
    top: 13,
    right: 11,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },

  brandName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },

  portalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F1F1F1',
    borderWidth: 1,
    borderColor: colors.border,
  },

  portalText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  successDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.success,
  },

  headerText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  dividerVertical: {
    width: 1,
    height: 22,
    backgroundColor: colors.border,
  },

  mainScroll: {
    flex: 1,
  },

  mainContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingVertical: 56,
  },

  mainContentCompact: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  columns: {
    width: '100%',
    maxWidth: 1440,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 72,
  },

  columnsCompact: {
    justifyContent: 'center',
  },

  informationColumn: {
    flex: 1,
    maxWidth: 650,
    gap: 34,
  },

  secureBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#F5CCCC',
  },

  secureBadgeText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  heroGroup: {
    gap: 20,
  },

  heroTitle: {
    maxWidth: 650,
    color: colors.text,
    fontSize: 54,
    lineHeight: 62,
    fontWeight: '800',
    letterSpacing: -1.7,
  },

  heroHighlight: {
    color: colors.brand,
  },

  heroDescription: {
    maxWidth: 620,
    color: colors.muted,
    fontSize: 18,
    lineHeight: 30,
  },

  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  featureCard: {
    width: '48%',
    minHeight: 96,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)',
  },

  featureIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.background,
  },

  featureIconText: {
    color: colors.brand,
    fontSize: 18,
    fontWeight: '800',
  },

  featureTextContainer: {
    flex: 1,
    gap: 4,
  },

  featureTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },

  featureDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },

  countryNotice: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECD48D',
    backgroundColor: '#FFF9E8',
  },

  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },

  countryNoticeText: {
    flex: 1,
    color: '#8A5A1F',
    fontSize: 13,
    lineHeight: 19,
  },

  formColumn: {
    width: '100%',
    maxWidth: 510,
  },

  formCard: {
    padding: 40,
    gap: 28,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: '0 18px 40px rgba(0, 0, 0, 0.10)',
  },

  formCardCompact: {
    padding: 28,
  },

  formHeader: {
    gap: 9,
  },

  formTitle: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },

  formSubtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
  },

  form: {
    gap: 22,
  },

  fieldGroup: {
    gap: 8,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },

  forgotText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: '700',
  },

  phoneContainer: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'visible',
    zIndex: 10,
  },

  prefixContainer: {
    height: 52,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.background,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },

  prefixText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },

  areaSelector: {
    height: 52,
    minWidth: 74,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },

  areaSelectorText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  selectorArrow: {
    color: colors.muted,
    fontSize: 11,
  },

  areaMenu: {
    position: 'absolute',
    top: 58,
    left: 70,
    width: 90,
    padding: 6,
    gap: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
    zIndex: 100,
  },

  areaOption: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 7,
  },

  areaOptionSelected: {
    backgroundColor: '#FFF0F0',
  },

  areaOptionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  areaOptionTextSelected: {
    color: colors.brand,
  },

 phoneInput: {
  flex: 1,
  height: 52,
  paddingHorizontal: 14,
  color: colors.text,
  fontSize: 15,
  outlineStyle: 'solid',
  outlineWidth: 0,
},
  fieldHint: {
    color: colors.muted,
    fontSize: 11,
  },

  passwordContainer: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  passwordIcon: {
    paddingLeft: 15,
    color: colors.muted,
    fontSize: 16,
  },

 passwordInput: {
  flex: 1,
  height: 52,
  paddingHorizontal: 12,
  color: colors.text,
  fontSize: 15,
  outlineStyle: 'solid',
  outlineWidth: 0,
},

  visibilityButton: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  visibilityText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },

  inputFocused: {
    borderColor: colors.brand,
  },

  inputError: {
    borderColor: colors.error,
  },

  errorText: {
    color: colors.error,
    fontSize: 12,
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },

  checkboxLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  checkbox: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#888888',
    backgroundColor: colors.surface,
  },

  checkboxSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
  },

  checkmark: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '800',
  },

  rememberText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },

  authorizedText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },

  loginButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 13,
    backgroundColor: colors.brand,
    boxShadow: '0 6px 14px rgba(192, 0, 0, 0.18)',
  },

  loginButtonPressed: {
    backgroundColor: colors.brandDark,
    transform: [{ scale: 0.995 }],
  },

  loginButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '800',
  },

  buttonArrow: {
    color: colors.surface,
    fontSize: 22,
  },

  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  accessNotice: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },

  accessIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#FFE6E6',
  },

  accessIconText: {
    color: colors.brand,
    fontSize: 18,
    fontWeight: '800',
  },

  accessTextContainer: {
    flex: 1,
    gap: 3,
  },

  accessTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  accessDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },

  securityText: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
  },

  footer: {
    minHeight: 58,
    paddingHorizontal: 48,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  footerCompact: {
    paddingHorizontal: 24,
  },

  footerText: {
    color: colors.muted,
    fontSize: 11,
  },

  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },

  footerLink: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
});