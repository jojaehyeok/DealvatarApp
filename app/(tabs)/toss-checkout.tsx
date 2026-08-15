import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  PaymentWidgetProvider,
  usePaymentWidget,
  AgreementWidget,
  PaymentMethodWidget,
} from '@tosspayments/widget-sdk-react-native';
import type { AgreementWidgetControl, PaymentMethodWidgetControl } from '@tosspayments/widget-sdk-react-native';
import { loadUser, confirmPartnerInspectionToss, PARTNER_INSPECTION_PRICING } from '../../lib/api';
import { useTheme, Theme } from '../../lib/theme';

// cavior 웹 /inspection과 동일한 라이브 클라이언트 키(같은 토스 가맹점) — carvior.store 승인 완료된 키 재사용.
const TOSS_CLIENT_KEY = 'live_gck_Gv6LjeKD8ajb9274j6mw3wYxAdXy';

export default function TossCheckoutScreen() {
  const params = useLocalSearchParams<{
    carNumber: string; carModel?: string; address: string; detailAddress?: string;
    preferredDateTime: string; listingUrl?: string; additionalMemo?: string;
    carOrigin: 'DOMESTIC' | 'IMPORTED'; contact: string; userId: string;
  }>();

  return (
    <PaymentWidgetProvider clientKey={TOSS_CLIENT_KEY} customerKey={String(params.userId)}>
      <CheckoutBody />
    </PaymentWidgetProvider>
  );
}

function CheckoutBody() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams<{
    carNumber: string; carModel?: string; address: string; detailAddress?: string;
    preferredDateTime: string; listingUrl?: string; additionalMemo?: string;
    carOrigin: 'DOMESTIC' | 'IMPORTED'; contact: string; userId: string;
  }>();
  const pricing = PARTNER_INSPECTION_PRICING[params.carOrigin];
  const paymentWidgetControl = usePaymentWidget();
  const [paymentMethodControl, setPaymentMethodControl] = useState<PaymentMethodWidgetControl | null>(null);
  const [agreementControl, setAgreementControl] = useState<AgreementWidgetControl | null>(null);
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!paymentMethodControl || !agreementControl) {
      Alert.alert('알림', '결제 위젯을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    const agreement = await agreementControl.getAgreementStatus();
    if (agreement.agreedRequiredTerms !== true) {
      Alert.alert('알림', '결제 약관에 동의해주세요.');
      return;
    }

    setPaying(true);
    try {
      const orderId = `DEALER-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const result = await paymentWidgetControl.requestPayment({
        orderId,
        orderName: `카비어 제휴검차 (${pricing.label})`,
        appScheme: 'dealvatar://',
      });

      if (result?.fail) {
        Alert.alert('결제 실패', result.fail.message);
        return;
      }
      if (!result?.success) return; // 사용자가 결제창을 그냥 닫은 경우

      const u = await loadUser();
      await confirmPartnerInspectionToss({
        paymentKey: result.success.paymentKey,
        orderId: result.success.orderId,
        amount: result.success.amount,
        carNumber: params.carNumber,
        carModel: params.carModel,
        contact: params.contact,
        address: params.address,
        detailAddress: params.detailAddress,
        preferredDateTime: params.preferredDateTime,
        listingUrl: params.listingUrl,
        additionalMemo: params.additionalMemo,
        carOrigin: params.carOrigin,
      });

      Alert.alert('결제 완료', '제휴검차 신청이 접수되었습니다.', [
        { text: '확인', onPress: () => router.replace('/(tabs)/partner-inspection') },
      ]);
    } catch (e: any) {
      Alert.alert('오류', e.message ?? '결제 처리 중 문제가 발생했습니다.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>제휴검차 결제금액 ({pricing.label})</Text>
          <Text style={styles.priceValue}>{pricing.amount.toLocaleString()}원</Text>
        </View>

        <PaymentMethodWidget
          selector="payment-methods"
          onLoadEnd={() => {
            paymentWidgetControl
              .renderPaymentMethods('payment-methods', { value: pricing.amount }, { variantKey: 'DEFAULT' })
              .then(setPaymentMethodControl);
          }}
        />
        <AgreementWidget
          selector="agreement"
          onLoadEnd={() => {
            paymentWidgetControl
              .renderAgreement('agreement', { variantKey: 'DEFAULT' })
              .then(setAgreementControl);
          }}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={paying}>
          {paying ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>{pricing.amount.toLocaleString()}원 결제하기</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  priceBox: { backgroundColor: theme.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.cardBorder, marginBottom: 16 },
  priceLabel: { color: theme.textSub, fontSize: 12, fontWeight: '700' },
  priceValue: { color: theme.accentSoft, fontSize: 24, fontWeight: '900', marginTop: 4 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: theme.divider, backgroundColor: theme.bg },
  payBtn: { backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  payBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
