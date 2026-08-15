import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { loadUser, saveUser, clearUser, fetchUserByEmail, DealerUser } from '../lib/api';
import { useTheme, Theme } from '../lib/theme';

const STEPS = ['이용약관 동의', '가입 신청', '승인 대기', '딜러활동 시작'];

export default function PendingApprovalScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [user, setUser] = useState<DealerUser | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUser().then(setUser);
  }, []);

  const rejected = user?.dealerStatus === 'rejected';
  const currentStep = rejected ? 1 : 2;

  const handleRefresh = async () => {
    if (!user?.email) return;
    setRefreshing(true);
    try {
      const fresh = await fetchUserByEmail(user.email);
      await saveUser(fresh);
      setUser(fresh);
      if (fresh.dealerStatus === 'approved') router.replace('/(tabs)');
    } catch {
      // 조용히 실패 — 네트워크 오류 등
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await clearUser();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar style={theme.statusBar} />
      <Text style={styles.emoji}>{rejected ? '📋' : '⏳'}</Text>
      <Text style={styles.title}>{rejected ? '승인이 보류되었습니다' : '가입이 승인대기 중이에요'}</Text>
      <Text style={styles.sub}>
        {rejected
          ? '제출하신 서류 확인이 필요해요. 채팅 문의로 다시 안내드릴게요.'
          : '제출하신 서류를 검토 중이에요. 영업일 기준 1~2일 내 완료됩니다.'}
      </Text>

      <View style={styles.stepsBox}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepRow}>
            <Text style={styles.stepIcon}>{i < currentStep ? '✅' : i === currentStep ? '▶️' : '⬜'}</Text>
            <Text style={[styles.stepText, i === currentStep && styles.stepTextActive]}>{s}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} disabled={refreshing}>
        {refreshing ? <ActivityIndicator color="#fff" /> : <Text style={styles.refreshBtnText}>승인상태 새로고침</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => Linking.openURL('tel:15882285')}>
        <Text style={styles.contactLink}>문의: 010-2285-6017</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout}>
        <Text style={styles.logoutLink}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { color: theme.text, fontSize: 19, fontWeight: '900', textAlign: 'center' },
  sub: { color: theme.textSub, fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  stepsBox: { alignSelf: 'stretch', backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.cardBorder, padding: 18, marginTop: 28, gap: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepIcon: { fontSize: 14 },
  stepText: { color: theme.textSub, fontSize: 13, fontWeight: '600' },
  stepTextActive: { color: theme.text, fontWeight: '800' },
  refreshBtn: { backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 32, alignItems: 'center', marginTop: 28, alignSelf: 'stretch' },
  refreshBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  contactLink: { color: theme.accentSoft, fontSize: 13, fontWeight: '700', marginTop: 18 },
  logoutLink: { color: theme.textFaint, fontSize: 12, marginTop: 16 },
});
