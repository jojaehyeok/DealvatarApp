import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { StoreItem } from '../lib/api';
import { useTheme, Theme } from '../lib/theme';

function fmtWon(n?: number) {
  if (!n) return '가격 협의';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  return `${Math.round(n / 10_000).toLocaleString()}만원`;
}

function fmtTimeLeft(auctionEndAt: string | null) {
  if (!auctionEndAt) return null;
  const diff = new Date(auctionEndAt).getTime() - Date.now();
  if (diff <= 0) return '마감';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}시간 ${m}분 남음` : `${m}분 남음`;
}

export default function ListingCard({ item, onPress }: { item: StoreItem; onPress?: () => void }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const thumb = item.photos ? Object.values(item.photos).flat()[0] : undefined;
  const timeLeft = fmtTimeLeft(item.auctionEndAt);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.thumbBox}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.thumb} />
        ) : (
          <Text style={styles.thumbPlaceholder}>🚗</Text>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.titleKo}</Text>
        <Text style={styles.carNumber}>
          {item.carNumber}{item.mileage ? ` · ${item.mileage.toLocaleString()}km` : ''}
        </Text>
        <View style={styles.rowBottom}>
          <Text style={styles.price}>{fmtWon(item.priceKRW)}</Text>
          {timeLeft && <Text style={styles.timeLeft}>{timeLeft}</Text>}
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
  title: { color: theme.text, fontWeight: '800', fontSize: 14 },
  carNumber: { color: theme.textSub, fontSize: 12, marginTop: 2 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
  price: { color: theme.accentSoft, fontWeight: '800', fontSize: 14 },
  timeLeft: { color: theme.danger, fontSize: 11, fontWeight: '700' },
});
