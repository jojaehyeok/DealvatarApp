import { useCallback, useState } from 'react';
import { View, Text, Image, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { loadUser, saveUser, clearUser, fetchPenaltyStatus, uploadFile, updateProfileImage, updatePhone, DealerUser, DealerPenalty } from '../../lib/api';
import PenaltyBanner from '../../components/PenaltyBanner';
import { useTheme, Theme } from '../../lib/theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [user, setUser] = useState<DealerUser | null>(null);
  const [penalties, setPenalties] = useState<DealerPenalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const u = await loadUser();
        setUser(u);
        setPhoneInput(u?.phone ?? '');
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

  const handleSavePhone = async () => {
    if (!user) return;
    const digits = phoneInput.replace(/[^0-9]/g, '');
    if (digits.length < 10) {
      Alert.alert('알림', '연락처를 올바르게 입력해주세요.');
      return;
    }
    setSavingPhone(true);
    try {
      await updatePhone(user.id, digits);
      const updated = { ...user, phone: digits };
      setUser(updated);
      await saveUser(updated);
      Alert.alert('저장 완료', '연락처가 저장되었습니다.');
    } catch (e: any) {
      Alert.alert('저장 실패', e.message);
    } finally {
      setSavingPhone(false);
    }
  };

  const handlePickPhoto = async () => {
    if (!user) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '사진첩 접근 권한을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadingPhoto(true);
    try {
      const url = await uploadFile(result.assets[0].uri, '/users/upload-doc');
      await updateProfileImage(user.id, url);
      const updated = { ...user, profileImage: url };
      setUser(updated);
      await saveUser(updated);
    } catch (e: any) {
      Alert.alert('업로드 실패', e.message);
    } finally {
      setUploadingPhoto(false);
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
    <View style={styles.container}>
      <View style={styles.profileBox}>
        <TouchableOpacity style={styles.avatar} onPress={handlePickPhoto} disabled={uploadingPhoto}>
          {uploadingPhoto ? (
            <ActivityIndicator color="#fff" />
          ) : user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{user?.name?.[0] ?? '?'}</Text>
          )}
          <View style={styles.avatarEditBadge}>
            <Text style={styles.avatarEditBadgeText}>✎</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.phoneBox}>
        <Text style={styles.phoneLabel}>연락처</Text>
        <View style={styles.phoneRow}>
          <TextInput
            style={styles.phoneInput}
            placeholder="010-0000-0000"
            placeholderTextColor={theme.textFaint}
            keyboardType="phone-pad"
            value={phoneInput}
            onChangeText={setPhoneInput}
          />
          <TouchableOpacity style={styles.phoneSaveBtn} onPress={handleSavePhone} disabled={savingPhone}>
            {savingPhone ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.phoneSaveBtnText}>저장</Text>}
          </TouchableOpacity>
        </View>
        <Text style={styles.phoneNote}>제휴검차 신청 시 이 연락처로 접수됩니다.</Text>
      </View>

      <PenaltyBanner penalties={penalties} />

      <View style={styles.menuBox}>
        <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/(tabs)/partner-inspection')}>
          <Text style={styles.menuIcon}>🔧</Text>
          <Text style={styles.menuLabel}>제휴검차 신청내역</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/(tabs)/my-listings')}>
          <Text style={styles.menuIcon}>🚗</Text>
          <Text style={styles.menuLabel}>내 매물 관리</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

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

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 20 },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' },
  profileBox: { alignItems: 'center', marginVertical: 24 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder, alignItems: 'center', justifyContent: 'center' },
  avatarEditBadgeText: { color: theme.text, fontSize: 10 },
  name: { color: theme.text, fontSize: 17, fontWeight: '800' },
  email: { color: theme.textSub, fontSize: 13, marginTop: 2 },
  phoneBox: { backgroundColor: theme.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.cardBorder },
  phoneLabel: { color: theme.textFaint, fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  phoneRow: { flexDirection: 'row', gap: 8 },
  phoneInput: {
    flex: 1, backgroundColor: theme.inputBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    color: theme.text, fontSize: 14, borderWidth: 1, borderColor: theme.cardBorder,
  },
  phoneSaveBtn: { backgroundColor: theme.accent, borderRadius: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  phoneSaveBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  phoneNote: { color: theme.textFaint, fontSize: 11, marginTop: 8 },
  menuBox: { backgroundColor: theme.card, borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: theme.cardBorder, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16, gap: 10 },
  menuIcon: { fontSize: 16 },
  menuLabel: { color: theme.text, fontSize: 14, fontWeight: '700', flex: 1 },
  menuArrow: { color: theme.textFaint, fontSize: 18 },
  menuDivider: { height: 1, backgroundColor: theme.divider, marginLeft: 16 },
  ruleBox: { backgroundColor: theme.card, borderRadius: 14, padding: 16, marginTop: 8, borderWidth: 1, borderColor: theme.cardBorder },
  ruleTitle: { color: theme.text, fontWeight: '800', fontSize: 13, marginBottom: 8 },
  ruleItem: { color: theme.textSub, fontSize: 12, marginTop: 4, lineHeight: 18 },
  logoutBtn: { marginTop: 24, paddingVertical: 14, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder },
  logoutText: { color: theme.danger, fontWeight: '700', fontSize: 13 },
});
