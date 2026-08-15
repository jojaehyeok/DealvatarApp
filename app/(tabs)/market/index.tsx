import { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchActiveListings, StoreItem } from '../../../lib/api';
import ListingCard from '../../../components/ListingCard';
import { useTheme, Theme } from '../../../lib/theme';
import { brandLabel } from '../../../lib/carBrand';
import { isUrgent, msLeft } from '../../../lib/auctionTiming';

type SortMode = 'all' | 'urgent';

export default function MarketScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('all');
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [brandFilter, setBrandFilter] = useState<string | null>(null);

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

  const urgentCount = useMemo(() => items.filter((i) => isUrgent(i.auctionEndAt)).length, [items]);

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
    let result = items;
    if (yearFilter != null) result = result.filter((i) => i.year === yearFilter);
    if (brandFilter) result = result.filter((i) => brandLabel(i.titleKo) === brandFilter);
    if (sortMode === 'urgent') {
      result = result.filter((i) => isUrgent(i.auctionEndAt));
      result = [...result].sort((a, b) => (msLeft(a.auctionEndAt) ?? Infinity) - (msLeft(b.auctionEndAt) ?? Infinity));
    }
    return result;
  }, [items, sortMode, yearFilter, brandFilter]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterBlock}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, sortMode === 'all' && styles.chipActive]}
            onPress={() => setSortMode('all')}
          >
            <Text style={[styles.chipText, sortMode === 'all' && styles.chipTextActive]}>전체</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, sortMode === 'urgent' && styles.chipUrgentActive]}
            onPress={() => setSortMode(sortMode === 'urgent' ? 'all' : 'urgent')}
          >
            <Text style={[styles.chipText, sortMode === 'urgent' && styles.chipTextActive]}>🔥 마감임박 ({urgentCount})</Text>
          </TouchableOpacity>
        </ScrollView>

        {brands.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <TouchableOpacity style={[styles.chipSmall, !brandFilter && styles.chipSmallActive]} onPress={() => setBrandFilter(null)}>
              <Text style={[styles.chipSmallText, !brandFilter && styles.chipSmallTextActive]}>브랜드 전체</Text>
            </TouchableOpacity>
            {brands.map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.chipSmall, brandFilter === b && styles.chipSmallActive]}
                onPress={() => setBrandFilter(brandFilter === b ? null : b)}
              >
                <Text style={[styles.chipSmallText, brandFilter === b && styles.chipSmallTextActive]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {years.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <TouchableOpacity style={[styles.chipSmall, yearFilter == null && styles.chipSmallActive]} onPress={() => setYearFilter(null)}>
              <Text style={[styles.chipSmallText, yearFilter == null && styles.chipSmallTextActive]}>연식 전체</Text>
            </TouchableOpacity>
            {years.map((y) => (
              <TouchableOpacity
                key={y}
                style={[styles.chipSmall, yearFilter === y && styles.chipSmallActive]}
                onPress={() => setYearFilter(yearFilter === y ? null : y)}
              >
                <Text style={[styles.chipSmallText, yearFilter === y && styles.chipSmallTextActive]}>{y}년식</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

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
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' },
  empty: { color: theme.textFaint, textAlign: 'center', marginTop: 60, fontSize: 13 },
  filterBlock: { paddingTop: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: theme.divider, paddingBottom: 10 },
  chipRow: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder },
  chipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  chipUrgentActive: { backgroundColor: theme.danger, borderColor: theme.danger },
  chipText: { color: theme.textSub, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  chipSmall: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.cardBorder },
  chipSmallActive: { backgroundColor: theme.accentSoft, borderColor: theme.accentSoft },
  chipSmallText: { color: theme.textSub, fontWeight: '600', fontSize: 12 },
  chipSmallTextActive: { color: '#fff' },
});
