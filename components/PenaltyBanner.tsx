import { View, Text, StyleSheet } from 'react-native';
import { DealerPenalty } from '../lib/api';

export default function PenaltyBanner({ penalties }: { penalties: DealerPenalty[] }) {
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

const styles = StyleSheet.create({
  box: { backgroundColor: '#3a1414', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#5c2020' },
  title: { color: '#ff6b6b', fontWeight: '800', fontSize: 13 },
  desc: { color: '#e0a0a0', fontSize: 12, marginTop: 4 },
  until: { color: '#ff9b9b', fontSize: 11, marginTop: 6, fontWeight: '700' },
});
