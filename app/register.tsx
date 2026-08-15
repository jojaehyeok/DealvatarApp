import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { registerDealer, saveUser, uploadFile } from '../lib/api';
import { useTheme, Theme } from '../lib/theme';

export default function RegisterScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [licenseUri, setLicenseUri] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickLicense = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '사진첩 접근 권한을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) setLicenseUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!email || !password || !name) {
      Alert.alert('알림', '이메일/비밀번호/이름을 입력해주세요.');
      return;
    }
    if (!licenseUri) {
      Alert.alert('알림', '자동차 매매종사원증 사진을 업로드해주세요.');
      return;
    }
    if (!agreed) {
      Alert.alert('알림', '이용약관에 동의해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const dealerLicenseUrl = await uploadFile(licenseUri, '/users/upload-doc');
      const user = await registerDealer({
        email, password, name,
        phone: phone || undefined,
        dealerLicenseUrl,
        companyName: companyName || undefined,
        businessNumber: businessNumber || undefined,
      });
      await saveUser(user);
      router.replace('/pending-approval');
    } catch (e: any) {
      Alert.alert('가입 실패', e.message ?? '잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style={theme.statusBar} />
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
        <Text style={styles.title}>딜러 회원가입</Text>
        <Text style={styles.sub}>서류 검토 후 승인되면 경매장을 이용하실 수 있어요</Text>

        <Text style={styles.stepLabel}>1. 계정 정보</Text>
        <TextInput style={styles.input} placeholder="이메일" placeholderTextColor={theme.textFaint} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="비밀번호" placeholderTextColor={theme.textFaint} secureTextEntry value={password} onChangeText={setPassword} />
        <TextInput style={styles.input} placeholder="이름" placeholderTextColor={theme.textFaint} value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="연락처 (선택)" placeholderTextColor={theme.textFaint} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

        <Text style={styles.stepLabel}>2. 딜러 서류 제출</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickLicense}>
          {licenseUri ? (
            <Image source={{ uri: licenseUri }} style={styles.uploadPreview} />
          ) : (
            <Text style={styles.uploadText}>📎 자동차 매매종사원증 업로드 (필수)</Text>
          )}
        </TouchableOpacity>
        <TextInput style={styles.input} placeholder="상호명 (선택)" placeholderTextColor={theme.textFaint} value={companyName} onChangeText={setCompanyName} />
        <TextInput style={styles.input} placeholder="사업자번호 (선택)" placeholderTextColor={theme.textFaint} value={businessNumber} onChangeText={setBusinessNumber} />

        <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreed((v) => !v)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
          <Text style={styles.agreeText}>이용약관 및 개인정보 수집·이용에 동의합니다</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>가입 신청하기</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>로그인으로 돌아가기</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  title: { color: theme.text, fontSize: 22, fontWeight: '900' },
  sub: { color: theme.textSub, fontSize: 13, marginTop: 6, marginBottom: 24 },
  stepLabel: { color: theme.textFaint, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginTop: 8, marginBottom: 10 },
  input: {
    backgroundColor: theme.inputBg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: theme.text, fontSize: 15, marginBottom: 10, borderWidth: 1, borderColor: theme.cardBorder,
  },
  uploadBox: {
    backgroundColor: theme.inputBg, borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder, borderStyle: 'dashed',
    minHeight: 90, alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden',
  },
  uploadText: { color: theme.textSub, fontSize: 13, fontWeight: '700', padding: 16, textAlign: 'center' },
  uploadPreview: { width: '100%', height: 140 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, marginBottom: 20 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: theme.cardBorder, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: theme.accent, borderColor: theme.accent },
  checkboxMark: { color: '#fff', fontSize: 12, fontWeight: '900' },
  agreeText: { color: theme.textSub, fontSize: 12, flexShrink: 1 },
  submitBtn: { backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  backLink: { color: theme.textFaint, fontSize: 12, textAlign: 'center', marginTop: 18 },
});
