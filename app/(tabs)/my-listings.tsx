import { useCallback, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { loadUser, fetchMyStoreItems } from '../../lib/api';
import { useTheme, Theme } from '../../lib/theme';

interface MyStoreItem {
  id: number;
  titleKo: string;
  carNumber: string;
  priceKRW: number;
  status: string;
  saleStage?: string;
  photos?: Record<string, string[]>;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: '검토중', color: '#eab308' },
  active: { label: '판매중', color: '#22c55e' },
  sold: { label: '판매완료', color: '#8b8b8b' },
  hidden: { label: '숨김', color: '#ef4444' },
};

const STAGE_LABEL: Record<string, string> = {
  bidding: '입찰 진행중',
  winner_selected: '낙찰자 확정 · 입력필요',
  in_transit: '탁송중',
  transit_done: '탁송완료',
  completed: '거래완료',
};

function fmtWon(n?: number) {
  if (!n) return '가격 협의';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  return `${Math.round(n / 10_000).toLocaleString()}만원`;
}

export default function MyListingsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [items, setItems] = useState<MyStoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const u = await loadUser();
    if (!u) { setLoading(false); return; }
    try {
      const data = await fetchMyStoreItems(u.id);
      setItems(data);
    } catch {
      // 조용히 실패
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
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.empty}>등록된 매물이 없습니다.</Text>
            <Text style={styles.emptySub}>매물 등록은 웹(carvior.store)에서 진행해주세요.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const thumb = item.photos?.exterior?.[0] ?? Object.values(item.photos ?? {}).flat()[0];
          const status = STATUS_LABEL[item.status] ?? { label: item.status, color: theme.textSub };
          const stage = item.status === 'sold' && item.saleStage ? STAGE_LABEL[item.saleStage] : null;
          return (
            <View style={styles.card}>
              <View style={styles.thumbBox}>
                {thumb ? <Image source={{ uri: thumb }} style={styles.thumb} /> : <Text style={{ fontSize: 24 }}>🚗</Text>}
              </View>
              <View style={styles.info}>
                <View style={styles.rowTop}>
                  <Text style={styles.title} numberOfLines={1}>{item.titleKo}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                    <Text style={styles.statusText}>{status.label}</Text>
                  </View>
                </View>
                <Text style={styles.carNumber}>{item.carNumber}</Text>
                <View style={styles.rowBottom}>
                  <Text style={styles.price}>{fmtWon(item.priceKRW)}</Text>
                  {stage && <Text style={styles.stage}>{stage}</Text>}
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  empty: { color: theme.textFaint, fontSize: 13 },
  emptySub: { color: theme.textFaint, fontSize: 11, marginTop: 6 },
  card: {
    flexDirection: 'row', backgroundColor: theme.card, borderRadius: 16, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: theme.cardBorder,
  },
  thumbBox: { width: 64, height: 64, borderRadius: 10, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  info: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: theme.text, fontWeight: '800', fontSize: 14, flexShrink: 1 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  carNumber: { color: theme.textSub, fontSize: 12, marginTop: 2 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, alignItems: 'center' },
  price: { color: theme.accentSoft, fontWeight: '800', fontSize: 13 },
  stage: { color: theme.textSub, fontSize: 11, fontWeight: '700' },
});
