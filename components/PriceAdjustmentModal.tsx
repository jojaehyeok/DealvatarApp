import { useState } from 'react';
import { Text, Modal, Pressable, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Theme } from '../lib/theme';

export default function PriceAdjustmentModal({
  visible,
  submitting,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (amount: number, reason: string) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets.bottom);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const confirm = () => {
    const value = Number(amount.replace(/[^0-9]/g, ''));
    if (!value || value <= 0) return;
    onConfirm(value, reason.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable onPress={() => {}} style={styles.sheet}>
            <Text style={styles.title}>감가 신청</Text>
            <Text style={styles.sub}>실물 확인 결과 가격을 조정하고 싶다면 신청해주세요. 판매자 확인 후 반영됩니다.</Text>

            <Text style={styles.label}>감가 금액 (원)</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 500000"
              placeholderTextColor={theme.textFaint}
              keyboardType="number-pad"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>사유</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="예: 하부 부식 확인, 실주행거리 상이 등"
              placeholderTextColor={theme.textFaint}
              multiline
              value={reason}
              onChangeText={setReason}
            />

            <TouchableOpacity
              style={[styles.confirmBtn, (!amount || submitting) && { opacity: 0.5 }]}
              disabled={!amount || submitting}
              onPress={confirm}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>감가 신청하기</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (theme: Theme, safeBottom: number) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: safeBottom + 20 },
  title: { color: theme.text, fontSize: 16, fontWeight: '800' },
  sub: { color: theme.textSub, fontSize: 12, marginTop: 4, marginBottom: 16, lineHeight: 18 },
  label: { color: theme.textFaint, fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  input: {
    backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: theme.text, fontSize: 14, borderWidth: 1, borderColor: theme.cardBorder,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  confirmBtn: { backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
