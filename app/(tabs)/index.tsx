import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  loadUser, fetchMyBids, fetchPenaltyStatus, confirmWinner, scheduleVisit, requestPriceAdjustment,
  MyBid, DealerUser, DealerPenalty,
} from '../../lib/api';
import BidCard from '../../components/BidCard';
import PenaltyBanner from '../../components/PenaltyBanner';
import VisitScheduleModal from '../../components/VisitScheduleModal';
import PriceAdjustmentModal from '../../components/PriceAdjustmentModal';
import { useTheme, Theme } from '../../lib/theme';

export default function BidsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [user, setUser] = useState<DealerUser | null>(null);
  const [bids, setBids] = useState<MyBid[]>([]);
  const [penalties, setPenalties] = useState<DealerPenalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visitTarget, setVisitTarget] = useState<MyBid | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<MyBid | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const u = await loadUser();
    if (!u) return;
    setUser(u);
    try {
      const [bidData, penaltyData] = await Promise.all([
        fetchMyBids(u.id),
        fetchPenaltyStatus(u.id),
      ]);
      setBids(bidData);
      setPenalties(penaltyData.penalties);
    } catch {
      // 조용히 실패 — 데모 단계
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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

  return (
    <View style={styles.container}>
      <FlatList
        data={bids}
        keyExtractor={(b) => String(b.id)}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<PenaltyBanner penalties={penalties} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />}
        ListEmptyComponent={<Text style={styles.empty}>아직 입찰한 물건이 없습니다.</Text>}
        renderItem={({ item: bid }) => (
          <View>
            <BidCard
              bid={bid}
              onScheduleVisit={() => setVisitTarget(bid)}
              onRequestAdjustment={() => setAdjustTarget(bid)}
            />
            {bid.isWinning && !bid.item?.visitScheduledAt && (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmText} onPress={() => handleConfirm(bid)}>
                  ✅ 네, 책임질 수 있는 견적입니다 (누르면 확인)
                </Text>
              </View>
            )}
          </View>
        )}
      />

      <VisitScheduleModal
        visible={!!visitTarget}
        submitting={submitting}
        onClose={() => setVisitTarget(null)}
        onConfirm={handleConfirmVisit}
      />
      <PriceAdjustmentModal
        visible={!!adjustTarget}
        submitting={submitting}
        onClose={() => setAdjustTarget(null)}
        onConfirm={handleConfirmAdjustment}
      />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' },
  empty: { color: theme.textFaint, textAlign: 'center', marginTop: 60, fontSize: 13 },
  confirmRow: { backgroundColor: theme.card, borderRadius: 12, padding: 10, marginTop: -4, marginBottom: 10, borderWidth: 1, borderColor: theme.accent },
  confirmText: { color: theme.accentSoft, fontWeight: '700', fontSize: 12, textAlign: 'center' },
});
