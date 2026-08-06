import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MyBid } from '../lib/api';
import { useTheme, Theme } from '../lib/theme';

function fmtWon(n?: number) {
  if (!n) return '-';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  return `${Math.round(n / 10_000).toLocaleString()}만원`;
}

const STATUS_LABEL: Record<string, string> = {
  active: '입찰중',
  sold: '낙찰완료',
  hidden: '숨김',
  pending: '검토중',
  closed: '마감',
};

export default function BidCard({ bid, onPress }: { bid: MyBid; onPress?: () => void }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const item = bid.item;
  const thumb = item?.photos ? Object.values(item.photos).flat()[0] : undefined;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress} activeOpacity={0.8}>
      <View style={styles.thumbBox}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.thumb} />
        ) : (
          <Text style={styles.thumbPlaceholder}>🚗</Text>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.rowTop}>
          <Text style={styles.title} numberOfLines={1}>{item?.titleKo ?? '매물 정보 없음'}</Text>
          {bid.isWinning && <View style={styles.winningTag}><Text style={styles.winningTagText}>낙찰</Text></View>}
        </View>
        <Text style={styles.carNumber}>{item?.carNumber}</Text>
        <View style={styles.rowBottom}>
          <Text style={styles.amount}>내 입찰 {fmtWon(bid.amount)}</Text>
          <Text style={styles.status}>{item ? STATUS_LABEL[item.status] ?? item.status : '-'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: theme.card, borderRadius: 16, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: theme.cardBorder,
  },
  thumbBox: { width: 72, height: 72, borderRadius: 12, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: { fontSize: 28 },
  info: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: theme.text, fontWeight: '800', fontSize: 14, flexShrink: 1 },
  winningTag: { backgroundColor: theme.accent, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  winningTagText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  carNumber: { color: theme.textSub, fontSize: 12, marginTop: 2 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
  amount: { color: theme.accentSoft, fontWeight: '800', fontSize: 13 },
  status: { color: theme.textSub, fontSize: 11, fontWeight: '700' },
});
