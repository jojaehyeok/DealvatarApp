import { View, Text, StyleSheet } from 'react-native';
import { DealerPenalty } from '../lib/api';
import { useTheme, Theme } from '../lib/theme';

export default function PenaltyBanner({ penalties }: { penalties: DealerPenalty[] }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  if (!penalties.length) return null;
  const p = penalties[0];
  return (
    <View style={styles.box}>
      <Text style={styles.title}>⛔ 입찰이 제한되었습니다</Text>
      <Text style={styles.desc}>{p.note ?? '운영 정책 위반'}</Text>
      <Text style={styles.until}>{new Date(p.expiresAt).toLocaleDateString('ko-KR')}까지 입찰 불가</Text>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  box: { backgroundColor: theme.dangerBg, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.dangerBorder },
  title: { color: theme.danger, fontWeight: '800', fontSize: 13 },
  desc: { color: theme.textSub, fontSize: 12, marginTop: 4 },
  until: { color: theme.danger, fontSize: 11, marginTop: 6, fontWeight: '700' },
});
