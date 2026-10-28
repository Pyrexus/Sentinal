import { lazy, Suspense, useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate, Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ArrowRight, BookOpen, ChevronDown, Command, Fingerprint, FlaskConical, LayoutDashboard, LogIn, Moon, Radar, Search, Settings, Shield, ShieldCheck, Sun, X } from 'lucide-react';
import { useSession } from './lib/session';
import { Button, LoadingState } from './components/ui';
import DashboardPage from './pages/Dashboard';

const AnalyzePage = lazy(() => import('./pages/Analyze'));
const RadarPage = lazy(() => import('./pages/Radar'));
const LabPage = lazy(() => import('./pages/Lab'));
const PrivacyPage = lazy(() => import('./pages/Privacy'));
const ProtectPage = lazy(() => import('./pages/Protect'));
const LearnPage = lazy(() => import('./pages/Learn'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const LimitationsPage = lazy(() => import('./pages/Limitations'));

const mainNav = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/analyze', label: 'Threat Analyzer', icon: Search },
  { to: '/radar', label: 'Scam Radar', icon: Radar },
  { to: '/lab', label: 'Phishing Lab', icon: FlaskConical },
];
const otherNav = [
  { to: '/privacy', label: 'Privacy Check', icon: Fingerprint },
  { to: '/protect', label: 'Account Security', icon: ShieldCheck },
  { to: '/learn', label: 'Learn Hub', icon: BookOpen },
];
const allNav = [...mainNav, ...otherNav, { to: '/settings', label: 'Settings & your data', icon: Settings }, { to: '/limitations', label: 'Privacy & limitations', icon: Shield }];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useSession();
  const [palette, setPalette] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('sentinel-theme') ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('sentinel-theme', theme); }, [theme]);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPalette(value => !value); }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
  useEffect(() => { if (!notice) return; const id = setTimeout(() => setNotice(''), 6500); return () => clearTimeout(id); }, [notice]);
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  async function signIn() { try { await session.signIn(); } catch (error) { setNotice(error instanceof Error ? error.message : 'Sign-in could not finish. Please try again.'); } }
  const routeLabel = allNav.find(item => item.to === location.pathname || (item.to === '/learn' && location.pathname.startsWith('/learn/')))?.label ?? 'Sentinel';
  const filteredNav = allNav.filter(item => item.label.toLowerCase().includes(search.toLowerCase()));
  return <div className="app-shell">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <aside className="sidebar" aria-label="Primary navigation">
      <Link to="/" className="brand"><span className="brand-mark"><Shield size={25} strokeWidth={1.6} /><span /></span><span>sentinel<span className="brand-period">.</span></span></Link>
      <div className="workspace-label"><span className="workspace-avatar">S</span><div><strong>Personal workspace</strong><span>Digital safety, every day</span></div><ChevronDown size={13} /></div>
      <button className="command-trigger" onClick={() => setPalette(true)}><Search size={15} /><span>Quick search</span><kbd>⌘ K</kbd></button>
      <p className="nav-heading">WORKSPACE</p>
      <nav>{mainNav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}><Icon size={18} /><span>{label}</span>{to === '/radar' && <span className="nav-live" />}</NavLink>)}</nav>
      <p className="nav-heading nav-heading-second">BUILD BETTER HABITS</p>
      <nav>{otherNav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom">
        <div className="sidebar-tip"><ShieldCheck size={20} /><h3>Pause. Check. Proceed.</h3><p>A moment of attention can make all the difference.</p><Link to="/learn">Build your instincts <ArrowRight size={13} /></Link></div>
        <NavLink to="/settings" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}><Settings size={18} />Settings & your data</NavLink>
        <Link to="/limitations" className="privacy-link">Privacy & limitations <ArrowRight size={12} /></Link>
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <div className="breadcrumb"><span className="desktop-only">Workspace</span><span className="breadcrumb-divider desktop-only">/</span><span>{routeLabel}</span></div>
        <div className="topbar-actions"><span className="status-badge"><span className={session.demo ? 'status-dot demo' : 'status-dot'} />{session.demo ? 'Demo mode' : 'Connected'}</span><button className="icon-button" aria-label={'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>{session.authEnabled && !session.user ? <Button variant="secondary" size="sm" onClick={() => void signIn()}><LogIn size={15} /><span className="desktop-only">Sign in</span></Button> : <Link to="/settings" className="avatar" aria-label="Open profile settings">{session.user?.displayName?.slice(0, 1).toUpperCase() ?? 'S'}</Link>}</div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <AnimatePresence mode="wait" initial={false}><motion.div key={location.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
          <Suspense fallback={<div className="page"><LoadingState /></div>}><Routes location={location}>
            <Route path="/" element={<DashboardPage />} /><Route path="/analyze" element={<AnalyzePage />} /><Route path="/radar" element={<RadarPage />} /><Route path="/lab" element={<LabPage />} /><Route path="/privacy" element={<PrivacyPage />} /><Route path="/protect" element={<ProtectPage />} /><Route path="/learn/*" element={<LearnPage />} /><Route path="/settings" element={<SettingsPage />} /><Route path="/limitations" element={<LimitationsPage />} />
            <Route path="*" element={<div className="page"><h1>This page is off the radar.</h1><p>Let’s get you back to your safety workspace.</p><Link to="/" className="button button-primary">Back to overview <ArrowRight size={16} /></Link></div>} />
          </Routes></Suspense>
        </motion.div></AnimatePresence>
        <footer className="workspace-footer"><span><Shield size={12} />Your safety, with a little more clarity.</span><Link to="/limitations">AI can make mistakes. Understand the limits <ArrowRight size={12} /></Link></footer>
      </main>
    </div>
    <nav className="mobile-nav" aria-label="Mobile navigation">{mainNav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={20} /><span>{label.replace('Threat ', '').replace('Scam ', '').replace('Phishing ', '')}</span></NavLink>)}<button onClick={() => setPalette(true)}><Command size={20} /><span>More</span></button></nav>
    <Dialog.Root open={palette} onOpenChange={setPalette}><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="command-dialog"><Dialog.Title className="sr-only">Navigate Sentinel</Dialog.Title><Dialog.Description className="sr-only">Search for a page, then select it to navigate.</Dialog.Description><div className="command-input"><Search size={20} /><input aria-label="Search pages" value={search} onChange={event => setSearch(event.target.value)} placeholder="Where would you like to go?" autoFocus /><Dialog.Close asChild><button className="icon-button" aria-label="Close navigation"><X size={18} /></button></Dialog.Close></div><div className="command-results">{filteredNav.map(({ to, label, icon: Icon }) => <button key={to} onClick={() => { navigate(to); setPalette(false); setSearch(''); }}><Icon size={18} /><span>{label}</span><ArrowRight size={15} /></button>)}{!filteredNav.length && <p className="muted">No matching pages. Try “privacy” or “learn”.</p>}</div><div className="command-footer"><span><Activity size={12} />A calmer digital life starts here.</span><kbd>ESC to close</kbd></div></Dialog.Content></Dialog.Portal></Dialog.Root>
    <AnimatePresence>{notice && <motion.div className="toast" role="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><span>{notice}</span><button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={16} /></button></motion.div>}</AnimatePresence>
  </div>;
}
