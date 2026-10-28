import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Auth, User } from '@firebase/auth';
import { api, setTokenGetter } from './api';
import type { PublicConfig } from './types';

type Session = { demo: boolean; encryptedSave: boolean; authEnabled: boolean; user: User | null; signIn: () => Promise<void>; signOut: () => Promise<void>; loading: boolean };
const Context = createContext<Session>({ demo: true, encryptedSave: false, authEnabled: false, user: null, signIn: async () => {}, signOut: async () => {}, loading: true });

export function SessionProvider({ children }: { children: ReactNode }) {
  const config = useQuery({ queryKey: ['config'], queryFn: () => api<PublicConfig>('/config'), staleTime: Infinity, retry: 1 });
  const [auth, setAuth] = useState<Auth | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(false);
  const client = useQueryClient();
  useEffect(() => {
    if (!config.data?.firebase) return;
    const firebase = config.data.firebase;
    let unsubscribe: (() => void) | undefined;
    let disposed = false;
    setInitializing(true);
    void Promise.all([import('@firebase/app'), import('@firebase/auth')]).then(([appModule, authModule]) => {
      if (disposed) return;
      const app = appModule.getApps()[0] ?? appModule.initializeApp(firebase);
      const instance = authModule.getAuth(app);
      setAuth(instance);
      setTokenGetter(() => instance.currentUser?.getIdToken() ?? Promise.resolve(null));
      unsubscribe = authModule.onAuthStateChanged(instance, next => {
        setUser(next);
        setInitializing(false);
        void client.invalidateQueries();
      });
    }).catch(() => { if (!disposed) setInitializing(false); });
    return () => { disposed = true; unsubscribe?.(); };
  }, [config.data?.firebase, client]);
  async function signIn() {
    if (!auth) throw new Error('Google sign-in is not configured yet. You can explore Demo mode now.');
    const { signInWithPopup, GoogleAuthProvider } = await import('@firebase/auth');
    await signInWithPopup(auth, new GoogleAuthProvider());
  }
  async function signOut() {
    if (auth) await (await import('@firebase/auth')).signOut(auth);
    client.clear();
    window.location.assign('/');
  }
  return <Context.Provider value={{ demo: config.data?.demo ?? true, encryptedSave: config.data?.features?.encryptedSave ?? false, authEnabled: Boolean(config.data?.firebase), user, signIn, signOut, loading: config.isPending || initializing }}>{config.isPending ? <div className="boot-screen" role="status"><span className="boot-mark">S</span><strong>sentinel<span>.</span></strong><p>Opening your safety workspace…</p></div> : children}</Context.Provider>;
}
export const useSession = () => useContext(Context);
