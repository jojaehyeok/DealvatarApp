import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { login, saveUser } from '../lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.'); return; }
    setLoading(true);
    try {
      const user = await login(email, password);
      await saveUser(user);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message ?? '이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.logoBox}>
        <Text style={styles.logo}>딜바타</Text>
        <Text style={styles.sub}>카비어 딜러 전용 (데모)</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="이메일"
        placeholderTextColor="#666"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        placeholderTextColor="#666"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '로그인 중…' : '로그인'}</Text>
      </TouchableOpacity>

      <Text style={styles.footNote}>카비어 딜러 승인 계정으로 로그인해주세요.</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', paddingHorizontal: 28 },
  logoBox: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 34, fontWeight: '900', color: '#fff' },
  sub: { fontSize: 13, color: '#8b8b8b', marginTop: 6 },
  input: {
    backgroundColor: '#1c1c1e', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: '#fff', fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2c',
  },
  button: { backgroundColor: '#8b5cf6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  footNote: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 20 },
});
