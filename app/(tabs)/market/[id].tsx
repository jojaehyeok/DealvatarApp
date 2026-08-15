import { useCallback, useState } from 'react';
import {
  View, Text, Image, FlatList, StyleSheet, ActivityIndicator,
  TextInput, TouchableOpacity, Alert, ScrollView, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { fetchStoreItem, fetchItemBids, submitBid, loadUser, StoreItem, ItemBid, DealerUser } from '../../../lib/api';
import { useTheme, Theme } from '../../../lib/theme';
import { isUrgent } from '../../../lib/auctionTiming';
import CountdownTimer from '../../../components/CountdownTimer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function fmtWon(n?: number) {
  if (!n) return '가격 협의';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  return `${Math.round(n / 10_000).toLocaleString()}만원`;
}

export default function ItemDetailScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<StoreItem | null>(null);
  const [bidCount, setBidCount] = useState(0);
  const [myBids, setMyBids] = useState<ItemBid[]>([]);
  const [user, setUser] = useState<DealerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const u = await loadUser();
      const [itemData, bidData] = await Promise.all([
        fetchStoreItem(Number(id)),
        fetchItemBids(Number(id), u?.id),
      ]);
      setItem(itemData);
      setBidCount(bidData.count);
      setMyBids(bidData.myBids);
      setUser(u);
    } catch {
      // 조용히 실패 — 데모 단계
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSubmitBid = async () => {
    if (!user || !item) return;
    const value = Number(amount.replace(/[^0-9]/g, ''));
    if (!value || value <= 0) {
      Alert.alert('입찰가를 입력해주세요');
      return;
    }
    setSubmitting(true);
    try {
      await submitBid(item.id, user.id, user.name, value);
      Alert.alert('입찰 완료', `${fmtWon(value)}에 입찰했습니다.`);
      setAmount('');
      load();
    } catch (e: any) {
      Alert.alert('입찰 실패', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !item) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const photos = item.photos ? Object.values(item.photos).flat().filter(Boolean) : [];
  const specRows = [
    { label: '연식', value: item.year ? `${item.year}년` : '-' },
    { label: '주행거리', value: item.mileage ? `${item.mileage.toLocaleString()}km` : '-' },
    { label: '연료', value: item.fuel || '-' },
    { label: '변속기', value: item.transmission || '-' },
    { label: '색상', value: item.colorKo || '-' },
    { label: '사고유무', value: item.accident ? '사고 있음' : '무사고' },
  ];
  const urgent = !!item.auctionEndAt && isUrgent(item.auctionEndAt);
  const closed = item.status !== 'active';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* 사진 갤러리 */}
        <View>
          {photos.length > 0 ? (
            <FlatList
              data={photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(url, i) => `${url}-${i}`}
              onMomentumScrollEnd={(e) => setActivePhoto(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
              renderItem={({ item: url }) => (
                <Image source={{ uri: url }} style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.75 }} resizeMode="cover" />
              )}
            />
          ) : (
            <View style={[styles.noPhoto, { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.75 }]}>
              <Text style={{ fontSize: 40 }}>🚗</Text>
            </View>
          )}
          {photos.length > 1 && (
            <Text style={styles.photoCount}>{activePhoto + 1} / {photos.length}</Text>
          )}
        </View>

        <View style={styles.body}>
          {urgent && !closed && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>🔥 마감임박</Text>
            </View>
          )}
          <Text style={styles.title}>{item.titleKo}</Text>
          <Text style={styles.carNumber}>{item.carNumber}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{fmtWon(item.priceKRW)}</Text>
            {closed ? (
              <Text style={[styles.timeLeft, { color: theme.textFaint }]}>경매 마감</Text>
            ) : (
              <CountdownTimer endAt={item.auctionEndAt} style={[styles.timeLeft, urgent && styles.timeLeftUrgent]} />
            )}
          </View>

          {/* 스펙 */}
          <View style={styles.specBox}>
            {specRows.map((s) => (
              <View key={s.label} style={styles.specRow}>
                <Text style={styles.specLabel}>{s.label}</Text>
                <Text style={styles.specValue}>{s.value}</Text>
              </View>
            ))}
          </View>

          {/* 입찰 내역 */}
          <Text style={styles.sectionTitle}>입찰 현황</Text>
          <View style={styles.bidsBox}>
            {bidCount === 0 ? (
              <Text style={styles.empty}>아직 입찰이 없습니다.</Text>
            ) : (
              <Text style={styles.bidSummary}>🔨 총 {bidCount}명 입찰 중 (다른 딜러의 입찰가는 공개되지 않습니다)</Text>
            )}
            {myBids.length > 0 && (
              <View style={styles.myBidsBlock}>
                {myBids.map((b) => (
                  <View key={b.id} style={styles.bidRow}>
                    <Text style={styles.bidDealer}>내 입찰</Text>
                    <Text style={styles.bidAmount}>{fmtWon(b.amount)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 입찰 폼 */}
          {!closed && (
            <View style={styles.bidForm}>
              <TextInput
                style={styles.input}
                placeholder="입찰가 입력 (원)"
                placeholderTextColor={theme.textFaint}
                keyboardType="number-pad"
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
              />
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.5 }]}
                onPress={handleSubmitBid}
                disabled={submitting}
              >
                <Text style={styles.submitBtnText}>{submitting ? '입찰 중…' : '입찰하기'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' },
  noPhoto: { backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center' },
  photoCount: {
    position: 'absolute', bottom: 10, right: 12, color: '#fff', fontSize: 11, fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  body: { padding: 16 },
  urgentBadge: { alignSelf: 'flex-start', backgroundColor: theme.danger, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  urgentBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  title: { color: theme.text, fontWeight: '800', fontSize: 18 },
  carNumber: { color: theme.textSub, fontSize: 13, marginTop: 2 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.divider },
  price: { color: theme.accentSoft, fontWeight: '800', fontSize: 22 },
  timeLeft: { color: theme.danger, fontSize: 12, fontWeight: '700' },
  timeLeftUrgent: { fontSize: 13, fontWeight: '900' },
  specBox: { marginTop: 16 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.divider },
  specLabel: { color: theme.textSub, fontSize: 13 },
  specValue: { color: theme.text, fontSize: 13, fontWeight: '700' },
  sectionTitle: { color: theme.text, fontWeight: '800', fontSize: 14, marginTop: 24, marginBottom: 8 },
  bidsBox: { backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.cardBorder, padding: 12 },
  empty: { color: theme.textFaint, fontSize: 12, textAlign: 'center', paddingVertical: 8 },
  bidSummary: { color: theme.textSub, fontSize: 12, fontWeight: '600' },
  myBidsBlock: { marginTop: 8, borderTopWidth: 1, borderTopColor: theme.divider, paddingTop: 8 },
  bidRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  bidDealer: { color: theme.textSub, fontSize: 13 },
  bidAmount: { color: theme.text, fontSize: 13, fontWeight: '700' },
  bidForm: { flexDirection: 'row', gap: 8, marginTop: 20 },
  input: {
    flex: 1, backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: theme.text, fontSize: 14, borderWidth: 1, borderColor: theme.cardBorder,
  },
  submitBtn: { backgroundColor: theme.accent, borderRadius: 12, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
