import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { loadUser, fetchMyBids, fetchPenaltyStatus, confirmWinner, MyBid, DealerUser, DealerPenalty } from '../../lib/api';
import BidCard from '../../components/BidCard';
import PenaltyBanner from '../../components/PenaltyBanner';

export default function BidsScreen() {
  const [user, setUser] = useState<DealerUser | null>(null);
  const [bids, setBids] = useState<MyBid[]>([]);
  const [penalties, setPenalties] = useState<DealerPenalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#8b5cf6" />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#8b5cf6" />}
        ListEmptyComponent={<Text style={styles.empty}>아직 입찰한 물건이 없습니다.</Text>}
        renderItem={({ item: bid }) => (
          <View>
            <BidCard bid={bid} />
            {bid.isWinning && (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmText} onPress={() => handleConfirm(bid)}>
                  ✅ 네, 책임질 수 있는 견적입니다 (누르면 확인)
                </Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, backgroundColor: '#0f0f0f', alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#666', textAlign: 'center', marginTop: 60, fontSize: 13 },
  confirmRow: { backgroundColor: '#1c1c1e', borderRadius: 12, padding: 10, marginTop: -4, marginBottom: 10, borderWidth: 1, borderColor: '#8b5cf6' },
  confirmText: { color: '#a78bfa', fontWeight: '700', fontSize: 12, textAlign: 'center' },
});
