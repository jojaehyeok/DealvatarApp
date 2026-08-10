import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchActiveListings, StoreItem } from '../../../lib/api';
import ListingCard from '../../../components/ListingCard';
import { useTheme, Theme } from '../../../lib/theme';

export default function MarketScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchActiveListings();
      setItems(data);
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
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />}
        ListEmptyComponent={<Text style={styles.empty}>진행 중인 경매가 없습니다.</Text>}
        renderItem={({ item }) => (
          <ListingCard item={item} onPress={() => router.push(`/(tabs)/market/${item.id}`)} />
        )}
      />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' },
  empty: { color: theme.textFaint, textAlign: 'center', marginTop: 60, fontSize: 13 },
});
