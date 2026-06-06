import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  h1: { fontSize: 28, fontWeight: '700', fontFamily: 'Nunito-Bold', lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700', fontFamily: 'Nunito-Bold', lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '700', fontFamily: 'Nunito-Bold', lineHeight: 26 },
  bodyLarge: { fontSize: 18, fontFamily: 'Nunito-Regular', lineHeight: 28 },
  body: { fontSize: 16, fontFamily: 'Nunito-Regular', lineHeight: 24 },
  bodySemiBold: { fontSize: 16, fontFamily: 'Nunito-SemiBold', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontFamily: 'Nunito-Regular', lineHeight: 20 },
  caption: { fontSize: 12, fontFamily: 'Nunito-Regular', lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '700', fontFamily: 'Nunito-Bold', lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '600', fontFamily: 'Nunito-SemiBold', lineHeight: 20 },
};
