import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Check, CheckCircle2, ExternalLink, LockKeyhole, ShieldCheck } from 'lucide-react';
import { protectionChecks } from '../../../../shared/audits';
import { api, post } from '../lib/api';
import type { Dashboard } from '../lib/types';
import { Badge, Button, Card, ErrorState, LoadingState, PageHeader } from '../components/ui';

export default function ProtectPage() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState(false);
  const query = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/me/dashboard') });
  const client = useQueryClient();
  useEffect(() => { if (query.data && !dirty) setChecks(query.data.checklist ?? {}); }, [query.data, dirty]);
  const mutation = useMutation({ mutationFn: () => post<{ checks: Record<string, boolean>; score: number }>('/protect/update', { checks }), onSuccess: () => { setDirty(false); void client.invalidateQueries({ queryKey: ['dashboard'] }); } });
  const complete = protectionChecks.filter(item => checks[item.id]).length;
  function change(id: string, value: boolean) { setChecks(previous => ({ ...previous, [id]: value })); setDirty(true); mutation.reset(); }
  return <div className="page protect-page"><PageHeader eyebrow="STRONGER ACCOUNTS. SMALLER WORRIES." title="Lock in the good habits." description="A guided review of your Google account security. You stay in control."><Badge tone="info"><ExternalLink size={12} />Official Google links</Badge></PageHeader>
    <Card className="protect-overview"><span className="protect-emblem"><ShieldCheck size={40} strokeWidth={1.3} /></span><div><span className="eyebrow">ACCOUNT SECURITY CHECKLIST</span><h2>{complete === protectionChecks.length ? 'That’s a solid foundation.' : 'Build a stronger front door.'}</h2><p>Review each setting in your own account, then mark what you’ve completed.</p></div><div className="protect-completion"><strong className="mono">{complete}<span> / {protectionChecks.length}</span></strong><span>habits checked</span><div className="progress-track"><span style={{ width: complete / protectionChecks.length * 100 + '%' }} /></div></div></Card>
    {query.isPending && <LoadingState label="Loading your checklist…" />}{query.error && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
    <div className="protection-list">{protectionChecks.map((item, index) => <Card className={'protection-item' + (checks[item.id] ? ' checked' : '')} key={item.id}><label className="protect-check"><input type="checkbox" checked={Boolean(checks[item.id])} onChange={event => change(item.id, event.target.checked)} /><span>{checks[item.id] ? <Check size={19} /> : String(index + 1).padStart(2, '0')}</span><span className="sr-only">Mark {item.title} complete</span></label><div><h2>{item.title}</h2><p>{item.description}</p><a href={item.url} target="_blank" rel="noopener noreferrer" className="text-link">Review in Google <ArrowUpRight size={14} /><span className="sr-only"> (opens in a new tab)</span></a></div>{checks[item.id] && <Badge tone="low"><CheckCircle2 size={12} />Reviewed</Badge>}</Card>)}</div>
    <div className="protect-save"><p><LockKeyhole size={14} />Self-reported only. Sentinel cannot see or change your Google settings.</p><Button disabled={!dirty || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? 'Saving…' : 'Save my progress'}<Check size={16} /></Button></div>{mutation.error && <ErrorState error={mutation.error} onRetry={() => mutation.mutate()} />}{mutation.isSuccess && <p className="success-note" role="status"><CheckCircle2 size={16} />Your checklist is saved. Your dashboard reflects these habits.</p>}
  </div>;
}
