import { useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Theme } from '../lib/theme';

// 카카오 로컬 API 키워드 검색 — ChavatarApp(KakaoMapScreen.tsx)과 동일한 키 재사용.
const KAKAO_REST_API_KEY = '5d73c6482159874735a29becf6849e11';

interface KakaoPlace {
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
}

export default function PlaceSearchModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (address: string) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets.bottom);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const res = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query.trim())}`, {
        headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
      });
      const data = await res.json();
      setResults(data?.documents ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (place: KakaoPlace) => {
    const address = place.road_address_name || place.address_name;
    onSelect(`${place.place_name} (${address})`);
    setQuery('');
    setResults([]);
    setSearched(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} style={styles.sheet}>
          <Text style={styles.title}>장소 검색</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder="장소명, 건물명, 주소로 검색"
              placeholderTextColor={theme.textFaint}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={search}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchBtn} onPress={search} disabled={searching}>
              {searching ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.searchBtnText}>검색</Text>}
            </TouchableOpacity>
          </View>

          <FlatList
            data={results}
            keyExtractor={(p, i) => `${p.place_name}-${i}`}
            style={{ maxHeight: 300 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              searched && !searching ? <Text style={styles.empty}>검색 결과가 없습니다.</Text> : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultRow} onPress={() => handleSelect(item)}>
                <Text style={styles.resultName}>{item.place_name}</Text>
                <Text style={styles.resultAddress}>{item.road_address_name || item.address_name}</Text>
              </TouchableOpacity>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (theme: Theme, safeBottom: number) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: safeBottom + 20, maxHeight: '85%' },
  title: { color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: {
    flex: 1, backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: theme.text, fontSize: 14, borderWidth: 1, borderColor: theme.cardBorder,
  },
  searchBtn: { backgroundColor: theme.accent, borderRadius: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  empty: { color: theme.textFaint, fontSize: 12, textAlign: 'center', paddingVertical: 24 },
  resultRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.divider },
  resultName: { color: theme.text, fontSize: 14, fontWeight: '700' },
  resultAddress: { color: theme.textSub, fontSize: 12, marginTop: 2 },
});
