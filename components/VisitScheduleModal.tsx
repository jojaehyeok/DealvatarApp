import { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme, Theme } from '../lib/theme';

// 차바타(ChavatarApp)의 30분 단위 오전/오후 슬롯 패턴과 동일 — 08:00~11:30(오전), 12:00~22:00(오후)
function buildHalfHourSlots(startHour: number, endHour: number, includeEndHalf: boolean): string[] {
  const pad = (n: number) => String(n).padStart(2, '0');
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) slots.push(`${pad(h)}:00`, `${pad(h)}:30`);
  slots.push(`${pad(endHour)}:00`);
  if (includeEndHalf) slots.push(`${pad(endHour)}:30`);
  return slots;
}
const AM_TIMES = buildHalfHourSlots(8, 11, true);
const PM_TIMES = buildHalfHourSlots(12, 22, false);
const DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

function getDates(count = 14) {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

export default function VisitScheduleModal({
  visible,
  submitting,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (isoDateTime: string) => void;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [selDate, setSelDate] = useState<Date | null>(null);
  const [selTime, setSelTime] = useState<string | null>(null);

  const confirm = () => {
    if (!selDate || !selTime) return;
    const [h, m] = selTime.split(':').map(Number);
    const dt = new Date(selDate);
    dt.setHours(h, m, 0, 0);
    onConfirm(dt.toISOString());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>방문일정 입력</Text>
          <Text style={styles.sub}>실물 확인을 위해 방문할 날짜/시간을 선택해주세요</Text>

          <Text style={styles.label}>날짜</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {getDates().map((d) => {
              const active = selDate?.toDateString() === d.toDateString();
              return (
                <TouchableOpacity
                  key={d.toISOString()}
                  style={[styles.dateChip, active && styles.dateChipActive]}
                  onPress={() => setSelDate(d)}
                >
                  <Text style={[styles.dateChipDay, active && styles.dateChipTextActive]}>{DAY_KO[d.getDay()]}</Text>
                  <Text style={[styles.dateChipNum, active && styles.dateChipTextActive]}>{d.getDate()}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.label, { marginTop: 16 }]}>시간 · 오전</Text>
          <View style={styles.timeGrid}>
            {AM_TIMES.map((t) => {
              const active = selTime === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, active && styles.timeChipActive]}
                  onPress={() => setSelTime(t)}
                >
                  <Text style={[styles.timeChipText, active && styles.dateChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>시간 · 오후</Text>
          <View style={styles.timeGrid}>
            {PM_TIMES.map((t) => {
              const active = selTime === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, active && styles.timeChipActive]}
                  onPress={() => setSelTime(t)}
                >
                  <Text style={[styles.timeChipText, active && styles.dateChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, (!selDate || !selTime || submitting) && { opacity: 0.5 }]}
            disabled={!selDate || !selTime || submitting}
            onPress={confirm}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>방문일정 확정</Text>}
          </TouchableOpacity>
        </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, maxHeight: '85%' },
  title: { color: theme.text, fontSize: 16, fontWeight: '800' },
  sub: { color: theme.textSub, fontSize: 12, marginTop: 4, marginBottom: 16 },
  label: { color: theme.textFaint, fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  dateChip: { width: 48, height: 60, borderRadius: 12, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.cardBorder },
  dateChipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  dateChipDay: { color: theme.textSub, fontSize: 10 },
  dateChipNum: { color: theme.text, fontSize: 16, fontWeight: '800', marginTop: 2 },
  dateChipTextActive: { color: '#fff' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.cardBorder },
  timeChipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  timeChipText: { color: theme.text, fontSize: 13, fontWeight: '700' },
  confirmBtn: { backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
