import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { loadUser, fetchMyBids, MyBid } from '../../lib/api';
import BidCard from '../../components/BidCard';
import { useTheme, Theme } from '../../lib/theme';

export default function WonScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [bids, setBids] = useState<MyBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const u = await loadUser();
    if (!u) return;
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
        renderItem={({ item: bid }) => <BidCard bid={bid} />}
      />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' },
  empty: { color: theme.textFaint, textAlign: 'center', marginTop: 60, fontSize: 13 },
});
