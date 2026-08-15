import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { loadUser, fetchMyBids, scheduleVisit, requestPriceAdjustment, MyBid } from '../../lib/api';
import BidCard from '../../components/BidCard';
import VisitScheduleModal from '../../components/VisitScheduleModal';
import PriceAdjustmentModal from '../../components/PriceAdjustmentModal';
import { useTheme, Theme } from '../../lib/theme';

export default function WonScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [userId, setUserId] = useState<number | null>(null);
  const [bids, setBids] = useState<MyBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visitTarget, setVisitTarget] = useState<MyBid | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<MyBid | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const u = await loadUser();
    if (!u) return;
    setUserId(u.id);
    try {
      const data = await fetchMyBids(u.id);
      setBids(data.filter((b) => b.isWinning));
    } catch {
      // 조용히 실패 — 데모 단계
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleConfirmVisit = async (isoDateTime: string) => {
    if (!userId || !visitTarget) return;
    setSubmitting(true);
    try {
      await scheduleVisit(visitTarget.storeItemId, userId, isoDateTime);
      setVisitTarget(null);
      load();
    } catch (e: any) {
      Alert.alert('오류', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmAdjustment = async (amount: number, reason: string) => {
    if (!userId || !adjustTarget) return;
    setSubmitting(true);
    try {
      await requestPriceAdjustment(adjustTarget.storeItemId, userId, amount, reason);
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />}
        ListEmptyComponent={<Text style={styles.empty}>아직 낙찰한 물건이 없습니다.</Text>}
        renderItem={({ item: bid }) => (
          <BidCard
            bid={bid}
            onScheduleVisit={() => setVisitTarget(bid)}
            onRequestAdjustment={() => setAdjustTarget(bid)}
          />
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
});
