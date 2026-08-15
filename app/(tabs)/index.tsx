import { Redirect } from 'expo-router';

// "입찰한 물건"/"낙찰한 물건" 탭은 경매장(market) 안의 카테고리 필터로 통합됨 —
// (tabs) 그룹의 기본 경로(/(tabs))만 여기로 들어오므로 곧장 경매장으로 보낸다.
export default function TabsIndexRedirect() {
  return <Redirect href="/(tabs)/market" />;
}
