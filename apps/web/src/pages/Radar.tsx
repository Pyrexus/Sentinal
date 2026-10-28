import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Clock3, FlaskConical, LockKeyhole, Radar, Search, Shield, Sparkles, Users } from 'lucide-react';
import { api } from '../lib/api';
import type { RadarItem } from '../lib/types';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, formatDate } from '../components/ui';

function RadarCard({ item, index }: { item: RadarItem; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return <motion.article className={'card radar-card radar-' + item.severity} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.25) }}>
    <div className="radar-card-top"><span className={'radar-type-icon severity-' + item.severity}><Shield size={21} /></span><Badge tone={item.severity}>{item.severity} concern</Badge><span className="radar-date mono"><Clock3 size={12} />{formatDate(item.date)}</span></div>
    <p className="eyebrow radar-category">{item.type}</p><h2>{item.title}</h2><p className="radar-summary">{item.howItWorks}</p>
    <div className="radar-audience"><Users size={13} /><span>{item.targetAudience}</span></div>
    <div className="fictional-label"><Sparkles size={12} />{item.source === 'gemini' ? 'AI-generated awareness sample (fictional)' : 'Hand-written awareness sample (fictional)'}</div>
    <button className="radar-expand" aria-expanded={open} onClick={() => setOpen(!open)}><span>{open ? 'Hide the details' : 'Know the signs'}</span><ChevronDown size={17} className={open ? 'rotate' : ''} /></button>
    <AnimatePresence initial={false}>{open && <motion.div className="radar-detail" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 250, damping: 30 }}><div className="sample-message"><span className="eyebrow">FICTIONAL SAMPLE MESSAGE</span><blockquote>{item.sampleMessage}</blockquote></div><div className="radar-advice"><div><h3>Red flags to notice</h3><ul className="signal-list">{item.redFlags.map(flag => <li key={flag}>{flag}</li>)}</ul></div><div><h3>How to stay safe</h3><ul className="safe-list">{item.staySafe.map(step => <li key={step}>{step}</li>)}</ul></div></div><Link className="button button-secondary full-width" to={'/lab?radarId=' + encodeURIComponent(item.id)}><FlaskConical size={16} />Test yourself on this pattern <ArrowRight size={16} /></Link></motion.div>}</AnimatePresence>
  </motion.article>;
}

export default function RadarPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [admin, setAdmin] = useState(false);
  const [secret, setSecret] = useState('');
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['radar'], queryFn: () => api<{ items: RadarItem[] }>('/radar') });
  const generate = useMutation({ mutationFn: () => api('/radar/generate', { method: 'POST', headers: { 'X-Admin-Secret': secret }, body: '{}' }), onSuccess: () => { setSecret(''); void client.invalidateQueries({ queryKey: ['radar'] }); } });
  const items = query.data?.items.filter(item => (filter === 'all' || item.severity === filter) && (item.title + item.type + item.howItWorks).toLowerCase().includes(search.toLowerCase())) ?? [];
  return <div className="page radar-page"><PageHeader eyebrow="RECOGNISE THE PATTERN. BREAK THE CYCLE." title="Scam Radar" description="A field guide to the tricks behind suspicious messages."><span className="status-badge"><span className="status-dot" />Daily awareness feed</span></PageHeader>
    <div className="radar-banner"><div className="radar-orbit" aria-hidden="true"><i /><i /><i /><Radar size={31} /></div><div><span className="eyebrow">STAY CURIOUS. STAY ONE STEP AHEAD.</span><h2>New stories. Familiar red flags.</h2><p>Learn how scams work before one lands in your inbox. Every example here is fictional and designed for practice.</p></div><Shield size={62} strokeWidth={0.6} className="radar-banner-shield" /></div>
    <div className="feed-toolbar"><div className="filter-pills" aria-label="Filter by concern level">{['all', 'high', 'medium', 'low'].map(value => <button key={value} className={filter === value ? 'active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? 'All patterns' : value + ' concern'}{value === 'all' && query.data && <span>{query.data.items.length}</span>}</button>)}</div><label className="search-field"><Search size={16} /><input aria-label="Search scam patterns" placeholder="Search patterns…" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
    {query.isPending && <LoadingState label="Loading awareness samples…" />}{query.error && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
    <div className="radar-grid">{items.map((item, index) => <RadarCard key={item.id} item={item} index={index} />)}</div>
    {!query.isPending && !query.error && !items.length && <EmptyState title="No patterns match that search." description="Try another word or show all concern levels."><Button variant="secondary" onClick={() => { setFilter('all'); setSearch(''); }}>Clear filters</Button></EmptyState>}
    <div className="radar-admin"><button className="text-link muted" onClick={() => setAdmin(!admin)} aria-expanded={admin}><LockKeyhole size={13} />Feed administration <ChevronDown size={13} /></button>{admin && <Card className="admin-panel"><h3>Generate today’s awareness samples</h3><p>For administrators with a configured secret. The feed keeps its existing samples if generation is unavailable.</p><form onSubmit={event => { event.preventDefault(); generate.mutate(); }}><label htmlFor="admin-secret" className="sr-only">Admin secret</label><input id="admin-secret" type="password" autoComplete="off" value={secret} onChange={event => setSecret(event.target.value)} placeholder="Admin secret" /><Button type="submit" disabled={!secret || generate.isPending}>{generate.isPending ? 'Generating…' : 'Generate now'}<Sparkles size={15} /></Button></form>{generate.error && <ErrorState error={generate.error} />}{generate.isSuccess && <p className="success-note" role="status">Feed refreshed. Available samples are shown above.</p>}</Card>}</div>
  </div>;
}
