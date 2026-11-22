import { colors } from '../../Theme'

/** For native <select> and date inputs, which Chakra style props can't reach. */
export const selectStyle: React.CSSProperties = {
  background: colors.pageBg,
  border: `1px solid ${colors.border}`,
  color: colors.textPrimary,
  borderRadius: 6,
  padding: '0 12px',
  minHeight: 40,
  fontSize: 16,
  maxWidth: '100%',
}
