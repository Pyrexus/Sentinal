import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Check, CheckCircle2, ChevronDown, CircleHelp, FileText, Fingerprint, Link2, LockKeyhole, Search, Shield, ShieldAlert, Sparkles, X } from 'lucide-react';
import { post } from '../lib/api';
import { useSession } from '../lib/session';
import type { Analysis, Severity } from '../lib/types';
import { Badge, Button, Card, ErrorState, PageHeader, SourceLabel } from '../components/ui';

const samples = [
  { label: 'Urgent KYC request', content: 'Bharat Trust Bank: Your account will be blocked in 30 minutes. Complete KYC at https://bt-bank-kyc.example and share your OTP to avoid suspension.' },
  { label: 'Scholarship offer', content: 'Congratulations! You have been selected for a ₹25,000 Vidya Plus scholarship. Pay a refundable registration fee of ₹499 immediately at https://vidya-awards.example to claim your reward.' },
  { label: 'A harmless reminder', content: 'Hi! Our study group is meeting in the college library at 4 pm tomorrow. Please bring your notes. No payment or personal details needed.' },
];

export function HighlightedMessage({ content, flags }: { content: string; flags: Analysis['redFlags'] }) {
  const parts = useMemo(() => {
    const ranges: { start: number; end: number; severity: Severity; explanation: string }[] = [];
    for (const flag of [...flags].sort((a, b) => b.text.length - a.text.length)) {
      if (!flag.text.trim()) continue;
      let start = content.toLowerCase().indexOf(flag.text.toLowerCase());
      while (start >= 0) {
        const end = start + flag.text.length;
        if (!ranges.some(range => start < range.end && end > range.start)) ranges.push({ start, end, severity: flag.severity, explanation: flag.reason });
        start = content.toLowerCase().indexOf(flag.text.toLowerCase(), end);
      }
    }
    ranges.sort((a, b) => a.start - b.start);
    const result: { text: string; severity?: Severity; explanation?: string }[] = [];
    let index = 0;
    for (const range of ranges) {
      if (range.start > index) result.push({ text: content.slice(index, range.start) });
      result.push({ text: content.slice(range.start, range.end), severity: range.severity, explanation: range.explanation });
      index = range.end;
    }
    result.push({ text: content.slice(index) });
    return result;
  }, [content, flags]);
  return <p className="highlighted-message">{parts.map((part, index) => part.severity ? <motion.mark key={index} className={'flag-highlight flag-' + part.severity} title={part.explanation} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.065, duration: 0.35 }}>{part.text}</motion.mark> : <span key={index}>{part.text}</span>)}</p>;
}

function MicroLesson({ analysis }: { analysis: Analysis }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const choices = ['Use the link in the message to check quickly.', 'Open the official app or website independently and verify there.', 'Reply with an OTP to prove the account belongs to me.'];
  return <Card className="micro-lesson"><button className="lesson-toggle" onClick={() => setOpen(!open)} aria-expanded={open}><span className="lesson-toggle-icon"><Sparkles size={19} /></span><span><strong>Why is this suspicious?</strong><small>Turn this check into a 30-second lesson.</small></span><ChevronDown size={19} className={open ? 'rotate' : ''} /></button><AnimatePresence>{open && <motion.div className="micro-lesson-content" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><p>{analysis.redFlags[0]?.reason ?? 'A message with few visible red flags can still be deceptive. Context and independent verification matter.'}</p><h3>What is the safest next step?</h3><div className="lesson-choices">{choices.map((choice, index) => <button key={choice} className={'lesson-choice' + (answer === index ? index === 1 ? ' correct' : ' incorrect' : '')} onClick={() => setAnswer(index)}><span className="choice-letter">{String.fromCharCode(65 + index)}</span>{choice}{answer === index && (index === 1 ? <Check size={16} /> : <X size={16} />)}</button>)}</div>{answer !== null && <p className={'lesson-feedback ' + (answer === 1 ? 'accent-text' : 'muted')} role="status">{answer === 1 ? 'That’s it. A trusted route gives you control. Never share an OTP, PIN, or CVV.' : 'Pause and try again. A link or reply in the suspicious message keeps you inside its instructions.'}</p>}</motion.div>}</AnimatePresence></Card>;
}

export default function AnalyzePage() {
  const session = useSession();
  const location = useLocation();
  const initial = (location.state as { content?: string } | null)?.content ?? '';
  const [content, setContent] = useState(initial);
  const [kind, setKind] = useState<'text' | 'url'>(/^https?:\/\/\S+$/.test(initial) ? 'url' : 'text');
  const [save, setSave] = useState(false);
  const [submitted, setSubmitted] = useState('');
  const [scanPhase, setScanPhase] = useState(0);
  const [showExplanation, setShowExplanation] = useState(true);
  const reduced = useReducedMotion();
  const resultRef = useRef<HTMLDivElement>(null);
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (payload: { type: 'text' | 'url'; content: string; save: boolean }) => {
      const [result] = await Promise.all([post<Analysis>('/analyze', payload), new Promise(resolve => setTimeout(resolve, reduced ? 0 : 1650))]);
      return result;
    },
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
  useEffect(() => {
    if (!mutation.isPending) return;
    setScanPhase(0);
    const first = setTimeout(() => setScanPhase(1), 550);
    const second = setTimeout(() => setScanPhase(2), 1100);
    return () => { clearTimeout(first); clearTimeout(second); };
  }, [mutation.isPending]);
  useEffect(() => { if (mutation.data) resultRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }, [mutation.data, reduced]);
  const result = mutation.data;
  function submit() {
    if (!content.trim() || mutation.isPending) return;
    setSubmitted(content.trim());
    mutation.mutate({ type: kind, content: content.trim(), save: save && session.encryptedSave });
  }
  return <div className="page analyze-page">
    <PageHeader eyebrow="PAUSE BEFORE YOU PROCEED" title="A second look. A safer next step." description="Understand suspicious messages and links, without opening them."><Badge tone="low"><LockKeyhole size={12} />Private by default</Badge></PageHeader>
    <div className="analyzer-layout"><div className="analyzer-main"><Card className="analyzer-input-card">
      <div className="input-tabs" role="group" aria-label="What would you like to check?"><button aria-pressed={kind === 'text'} className={kind === 'text' ? 'active' : ''} onClick={() => setKind('text')}><FileText size={16} />Message</button><button aria-pressed={kind === 'url'} className={kind === 'url' ? 'active' : ''} onClick={() => setKind('url')}><Link2 size={16} />Link / URL</button><span className="mono">01 / INPUT</span></div>
      <div className={'message-input-wrap' + (mutation.isPending ? ' scanning' : '')}><label htmlFor="analyze-content" className="input-label">{kind === 'text' ? 'Paste the message you want to check' : 'Paste a URL to inspect its signals'}</label><textarea id="analyze-content" className="analyze-textarea" value={content} maxLength={4000} placeholder={kind === 'text' ? 'A strange SMS. A too-good-to-be-true offer. A message that asks you to act now.\n\nPaste it here. We’ll help you understand the signs.' : 'https://example.com/message-link'} onChange={event => setContent(event.target.value)} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') submit(); }} spellCheck={false} disabled={mutation.isPending} />{mutation.isPending && !reduced && <motion.div className="scan-beam" initial={{ top: '15%' }} animate={{ top: ['15%', '88%', '15%'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} aria-hidden="true" />}<span className="character-count mono">{content.length.toLocaleString()} / 4,000</span></div>
      <div className="sample-row"><span>Try a sample</span>{samples.map(item => <button key={item.label} disabled={mutation.isPending} onClick={() => { setContent(item.content); setKind('text'); mutation.reset(); }}>{item.label}<ArrowRight size={11} /></button>)}</div>
      <div className="analyzer-submit-row"><label className="save-checkbox"><input type="checkbox" disabled={!session.encryptedSave} checked={save && session.encryptedSave} onChange={event => setSave(event.target.checked)} /><span>Save this analysis<small>{session.encryptedSave ? 'Opt in to encrypted message storage.' : 'Encrypted saving is not enabled in this workspace.'}</small></span></label><Button disabled={!content.trim() || mutation.isPending} onClick={submit}>{mutation.isPending ? <><span className="button-spinner" />Checking signals…</> : <><Search size={17} />Analyze {kind === 'text' ? 'message' : 'link'}<ArrowRight size={16} /></>}</Button></div>
      <div className="input-privacy-note"><LockKeyhole size={12} /><span>Remove personal details before checking. Raw text is not stored unless you choose to save it. Sample messages are fictional.</span></div>
    </Card>
    <AnimatePresence>{mutation.isPending && <motion.div className="scan-status-card" role="status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Fingerprint size={30} className="scan-fingerprint" /><div><strong>{['Reading the message carefully', 'Looking for pressure, bait, and suspicious requests', 'Preparing clear, practical guidance'][scanPhase]}</strong><div className="scan-steps">{['Read', 'Identify', 'Explain'].map((step, index) => <span key={step} className={index <= scanPhase ? 'active' : ''}><span>{index < scanPhase ? <Check size={10} /> : index + 1}</span>{step}</span>)}</div></div><span className="status-dot" /></motion.div>}</AnimatePresence>
    {mutation.error && <ErrorState error={mutation.error} onRetry={submit} />}
    {result && !mutation.isPending && <motion.div ref={resultRef} className="analysis-results stack" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} aria-live="polite" tabIndex={-1}>
      <Card className={'verdict-card verdict-' + result.verdict.toLowerCase()}><div className="verdict-topline"><span className="eyebrow">02 / YOUR ANALYSIS</span><SourceLabel source={result.source} /></div><div className="verdict-main"><span className="verdict-icon">{result.verdict === 'Low' ? <Shield size={30} /> : <ShieldAlert size={30} />}</span><div><Badge tone={result.verdict}>{result.verdict} risk</Badge><h2>{result.verdict === 'High' ? 'There are strong signs to pause.' : result.verdict === 'Medium' ? 'A few things deserve a closer look.' : 'Fewer visible red flags. Stay aware.'}</h2><p>{result.category}</p></div><div className="risk-number mono"><strong>{result.riskScore}</strong><span>/ 100</span></div></div><div className="risk-scale"><motion.span initial={{ width: 0 }} animate={{ width: result.riskScore + '%' }} transition={{ duration: 0.9, delay: 0.15 }} /></div><div className="risk-scale-labels mono"><span>LOW RISK</span><span>MEDIUM</span><span>HIGH RISK</span></div></Card>
      <Card className="flagged-message-card"><div className="card-heading"><span><FileText size={16} />Your message, with signals highlighted</span><Badge>{result.redFlags.length} signals</Badge></div><HighlightedMessage content={submitted} flags={result.redFlags} /><div className="highlight-legend"><span><i className="legend-high" />High concern</span><span><i className="legend-medium" />Worth checking</span><span>Matching phrases only</span></div></Card>
      <Card className="explanation-card"><button className="explanation-heading" aria-expanded={showExplanation} onClick={() => setShowExplanation(!showExplanation)}><h3>What might be happening</h3><ChevronDown size={18} className={showExplanation ? 'rotate' : ''} /></button>{showExplanation && <><p>{result.explanation}</p><div className="flag-list">{result.redFlags.map((flag, index) => <div className="flag-row" key={index}><span className={'flag-number severity-' + flag.severity}>{String(index + 1).padStart(2, '0')}</span><div><div><strong>“{flag.text}”</strong><Badge tone={flag.severity}>{flag.severity}</Badge></div><p>{flag.reason}</p></div></div>)}</div></>}</Card>
      <Card className="next-steps-card"><div className="card-heading"><span><CheckCircle2 size={17} />What to do now</span><span className="eyebrow">SMALL, SAFE STEPS</span></div><ol>{result.nextSteps.map((step, index) => <li key={index}><span className="step-number mono">{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}</ol></Card>
      <div className="confidence-note"><CircleHelp size={18} /><div><strong className="capitalize">{result.confidence} confidence in this assessment</strong><p>{result.uncertainty || 'I can’t be certain from a message alone. Verify independently before sharing information or moving money.'}</p></div></div>
      {result.safeBrowsing && <Card className="safe-browsing-card"><Shield size={18} /><div><strong>Google Safe Browsing · separate signal</strong><span className="mono">{result.safeBrowsing.status.replaceAll('_', ' ')}</span><p>{result.safeBrowsing.detail}</p></div></Card>}
      {result.saved && <p className="success-note"><Check size={14} />You chose to save this message. It was stored encrypted.</p>}
      <MicroLesson key={submitted} analysis={result} />
    </motion.div>}
    </div><aside className="analyzer-aside"><Card className="how-check-works"><span className="aside-icon"><Search size={23} strokeWidth={1.3} /></span><h3>Clarity, not certainty.</h3><p>Sentinel looks for patterns that often appear in scams. It cannot prove a message is safe or unsafe.</p><div className="aside-divider" /><div className="aside-point"><span>01</span><div><strong>Signals, in plain language</strong><p>See what deserves your attention and why.</p></div></div><div className="aside-point"><span>02</span><div><strong>You stay in control</strong><p>Links are never opened or visited by our server.</p></div></div><div className="aside-point"><span>03</span><div><strong>A practical next step</strong><p>Verify safely, without feeling rushed.</p></div></div></Card><div className="always-remember"><span><AlertTriangle size={16} />Always remember</span><p>Never share an OTP, UPI PIN, password, or CVV. Receiving money does not require entering your UPI PIN.</p></div></aside></div>
  </div>;
}
