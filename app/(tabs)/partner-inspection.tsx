import { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  loadUser, submitPartnerInspection, fetchMyPartnerInspections,
  DealerUser, PartnerInspectionRequest,
} from '../../lib/api';
import VisitScheduleModal from '../../components/VisitScheduleModal';
import PlaceSearchModal from '../../components/PlaceSearchModal';
import { useTheme, Theme } from '../../lib/theme';

const STATUS_LABEL: Record<string, string> = {
  PENDING: '접수 대기중',
  ASSIGNED: '평가사 배정됨',
  COMPLETED: '검차 완료',
  CANCELLED: '취소됨',
};

export default function PartnerInspectionScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [user, setUser] = useState<DealerUser | null>(null);
  const [requests, setRequests] = useState<PartnerInspectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [carNumber, setCarNumber] = useState('');
  const [carModel, setCarModel] = useState('');
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [listingUrl, setListingUrl] = useState('');
  const [preferredDateTime, setPreferredDateTime] = useState('');
  const [additionalMemo, setAdditionalMemo] = useState('');
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [placeModalOpen, setPlaceModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const u = await loadUser();
    setUser(u);
    if (u?.phone) {
      try {
        const list = await fetchMyPartnerInspections(u.phone);
        setRequests(list);
      } catch { /* 조용히 실패 */ }
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('ko-KR', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const handleSubmit = async () => {
    if (!user?.phone) {
      Alert.alert('알림', '계정에 등록된 연락처가 없어요. 마이 탭에서 확인해주세요.');
      return;
    }
    if (!carNumber.trim() || !address.trim() || !preferredDateTime) {
      Alert.alert('알림', '차량번호, 주소, 방문 희망일시는 필수예요.');
      return;
    }
    setSubmitting(true);
    try {
      await submitPartnerInspection({
        carNumber: carNumber.trim(),
        carModel: carModel.trim() || undefined,
        contact: user.phone,
        address: address.trim(),
        detailAddress: detailAddress.trim() || undefined,
        preferredDateTime,
        listingUrl: listingUrl.trim() || undefined,
        additionalMemo: additionalMemo.trim() || undefined,
      });
      Alert.alert('신청 완료', '제휴검차 신청이 접수되었습니다.');
      setCarNumber(''); setCarModel(''); setAddress(''); setDetailAddress(''); setListingUrl(''); setPreferredDateTime(''); setAdditionalMemo('');
      load();
    } catch (e: any) {
      Alert.alert('신청 실패', e.message);
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>제휴검차 신청</Text>
        <Text style={styles.sectionSub}>딜러님이 개인적으로 매입을 검토 중인 차량을 카비어 평가사가 직접 검차해드려요</Text>

        <TextInput style={styles.input} placeholder="차량번호 (필수)" placeholderTextColor={theme.textFaint} value={carNumber} onChangeText={setCarNumber} />
        <TextInput style={styles.input} placeholder="차량명 (선택)" placeholderTextColor={theme.textFaint} value={carModel} onChangeText={setCarModel} />
        <TouchableOpacity style={styles.input} onPress={() => setPlaceModalOpen(true)}>
          <Text style={{ color: address ? theme.text : theme.textFaint, fontSize: 15 }} numberOfLines={1}>
            {address || '방문 주소 검색 (필수)'}
          </Text>
        </TouchableOpacity>
        <TextInput style={styles.input} placeholder="상세주소 (선택)" placeholderTextColor={theme.textFaint} value={detailAddress} onChangeText={setDetailAddress} />
        <TouchableOpacity style={styles.input} onPress={() => setDateModalOpen(true)}>
          <Text style={{ color: preferredDateTime ? theme.text : theme.textFaint, fontSize: 15 }}>
            {preferredDateTime ? fmtDateTime(preferredDateTime) : '방문 희망일시 선택 (필수)'}
          </Text>
        </TouchableOpacity>
        <TextInput style={styles.input} placeholder="매물 링크 (선택 · 엔카/당근 등)" placeholderTextColor={theme.textFaint} value={listingUrl} onChangeText={setListingUrl} autoCapitalize="none" />
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="추가 요청사항 (선택)"
          placeholderTextColor={theme.textFaint}
          value={additionalMemo}
          onChangeText={setAdditionalMemo}
          multiline
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>제휴검차 신청하기</Text>}
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>내 신청 내역</Text>
        {requests.length === 0 ? (
          <Text style={styles.empty}>아직 신청한 내역이 없습니다.</Text>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(r) => String(r.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.reqCard}>
                <View style={styles.reqRowTop}>
                  <Text style={styles.reqCarNumber}>{item.carNumber}{item.carModel ? ` · ${item.carModel}` : ''}</Text>
                  <Text style={styles.reqStatus}>{STATUS_LABEL[item.status] ?? item.status}</Text>
                </View>
                <Text style={styles.reqDate}>{fmtDateTime(item.preferredDateTime)}</Text>
              </View>
            )}
          />
        )}
      </ScrollView>

      <VisitScheduleModal
        visible={dateModalOpen}
        submitting={false}
        onClose={() => setDateModalOpen(false)}
        onConfirm={(iso) => { setPreferredDateTime(iso); setDateModalOpen(false); }}
      />
      <PlaceSearchModal
        visible={placeModalOpen}
        onClose={() => setPlaceModalOpen(false)}
        onSelect={(picked) => setAddress(picked)}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: theme.text, fontWeight: '800', fontSize: 16, marginBottom: 4 },
  sectionSub: { color: theme.textSub, fontSize: 12, marginBottom: 16, lineHeight: 18 },
  input: {
    backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    color: theme.text, fontSize: 15, marginBottom: 10, borderWidth: 1, borderColor: theme.cardBorder,
    justifyContent: 'center',
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  empty: { color: theme.textFaint, fontSize: 12, textAlign: 'center', paddingVertical: 20 },
  reqCard: { backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.cardBorder, padding: 12, marginBottom: 8 },
  reqRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reqCarNumber: { color: theme.text, fontWeight: '700', fontSize: 13 },
  reqStatus: { color: theme.accentSoft, fontWeight: '700', fontSize: 11 },
  reqDate: { color: theme.textSub, fontSize: 12, marginTop: 4 },
});
