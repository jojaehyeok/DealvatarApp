import { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, ScrollView, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  fetchActiveListings, fetchMyBids, fetchPenaltyStatus, loadUser, confirmWinner, scheduleVisit, requestPriceAdjustment,
  StoreItem, MyBid, DealerUser, DealerPenalty,
} from '../../../lib/api';
import ListingCard from '../../../components/ListingCard';
import BidCard from '../../../components/BidCard';
import PenaltyBanner from '../../../components/PenaltyBanner';
import VisitScheduleModal from '../../../components/VisitScheduleModal';
import PriceAdjustmentModal from '../../../components/PriceAdjustmentModal';
import { useTheme, Theme } from '../../../lib/theme';
import { brandLabel } from '../../../lib/carBrand';
import { isUrgent, msLeft } from '../../../lib/auctionTiming';

type Category = 'all' | 'bidding' | 'urgent' | 'won';

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'bidding', label: '입찰중' },
  { key: 'urgent', label: '🔥 마감임박' },
  { key: 'won', label: '🏆 낙찰물건' },
];

export default function MarketScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [user, setUser] = useState<DealerUser | null>(null);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [myBids, setMyBids] = useState<MyBid[]>([]);
  const [penalties, setPenalties] = useState<DealerPenalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<Category>('all');
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [visitTarget, setVisitTarget] = useState<MyBid | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<MyBid | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const u = await loadUser();
      setUser(u);
      const [listings, bids, penaltyData] = await Promise.all([
        fetchActiveListings(),
        u ? fetchMyBids(u.id) : Promise.resolve([]),
        u ? fetchPenaltyStatus(u.id) : Promise.resolve({ penalized: false, penalties: [] }),
      ]);
      setItems(listings);
      setMyBids(bids);
      setPenalties(penaltyData.penalties);
    } catch {
      // 조용히 실패 — 데모 단계
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const urgentCount = useMemo(() => items.filter((i) => isUrgent(i.auctionEndAt)).length, [items]);
  const biddingBids = useMemo(() => myBids.filter((b) => !b.isWinning), [myBids]);
  const wonBids = useMemo(() => myBids.filter((b) => b.isWinning), [myBids]);

  const years = useMemo(() => {
    const set = new Set<number>();
    items.forEach((i) => { if (i.year) set.add(i.year); });
    return Array.from(set).sort((a, b) => b - a);
  }, [items]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => { const b = brandLabel(i.titleKo); if (b) set.add(b); });
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = category === 'urgent' ? items.filter((i) => isUrgent(i.auctionEndAt)) : items;
    if (yearFilter != null) result = result.filter((i) => i.year === yearFilter);
    if (brandFilter) result = result.filter((i) => brandLabel(i.titleKo) === brandFilter);
    if (category === 'urgent') {
      result = [...result].sort((a, b) => (msLeft(a.auctionEndAt) ?? Infinity) - (msLeft(b.auctionEndAt) ?? Infinity));
    }
    return result;
  }, [items, category, yearFilter, brandFilter]);

  const activeFilterCount = (yearFilter != null ? 1 : 0) + (brandFilter ? 1 : 0);

  const handleConfirm = async (bid: MyBid) => {
    if (!user) return;
    try {
      await confirmWinner(bid.storeItemId, user.id);
      Alert.alert('확인 완료', '책임질 수 있는 견적으로 확인되었습니다.');
      load();
    } catch (e: any) {
      Alert.alert('오류', e.message);
    }
  };

  const handleConfirmVisit = async (isoDateTime: string) => {
    if (!user || !visitTarget) return;
    setSubmitting(true);
    try {
      await scheduleVisit(visitTarget.storeItemId, user.id, isoDateTime);
      setVisitTarget(null);
      load();
    } catch (e: any) {
      Alert.alert('오류', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmAdjustment = async (amount: number, reason: string) => {
    if (!user || !adjustTarget) return;
    setSubmitting(true);
    try {
      await requestPriceAdjustment(adjustTarget.storeItemId, user.id, amount, reason);
      setAdjustTarget(null);
      Alert.alert('신청 완료', '감가 신청이 접수되었습니다. 판매자 확인 후 반영됩니다.');
      load();
    } catch (e: any) {
      Alert.alert('오류', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const showDetailFilter = category === 'all' || category === 'urgent';

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>경매장</Text>
        <TouchableOpacity style={styles.filterIconBtn} onPress={() => setFilterModalOpen(true)}>
          <Text style={styles.filterIcon}>⚙️</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFilterCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
        {CATEGORIES.map((c) => {
          const count = c.key === 'bidding' ? biddingBids.length : c.key === 'urgent' ? urgentCount : c.key === 'won' ? wonBids.length : items.length;
          const active = category === c.key;
          return (
            <TouchableOpacity
              key={c.key}
              style={[styles.chip, active && (c.key === 'urgent' ? styles.chipUrgentActive : styles.chipActive)]}
              onPress={() => setCategory(c.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label} {count}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {category === 'bidding' && (
        <FlatList
          data={biddingBids}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />}
          ListHeaderComponent={<PenaltyBanner penalties={penalties} />}
          ListEmptyComponent={<Text style={styles.empty}>아직 입찰한 물건이 없습니다.</Text>}
          renderItem={({ item: bid }) => (
            <View>
              <BidCard bid={bid} onScheduleVisit={() => setVisitTarget(bid)} onRequestAdjustment={() => setAdjustTarget(bid)} />
              {bid.isWinning && !bid.item?.visitScheduledAt && (
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmText} onPress={() => handleConfirm(bid)}>✅ 네, 책임질 수 있는 견적입니다 (누르면 확인)</Text>
                </View>
              )}
            </View>
          )}
        />
      )}

      {category === 'won' && (
        <FlatList
          data={wonBids}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>아직 낙찰한 물건이 없습니다.</Text>}
          renderItem={({ item: bid }) => (
            <BidCard bid={bid} onScheduleVisit={() => setVisitTarget(bid)} onRequestAdjustment={() => setAdjustTarget(bid)} />
          )}
        />
      )}

      {(category === 'all' || category === 'urgent') && (
        <FlatList
          data={filteredItems}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>조건에 맞는 경매 매물이 없습니다.</Text>}
          renderItem={({ item }) => (
            <ListingCard item={item} onPress={() => router.push(`/(tabs)/market/${item.id}`)} />
          )}
        />
      )}

      <VisitScheduleModal visible={!!visitTarget} submitting={submitting} onClose={() => setVisitTarget(null)} onConfirm={handleConfirmVisit} />
      <PriceAdjustmentModal visible={!!adjustTarget} submitting={submitting} onClose={() => setAdjustTarget(null)} onConfirm={handleConfirmAdjustment} />

      <Modal visible={filterModalOpen} transparent animationType="fade" onRequestClose={() => setFilterModalOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setFilterModalOpen(false)}>
          <Pressable onPress={() => {}} style={styles.sheet}>
            <Text style={styles.sheetTitle}>상세 필터</Text>
            {!showDetailFilter && (
              <Text style={styles.sheetNote}>연식·브랜드 필터는 "전체"/"마감임박" 탭에서만 적용돼요.</Text>
            )}

            <Text style={styles.sheetLabel}>브랜드</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <TouchableOpacity style={[styles.chipSmall, !brandFilter && styles.chipSmallActive]} onPress={() => setBrandFilter(null)}>
                <Text style={[styles.chipSmallText, !brandFilter && styles.chipSmallTextActive]}>전체</Text>
              </TouchableOpacity>
              {brands.map((b) => (
                <TouchableOpacity key={b} style={[styles.chipSmall, brandFilter === b && styles.chipSmallActive]} onPress={() => setBrandFilter(brandFilter === b ? null : b)}>
                  <Text style={[styles.chipSmallText, brandFilter === b && styles.chipSmallTextActive]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sheetLabel, { marginTop: 16 }]}>연식</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <TouchableOpacity style={[styles.chipSmall, yearFilter == null && styles.chipSmallActive]} onPress={() => setYearFilter(null)}>
                <Text style={[styles.chipSmallText, yearFilter == null && styles.chipSmallTextActive]}>전체</Text>
              </TouchableOpacity>
              {years.map((y) => (
                <TouchableOpacity key={y} style={[styles.chipSmall, yearFilter === y && styles.chipSmallActive]} onPress={() => setYearFilter(yearFilter === y ? null : y)}>
                  <Text style={[styles.chipSmallText, yearFilter === y && styles.chipSmallTextActive]}>{y}년식</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.applyBtn} onPress={() => setFilterModalOpen(false)}>
              <Text style={styles.applyBtnText}>적용</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' },
  empty: { color: theme.textFaint, textAlign: 'center', marginTop: 60, fontSize: 13 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  topBarTitle: { color: theme.text, fontSize: 20, fontWeight: '900' },
  filterIconBtn: { padding: 6 },
  filterIcon: { fontSize: 20 },
  filterBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: theme.accent, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  chipScroll: { flexGrow: 0, flexShrink: 0, height: 56 },
  chipRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12, alignItems: 'flex-start' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder, alignSelf: 'flex-start' },
  chipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  chipUrgentActive: { backgroundColor: theme.danger, borderColor: theme.danger },
  chipText: { color: theme.textSub, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  chipSmall: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.cardBorder },
  chipSmallActive: { backgroundColor: theme.accentSoft, borderColor: theme.accentSoft },
  chipSmallText: { color: theme.textSub, fontWeight: '600', fontSize: 12 },
  chipSmallTextActive: { color: '#fff' },
  confirmRow: { backgroundColor: theme.card, borderRadius: 12, padding: 10, marginTop: -4, marginBottom: 10, borderWidth: 1, borderColor: theme.accent },
  confirmText: { color: theme.accentSoft, fontWeight: '700', fontSize: 12, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  sheetTitle: { color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sheetNote: { color: theme.textFaint, fontSize: 11, marginBottom: 12 },
  sheetLabel: { color: theme.textFaint, fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  applyBtn: { backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  applyBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
