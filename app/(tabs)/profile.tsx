import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { loadUser, clearUser, fetchPenaltyStatus, DealerUser, DealerPenalty } from '../../lib/api';
import PenaltyBanner from '../../components/PenaltyBanner';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<DealerUser | null>(null);
  const [penalties, setPenalties] = useState<DealerPenalty[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const u = await loadUser();
        setUser(u);
        if (u) {
          try {
            const status = await fetchPenaltyStatus(u.id);
            setPenalties(status.penalties);
          } catch { /* 조용히 실패 */ }
        }
        setLoading(false);
      })();
    }, [])
  );

  const handleLogout = async () => {
    await clearUser();
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0] ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <PenaltyBanner penalties={penalties} />

      <View style={styles.ruleBox}>
        <Text style={styles.ruleTitle}>운영 규정</Text>
        <Text style={styles.ruleItem}>· 하루 최대 30건까지 입찰 가능</Text>
        <Text style={styles.ruleItem}>· 낙찰 후 2시간 이내 견적 재확인 필요</Text>
        <Text style={styles.ruleItem}>· 미확인 시 7일간 입찰 정지</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', padding: 20 },
  center: { flex: 1, backgroundColor: '#0f0f0f', alignItems: 'center', justifyContent: 'center' },
  profileBox: { alignItems: 'center', marginVertical: 24 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  name: { color: '#fff', fontSize: 17, fontWeight: '800' },
  email: { color: '#8b8b8b', fontSize: 13, marginTop: 2 },
  ruleBox: { backgroundColor: '#1c1c1e', borderRadius: 14, padding: 16, marginTop: 8, borderWidth: 1, borderColor: '#2a2a2c' },
  ruleTitle: { color: '#fff', fontWeight: '800', fontSize: 13, marginBottom: 8 },
  ruleItem: { color: '#8b8b8b', fontSize: 12, marginTop: 4, lineHeight: 18 },
  logoutBtn: { marginTop: 24, paddingVertical: 14, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#333' },
  logoutText: { color: '#ff6b6b', fontWeight: '700', fontSize: 13 },
});
