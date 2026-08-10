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

export function fetchItemBids(id: number): Promise<ItemBid[]> {
  return request(`/external/store-items/${id}/bids`);
}

export function submitBid(storeItemId: number, dealerId: number, dealerName: string, amount: number) {
  return request(`/external/store-items/${storeItemId}/bid`, {
    method: 'POST',
    body: JSON.stringify({ dealerId, dealerName, amount }),
  });
}
