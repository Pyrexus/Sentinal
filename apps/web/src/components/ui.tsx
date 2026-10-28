import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { AlertCircle, ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '../lib/api';

export function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={'card ' + className} {...props}>{children}</div>;
}
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' };
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className = '', variant = 'primary', size = 'md', type = 'button', ...props }, ref) {
  return <button ref={ref} className={'button button-' + variant + (size === 'sm' ? ' button-sm ' : ' ') + className} type={type} {...props} />;
});
export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: string; className?: string }) {
  return <span className={'badge badge-' + tone.toLowerCase() + ' ' + className}>{children}</span>;
}
export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: ReactNode }) {
  return <div className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{children && <div className="page-header-actions">{children}</div>}</div>;
}
export function EmptyState({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="empty-state"><ShieldCheck size={30} strokeWidth={1.3} /><h3>{title}</h3><p>{description}</p>{children}</div>;
}
export function LoadingState({ label = 'Preparing your safety workspace…' }: { label?: string }) {
  return <div className="loading-state" role="status"><div><LoaderCircle className="spin" size={20} /><span>{label}</span></div><div className="skeleton-grid"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div></div>;
}
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const needsSignIn = error instanceof ApiError && error.status === 401;
  return <Card className="error-state" role="alert"><AlertCircle size={22} /><div><h3>{needsSignIn ? 'Make this workspace yours' : 'A small interruption'}</h3><p>{error instanceof Error ? error.message : 'Please try again in a moment.'}</p></div>{needsSignIn ? <Link className="button button-secondary" to="/settings">Sign in to continue <ArrowRight size={15} /></Link> : onRetry && <Button variant="secondary" onClick={onRetry}>Try again <ArrowRight size={15} /></Button>}</Card>;
}
export function SourceLabel({ source }: { source: string }) {
  return <span className="source-label"><span className="source-dot" />{source === 'gemini' ? 'AI-assisted check' : source === 'heuristic' ? 'Basic check (AI unavailable)' : 'Fictional sample'}</span>;
}
export function formatDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.valueOf()) ? date : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(parsed);
}
