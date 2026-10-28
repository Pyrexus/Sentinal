import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Check, CheckCircle2, CircleHelp, FlaskConical, Mail, MessageSquare, MousePointer2, RotateCcw, Shield, ShieldAlert, Smartphone, Sparkles, X, Zap } from 'lucide-react';
import { api, post } from '../lib/api';
import type { LabResult, LabScenario } from '../lib/types';
import { Badge, Button, Card, ErrorState, LoadingState, PageHeader } from '../components/ui';

function MessageHotspots({ scenario, selected, toggle, disabled }: { scenario: LabScenario; selected: string[]; toggle: (id: string) => void; disabled: boolean }) {
  const parts = useMemo(() => {
    const ranges: { start: number; end: number; id: string }[] = [];
    for (const hotspot of scenario.hotspots) {
      const start = scenario.message.indexOf(hotspot.text);
      if (start >= 0 && hotspot.text.length && !ranges.some(range => start < range.end && start + hotspot.text.length > range.start)) ranges.push({ start, end: start + hotspot.text.length, id: hotspot.id });
    }
    const result: { text: string; id?: string }[] = [];
    let cursor = 0;
    for (const range of ranges.sort((a, b) => a.start - b.start)) {
      result.push({ text: scenario.message.slice(cursor, range.start) });
      result.push({ text: scenario.message.slice(range.start, range.end), id: range.id });
      cursor = range.end;
    }
    result.push({ text: scenario.message.slice(cursor) });
    return result;
  }, [scenario]);
  return <div className="lab-message-content">{parts.map((part, index) => part.id ? <button type="button" key={index} disabled={disabled} aria-pressed={selected.includes(part.id)} className={'hotspot' + (selected.includes(part.id) ? ' selected' : '')} onClick={() => toggle(part.id!)}>{part.text}</button> : <span key={index}>{part.text}</span>)}</div>;
}

export default function LabPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const radarId = searchParams.get('radarId');
  const [selected, setSelected] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<'safe' | 'scam' | null>(null);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['lab', radarId], queryFn: () => api<LabScenario>('/lab/next' + (radarId ? '?radarId=' + encodeURIComponent(radarId) : '')), staleTime: 60000, refetchOnWindowFocus: false, refetchOnReconnect: false });
  const submit = useMutation({ mutationFn: () => post<LabResult>('/lab/submit', { scenarioId: query.data!.id, verdict, selectedHotspots: selected }), onSuccess: () => { void client.invalidateQueries({ queryKey: ['dashboard'] }); } });
  function toggle(id: string) { setSelected(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]); }
  async function nextRound() {
    submit.reset(); setSelected([]); setVerdict(null);
    if (radarId) setSearchParams({});
    else await query.refetch();
  }
  const scenario = query.data;
  const result = submit.data;
  return <div className="page lab-page"><PageHeader eyebrow="PRACTICE HERE. SPOT IT OUT THERE." title="The Phishing Lab" description="A safe place to make mistakes and sharpen your judgement."><Link to="/learn" className="button button-secondary">Learn the basics <ArrowRight size={15} /></Link></PageHeader>
    <div className="lab-intro-strip"><span><FlaskConical size={17} />Fictional scenarios only</span><span><Shield size={16} />No real links or payments</span><span><Zap size={16} />Build skills. Earn XP.</span></div>
    {query.isPending && <LoadingState label="Preparing a practice round…" />}{query.error && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
    {scenario && <div className="lab-layout"><div className="lab-main"><Card className="scenario-card"><div className="scenario-topline"><span className="eyebrow">{radarId ? 'FROM THE SCAM RADAR' : 'YOUR PRACTICE ROUND'}</span><Badge tone="info">{['', 'Getting started', 'Building confidence', 'A closer look'][scenario.difficulty]}</Badge></div><h2>{scenario.title}</h2><p className="scenario-instructions"><MousePointer2 size={15} />Tap the underlined parts that feel suspicious. Then choose your verdict.</p>
      <div className={'message-simulation channel-' + scenario.channel}><div className="simulation-header"><span className="simulation-avatar">{scenario.channel === 'email' ? <Mail size={21} /> : scenario.channel === 'login' ? <Shield size={21} /> : <MessageSquare size={21} />}</span><div><strong>{scenario.sender}</strong><span>{scenario.channel === 'email' ? 'Inbox · Sample email' : scenario.channel === 'login' ? 'Sample login screen' : scenario.channel === 'upi' ? 'Sample payment notice' : 'Sample message'}</span></div><Smartphone size={18} className="muted" /></div>{scenario.subject && <h3 className="message-subject">{scenario.subject}</h3>}<MessageHotspots scenario={scenario} selected={selected} toggle={toggle} disabled={Boolean(result) || submit.isPending} /><div className="simulation-footer"><Shield size={11} />FICTIONAL TRAINING EXAMPLE · LINKS ARE NOT CLICKABLE</div></div>
      <div className="selected-count"><span>{selected.length} {selected.length === 1 ? 'part' : 'parts'} selected</span>{!result && <button onClick={() => setSelected([])} className="text-link muted" disabled={!selected.length}><RotateCcw size={12} />Reset selection</button>}</div>
      {!result && <><h3 className="verdict-question">What’s your verdict?</h3><div className="verdict-choices"><button aria-pressed={verdict === 'safe'} className={verdict === 'safe' ? 'selected safe' : ''} onClick={() => setVerdict('safe')} disabled={submit.isPending}><Shield size={23} /><div><strong>Looks safe</strong><span>No strong warning signs</span></div>{verdict === 'safe' && <Check size={17} />}</button><button aria-pressed={verdict === 'scam'} className={verdict === 'scam' ? 'selected scam' : ''} onClick={() => setVerdict('scam')} disabled={submit.isPending}><ShieldAlert size={23} /><div><strong>Looks like a scam</strong><span>I would pause and verify</span></div>{verdict === 'scam' && <Check size={17} />}</button></div><Button className="full-width submit-verdict" onClick={() => submit.mutate()} disabled={!verdict || submit.isPending}>{submit.isPending ? 'Checking your instincts…' : 'Check my answer'}<ArrowRight size={16} /></Button></>}
    </Card>{submit.error && <ErrorState error={submit.error} onRetry={() => submit.mutate()} />}
    {result && <motion.div className="stack lab-results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} role="status"><Card className={'round-result ' + (result.correct ? 'correct' : 'incorrect')}><span className="round-result-icon">{result.correct ? <CheckCircle2 size={35} /> : <CircleHelp size={35} />}</span><div><span className="eyebrow">{result.correct ? 'GOOD INSTINCTS' : 'THIS IS HOW WE LEARN'}</span><h2>{result.correct ? 'You spotted the pattern.' : 'A useful one to remember.'}</h2><p>{result.explanation}</p></div><div className="xp-award"><Zap size={17} /><strong>+{result.xpAwarded}</strong><span>XP earned</span></div></Card><Card className="feedback-card"><div className="card-heading"><span><SearchIcon />Let’s look at the details</span><Badge>{result.score} / 100</Badge></div>{result.hotspots.map(hotspot => <div key={hotspot.id} className="hotspot-feedback"><span className={hotspot.suspicious ? 'severity-high' : 'severity-low'}>{hotspot.suspicious ? <ShieldAlert size={18} /> : <Shield size={18} />}</span><div><h3>{hotspot.text ?? scenario.hotspots.find(item => item.id === hotspot.id)?.text}</h3><p>{hotspot.explanation}</p><small>{selected.includes(hotspot.id) ? hotspot.suspicious ? 'You noticed this warning sign.' : 'You flagged this, but it is not a warning sign by itself.' : hotspot.suspicious ? 'Worth noticing next time.' : 'You correctly left this unmarked.'}</small></div>{selected.includes(hotspot.id) === hotspot.suspicious ? <Check size={17} className="accent-text" /> : <X size={17} className="muted" />}</div>)}</Card><Button onClick={() => void nextRound()} disabled={query.isFetching}>Try another round <ArrowRight size={16} /></Button></motion.div>}
    </div><aside className="lab-aside"><Card className="lab-guide"><span className="aside-icon"><Sparkles size={23} /></span><h3>Notice the nudge.</h3><p>Scams often push you to act before you think. Look beyond how polished a message seems.</p><ol><li><strong>Who’s asking?</strong><span>A familiar name alone is not proof of identity.</span></li><li><strong>What do they want?</strong><span>Money, a code, a password, or a rushed decision?</span></li><li><strong>Can you verify?</strong><span>Use a trusted app or address you find independently.</span></li></ol></Card><p className="aside-footnote"><LockIcon />This is practice, not a test of your worth. Every round is a chance to learn.</p></aside></div>}
  </div>;
}
function SearchIcon() { return <MousePointer2 size={17} />; }
function LockIcon() { return <Shield size={14} />; }
