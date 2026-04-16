import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionIntro } from '../../components/primitives';
import { useTailoredStore } from '../../store/useTailoredStore';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const signInAdmin = useTailoredStore((state) => state.signInAdmin);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#0c0c0c,#1c1814)] px-4 py-20 text-tm-cream sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg rounded-[2.2rem] border border-white/10 bg-[rgba(245,237,226,0.06)] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <SectionIntro
          eyebrow="Admin login"
          title="Tailored Manor operations"
          body="Use a real Firebase Auth account with an approved Tailored Manor role. Access is enforced by both the client shell and backend rules."
          dark
        />
        <form
          className="mt-8 space-y-5"
          onSubmit={async (event: FormEvent) => {
            event.preventDefault();
            setError('');
            setLoading(true);
            const ok = await signInAdmin(form.email, form.password);
            setLoading(false);
            if (!ok) {
              setError('Sign-in failed. Confirm the account exists in Firebase Auth and has access.');
              return;
            }
            navigate('/admin/command-center');
          }}
        >
          <label className="block">
            <span className="mb-2 block font-dm text-[0.72rem] uppercase tracking-[0.22em] text-tm-cream/70">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-[1.1rem] border border-white/12 bg-white/6 px-4 py-4 text-sm text-tm-cream outline-none transition focus:border-tm-gold/50"
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-dm text-[0.72rem] uppercase tracking-[0.22em] text-tm-cream/70">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-[1.1rem] border border-white/12 bg-white/6 px-4 py-4 text-sm text-tm-cream outline-none transition focus:border-tm-gold/50"
              required
            />
          </label>
          {error ? (
            <p className="rounded-[1rem] border border-tm-error/30 bg-tm-error/10 px-4 py-3 font-dm text-sm text-tm-error">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-tm-gold px-6 py-4 font-dm text-[0.78rem] uppercase tracking-[0.24em] text-tm-charcoal disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Enter admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
