import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = 'https://carvior.store/api/v1';
// 웹/대시보드와 동일하게 노출되는 내부 키 — 딜바타 데모 단계에서 동일 패턴 사용
const INTERNAL_KEY = '3e569aaa127cdcc534c0befe14e49d703258cb4b2bda15e4';

export interface DealerUser {
  id: number;
  email: string;
  name: string;
  role: string;
  dealerStatus?: string;
  phone?: string | null;
  profileImage?: string | null;
}

const USER_KEY = 'dealvatar_user';

export async function saveUser(user: DealerUser) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function loadUser(): Promise<DealerUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearUser() {
  await AsyncStorage.removeItem(USER_KEY);
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': INTERNAL_KEY,
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || '요청에 실패했습니다.');
  return data;
}

export async function login(email: string, password: string): Promise<DealerUser> {
  const data = await request('/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data;
}

export interface DealerRegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  dealerLicenseUrl: string;
  businessRegUrl?: string;
  businessNumber?: string;
  companyName?: string;
}

export async function registerDealer(data: DealerRegisterData): Promise<DealerUser> {
  return request('/users/register', {
    method: 'POST',
    body: JSON.stringify({ ...data, role: 'dealer' }),
  });
}

// 승인대기 화면에서 최신 dealerStatus만 다시 확인할 때 사용 — 로그인 재시도 없이 갱신.
export async function fetchUserByEmail(email: string): Promise<DealerUser> {
  return request(`/users/by-email?email=${encodeURIComponent(email)}`);
}

const PARTNER_INSPECTION_SOURCE = 'DEALER_PARTNER_INSPECTION';

export interface PartnerInspectionRequest {
  id: number;
  status: string;
  carNumber: string;
  carModel?: string | null;
  address: string;
  detailAddress?: string | null;
  preferredDateTime: string;
  listingUrl?: string | null;
  createdAt: string;
}

// 딜러가 개인적으로 사려는 차량을 카비어 검차에 신청 — 일반 구매동행(/inspection)과 같은
// 접수 엔드포인트를 쓰되 source로 딜러 신청 건임을 구분한다.
export function submitPartnerInspection(data: {
  carNumber: string;
  carModel?: string;
  contact: string;
  address: string;
  detailAddress?: string;
  preferredDateTime: string;
  listingUrl?: string;
}) {
  return request('/external/request', {
    method: 'POST',
    body: JSON.stringify({ ...data, source: PARTNER_INSPECTION_SOURCE, privacyAgreed: true }),
  });
}

export async function fetchMyPartnerInspections(contact: string): Promise<PartnerInspectionRequest[]> {
  const data = await request(`/external/request/list?source=${PARTNER_INSPECTION_SOURCE}&contact=${encodeURIComponent(contact)}`);
  return Array.isArray(data) ? data : [];
}

// 딜러 본인이 (가끔) 스마트옥션에 올린 매물 상태 조회 — cavior 웹 마이페이지와 같은 엔드포인트.
// 자기 userId로만 조회하는 구조라 딜바타에서도 별도 신규 백엔드 없이 그대로 재사용 가능.
export async function fetchMyStoreItems(userId: number): Promise<StoreItem[]> {
  const data = await request(`/admin/store-items/my?userId=${userId}`);
  return Array.isArray(data) ? data : [];
}

export interface MyBid {
  id: number;
  storeItemId: number;
  amount: number;
  createdAt: string;
  isWinning: boolean;
  item: {
    id: number;
    carNumber: string;
    titleKo: string;
    photos: Record<string, string[]>;
    status: string;
    priceKRW: number;
    auctionEndAt: string | null;
    visitScheduledAt: string | null;
    priceAdjustmentAmount: number | null;
    priceAdjustmentReason: string | null;
    priceAdjustmentConfirmed: boolean;
  } | null;
}

export function fetchMyBids(dealerId: number): Promise<MyBid[]> {
  return request(`/external/bids/my?dealerId=${dealerId}`);
}

export interface DealerPenalty {
  id: number;
  reason: string;
  note: string | null;
  expiresAt: string;
}

export function fetchPenaltyStatus(dealerId: number): Promise<{ penalized: boolean; penalties: DealerPenalty[] }> {
  return request(`/external/dealers/${dealerId}/penalty-status`);
}

export function confirmWinner(storeItemId: number, dealerId: number) {
  return request(`/external/store-items/${storeItemId}/confirm-winner`, {
    method: 'PATCH',
    body: JSON.stringify({ dealerId }),
  });
}

export interface StoreItem {
  id: number;
  carNumber: string;
  titleKo: string;
  titleEn?: string;
  trim?: string;
  year?: number;
  mileage?: number;
  fuel?: string;
  displacement?: string;
  transmission?: string;
  colorKo?: string;
  category?: string;
  region?: string;
  accident?: boolean;
  priceKRW: number;
  photos: Record<string, string[]>;
  specs?: { label: string; value: string }[];
  options?: string[];
  status: string;
  auctionEndAt: string | null;
  visitScheduledAt?: string | null;
  priceAdjustmentAmount?: number | null;
  priceAdjustmentReason?: string | null;
  priceAdjustmentConfirmed?: boolean;
}

export interface ItemBid {
  id: number;
  dealerName: string;
  amount: number;
  createdAt: string;
}

export async function fetchActiveListings(): Promise<StoreItem[]> {
  const data: StoreItem[] = await request('/external/store-items');
  return Array.isArray(data) ? data : [];
}

export function fetchStoreItem(id: number): Promise<StoreItem> {
  return request(`/external/store-items/${id}`);
}

// 다른 딜러의 입찰 금액/이름은 절대 안 내려줌(경쟁입찰 담합 방지) — 총 인원수 + 내 입찰만.
export function fetchItemBids(id: number, dealerId?: number): Promise<{ count: number; myBids: ItemBid[] }> {
  const qs = dealerId != null ? `?dealerId=${dealerId}` : '';
  return request(`/external/store-items/${id}/bids${qs}`);
}

export function submitBid(storeItemId: number, dealerId: number, dealerName: string, amount: number) {
  return request(`/external/store-items/${storeItemId}/bid`, {
    method: 'POST',
    body: JSON.stringify({ dealerId, dealerName, amount }),
  });
}

export function scheduleVisit(storeItemId: number, dealerId: number, visitScheduledAt: string) {
  return request(`/external/store-items/${storeItemId}/visit-schedule`, {
    method: 'PATCH',
    body: JSON.stringify({ dealerId, visitScheduledAt }),
  });
}

export function requestPriceAdjustment(storeItemId: number, dealerId: number, amount: number, reason: string) {
  return request(`/external/store-items/${storeItemId}/price-adjustment`, {
    method: 'PATCH',
    body: JSON.stringify({ dealerId, amount, reason }),
  });
}

export function updatePushToken(userId: number, pushToken: string) {
  return request(`/users/${userId}/push-token`, {
    method: 'PATCH',
    body: JSON.stringify({ pushToken }),
  });
}

export function updateProfileImage(userId: number, profileImage: string) {
  return request(`/users/${userId}/admin-info`, {
    method: 'PATCH',
    body: JSON.stringify({ profileImage }),
  });
}

// 라이선스/프로필 사진 등 파일 업로드 공용 함수 — ChavatarApp의 FormData 업로드 패턴과 동일.
export async function uploadFile(uri: string, endpoint: '/users/upload-doc' | '/users/upload-logo' = '/users/upload-doc'): Promise<string> {
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'upload.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  formData.append('file', { uri, name: filename, type: `image/${ext === 'jpg' ? 'jpeg' : ext}` } as any);
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'x-internal-key': INTERNAL_KEY },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || '업로드에 실패했습니다.');
  return data.url;
}
