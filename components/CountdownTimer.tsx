import { useEffect, useState } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';

function format(ms: number): string {
  if (ms <= 0) return '마감';
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}일 ${h}시간 남음`;
  if (h > 0) return `${h}시간 ${m}분 남음`;
  if (m > 0) return `${m}분 ${s}초 남음`;
  return `${s}초 남음`;
}

// 1초마다 다시 그리는 살아있는 마감 카운트다운 — cavior 웹 CountdownTimer.tsx와 동일 개념.
export default function CountdownTimer({ endAt, style }: { endAt: string | null; style?: StyleProp<TextStyle> }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [endAt]);

  if (!endAt) return null;
  const ms = new Date(endAt).getTime() - now;
  return <Text style={style}>{format(ms)}</Text>;
}
