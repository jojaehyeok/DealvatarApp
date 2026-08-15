import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MyBid } from '../lib/api';
import { useTheme, Theme } from '../lib/theme';

function fmtWon(n?: number) {
  if (!n) return '-';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  return `${Math.round(n / 10_000).toLocaleString()}만원`;
}

const STATUS_LABEL: Record<string, string> = {
  active: '입찰중',
  sold: '낙찰완료',
  hidden: '숨김',
  pending: '검토중',
  closed: '마감',
};

function StepRow({ done, active, label, action }: { done?: boolean; active?: boolean; label: string; action?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 12 }}>{done ? '✅' : active ? '▶️' : '⬜'}</Text>
        <Text style={{ color: done ? theme.textSub : theme.text, fontSize: 12, fontWeight: active ? '800' : '600' }}>{label}</Text>
      </View>
      {action}
    </View>
  );
}

export default function BidCard({
  bid,
  onPress,
  onScheduleVisit,
  onRequestAdjustment,
}: {
  bid: MyBid;
  onPress?: () => void;
  onScheduleVisit?: () => void;
  onRequestAdjustment?: () => void;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const item = bid.item;
  const thumb = item?.photos ? Object.values(item.photos).flat()[0] : undefined;

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardTop} onPress={onPress} disabled={!onPress} activeOpacity={0.8}>
        <View style={styles.thumbBox}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.thumb} />
          ) : (
            <Text style={styles.thumbPlaceholder}>🚗</Text>
          )}
        </View>
        <View style={styles.info}>
          <View style={styles.rowTop}>
            <Text style={styles.title} numberOfLines={1}>{item?.titleKo ?? '매물 정보 없음'}</Text>
            {bid.isWinning && <View style={styles.winningTag}><Text style={styles.winningTagText}>낙찰</Text></View>}
          </View>
          <Text style={styles.carNumber}>{item?.carNumber}</Text>
          <View style={styles.rowBottom}>
            <Text style={styles.amount}>내 입찰 {fmtWon(bid.amount)}</Text>
            <Text style={styles.status}>{item ? STATUS_LABEL[item.status] ?? item.status : '-'}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {bid.isWinning && item && (
        <View style={styles.progressBox}>
          <StepRow done label="고객 견적 선택" />
          <StepRow done label={`견적 재확인 · ${fmtWon(bid.amount)}`} />
          {!item.visitScheduledAt ? (
            <StepRow
              active
              label="방문일정 입력"
              action={onScheduleVisit && (
                <TouchableOpacity style={styles.stepBtn} onPress={onScheduleVisit}>
                  <Text style={styles.stepBtnText}>입력하기 ›</Text>
                </TouchableOpacity>
              )}
            />
          ) : item.priceAdjustmentAmount == null ? (
            <StepRow
              done={false}
              active
              label={`방문예정 · ${new Date(item.visitScheduledAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
              action={onRequestAdjustment && (
                <TouchableOpacity style={styles.stepBtn} onPress={onRequestAdjustment}>
                  <Text style={styles.stepBtnText}>감가 신청 ›</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <StepRow
              done={item.priceAdjustmentConfirmed}
              active={!item.priceAdjustmentConfirmed}
              label={`감가 ${fmtWon(item.priceAdjustmentAmount)} · ${item.priceAdjustmentConfirmed ? '확인됨' : '확인 대기중'}`}
            />
          )}
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.card, borderRadius: 16, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: theme.cardBorder,
  },
  cardTop: { flexDirection: 'row' },
  progressBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.divider },
  stepBtn: { backgroundColor: theme.accent, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  stepBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  thumbBox: { width: 72, height: 72, borderRadius: 12, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: { fontSize: 28 },
  info: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: theme.text, fontWeight: '800', fontSize: 14, flexShrink: 1 },
  winningTag: { backgroundColor: theme.accent, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  winningTagText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  carNumber: { color: theme.textSub, fontSize: 12, marginTop: 2 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
  amount: { color: theme.accentSoft, fontWeight: '800', fontSize: 13 },
  status: { color: theme.textSub, fontSize: 11, fontWeight: '700' },
});
