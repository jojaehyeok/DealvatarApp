import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { login, saveUser } from '../lib/api';
import { useTheme, Theme } from '../lib/theme';

export default function LoginScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    try {
      const user = await login(loginEmail, loginPassword);
      await saveUser(user);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message ?? '이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (!email || !password) { Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.'); return; }
    doLogin(email, password);
  };

  const handleTestLogin = () => doLogin('dealvatar.test@carvior.store', 'test1234');

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style={theme.statusBar} />
      <View style={styles.logoBox}>
        <Text style={styles.logo}>딜바타</Text>
        <Text style={styles.sub}>카비어 딜러 전용 (데모)</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="이메일"
        placeholderTextColor={theme.textFaint}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        placeholderTextColor={theme.textFaint}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '로그인 중…' : '로그인'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.testButton} onPress={handleTestLogin} disabled={loading}>
        <Text style={styles.testButtonText}>🧪 테스트 계정으로 바로 로그인</Text>
      </TouchableOpacity>

      <Text style={styles.footNote}>카비어 딜러 승인 계정으로 로그인해주세요.</Text>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.registerLink}>딜러 회원가입</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', paddingHorizontal: 28 },
  logoBox: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 34, fontWeight: '900', color: theme.text },
  sub: { fontSize: 13, color: theme.textSub, marginTop: 6 },
  input: {
    backgroundColor: theme.inputBg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: theme.text, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: theme.cardBorder,
  },
  button: { backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  testButton: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: theme.cardBorder },
  testButtonText: { color: theme.accentSoft, fontWeight: '700', fontSize: 13 },
  footNote: { color: theme.textFaint, fontSize: 12, textAlign: 'center', marginTop: 20 },
  registerLink: { color: theme.accentSoft, fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 16 },
});
