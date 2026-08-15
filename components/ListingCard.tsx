import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { StoreItem } from '../lib/api';
import { useTheme, Theme } from '../lib/theme';
import { brandLogoUrl } from '../lib/carBrand';
import { isUrgent } from '../lib/auctionTiming';
import CountdownTimer from './CountdownTimer';

function fmtWon(n?: number) {
  if (!n) return '가격 협의';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  return `${Math.round(n / 10_000).toLocaleString()}만원`;
}

export default function ListingCard({ item, onPress }: { item: StoreItem; onPress?: () => void }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const thumb = item.photos ? Object.values(item.photos).flat()[0] : undefined;
  const urgent = isUrgent(item.auctionEndAt);
  const logo = brandLogoUrl(item.titleKo);

  return (
    <TouchableOpacity
      style={[styles.card, urgent && styles.cardUrgent]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.thumbBox}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.thumb} />
        ) : (
          <Text style={styles.thumbPlaceholder}>🚗</Text>
        )}
        {urgent && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentBadgeText}>🔥 마감임박</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          {logo && <Image source={{ uri: logo }} style={styles.brandLogo} resizeMode="contain" />}
          <Text style={styles.title} numberOfLines={1}>{item.titleKo}</Text>
        </View>
        <Text style={styles.carNumber}>
          {item.carNumber}
          {item.year ? ` · ${item.year}년식` : ''}
          {item.mileage ? ` · ${item.mileage.toLocaleString()}km` : ''}
        </Text>
        <View style={styles.rowBottom}>
          <Text style={styles.price}>{fmtWon(item.priceKRW)}</Text>
          <CountdownTimer endAt={item.auctionEndAt} style={urgent ? styles.timeLeftUrgent : styles.timeLeft} />
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
  cardUrgent: { borderColor: theme.dangerBorder, backgroundColor: theme.dangerBg },
  thumbBox: { width: 72, height: 72, borderRadius: 12, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: { fontSize: 28 },
  urgentBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.danger, paddingVertical: 2 },
  urgentBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800', textAlign: 'center' },
  info: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  brandLogo: { width: 24, height: 14 },
  title: { color: theme.text, fontWeight: '800', fontSize: 14, flexShrink: 1 },
  carNumber: { color: theme.textSub, fontSize: 12, marginTop: 2 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
  price: { color: theme.accentSoft, fontWeight: '800', fontSize: 14 },
  timeLeft: { color: theme.danger, fontSize: 11, fontWeight: '700' },
  timeLeftUrgent: { color: theme.danger, fontSize: 11, fontWeight: '900' },
});
