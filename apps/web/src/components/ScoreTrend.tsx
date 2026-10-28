import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDate } from './ui';

export default function ScoreTrend({ data }: { data: { date: string; score: number }[] }) {
  return <ResponsiveContainer width="100%" height={170}><AreaChart data={data} margin={{ top: 18, right: 10, bottom: 0, left: -32 }}><XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={value => formatDate(String(value))} /><YAxis domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickCount={3} /><Tooltip contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} /><Area type="monotone" dataKey="score" name="Safety score" stroke="var(--accent)" fill="var(--accent-soft)" strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer>;
}
