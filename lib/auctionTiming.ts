// cavior 웹 components/auction/shared.ts와 동일한 임계값 — 딜바타 경매장 필터/뱃지에서 재사용.
export const URGENT_MS = 6 * 60 * 60 * 1000; // 마감 6시간 전부터 "마감임박"
export const NEW_MS = 12 * 60 * 60 * 1000; // 시작 12시간 이내면 "신규매물"

export function isUrgent(auctionEndAt: string | null | undefined): boolean {
  if (!auctionEndAt) return false;
  const diff = new Date(auctionEndAt).getTime() - Date.now();
  return diff > 0 && diff <= URGENT_MS;
}

export function msLeft(auctionEndAt: string | null | undefined): number | null {
  if (!auctionEndAt) return null;
  return new Date(auctionEndAt).getTime() - Date.now();
}
