import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { LogoMark } from '../../components/primitives';
import { useTailoredStore } from '../../store/useTailoredStore';

const authHighlights = [
  {
    icon: ShieldCheck,
    title: 'Role-aware access',
    body: 'Only approved Tailored Manor roles can enter the admin workspace.',
  },
  {
    icon: LockKeyhole,
    title: 'Protected operations',
    body: 'Sensitive actions stay guarded by Firebase Auth, Firestore rules, and backend checks.',
  },
  {
    icon: Sparkles,
    title: 'Live business data',
    body: 'Products, operations, finance, and publishing all work from the same live system.',
  },
] as const;

function AdminAuthShell({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[#0f0c09] text-tm-cream">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(184,147,90,0.2),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(245,239,230,0.08),transparent_28%),linear-gradient(135deg,#0f0c09_0%,#15100d_44%,#110e0b_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/4 to-transparent" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1240px] items-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="grid w-full overflow-hidden rounded-[2.2rem] border border-white/8 bg-[rgba(18,14,11,0.58)] shadow-[0_30px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl lg:grid-cols-[minmax(0,1.05fr)_minmax(430px,0.95fr)]">
          <section className="relative overflow-hidden border-b border-white/8 bg-[linear-gradient(180deg,#18120e_0%,#14100d_52%,#100d0a_100%)] px-6 py-7 sm:px-8 sm:py-9 lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/5 to-transparent" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-5">
                  <div className="flex items-center gap-4">
                    <LogoMark inverted compact size={42} />
                    <div>
                      <p className="font-cormorant text-[1.05rem] uppercase tracking-[0.28em] text-tm-cream sm:text-[1.14rem]">
                        Tailored Manor
                      </p>
                      <p className="mt-1 text-[0.72rem] leading-5 text-tm-gold/82 sm:text-[0.76rem]">
                        Your Space Masterfully Tailored
                      </p>
                    </div>
                  </div>
                </div>
                <Link
                  to="/"
                  className="inline-flex min-h-11 items-center gap-2 rounded-[1rem] border border-white/8 bg-white/[0.04] px-4 py-3 text-[0.66rem] font-medium uppercase tracking-[0.2em] text-tm-cream/78 transition duration-200 ease-out hover:border-white/14 hover:bg-white/[0.07] hover:text-tm-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tm-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#15100d]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Website
                </Link>
              </div>

              <div className="mt-10 max-w-xl">
                <p className="text-[0.66rem] font-medium uppercase tracking-[0.28em] text-tm-gold/72">{eyebrow}</p>
                <h1 className="mt-4 font-cormorant text-[2.65rem] font-light leading-[0.94] tracking-[-0.03em] text-tm-cream sm:text-[3.2rem]">
                  Tailored Manor admin access with a calmer, more controlled entry point.
                </h1>
                <p className="mt-6 max-w-lg font-dm text-[0.97rem] leading-7 text-tm-cream/66 sm:text-[1rem]">
                  Move from sign-in to operations without friction. The experience stays refined, while the access layer stays strict.
                </p>
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-3 lg:mt-10 lg:grid-cols-1">
                {authHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-tm-gold/26 bg-tm-gold/10 text-tm-gold">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-[0.76rem] font-medium uppercase tracking-[0.16em] text-tm-cream">{item.title}</p>
                          <p className="mt-2 text-[0.78rem] leading-6 text-tm-cream/58">{item.body}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="bg-[linear-gradient(180deg,rgba(252,248,242,0.98)_0%,rgba(246,239,231,0.97)_100%)] px-6 py-7 text-tm-charcoal sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            <div className="mx-auto flex h-full max-w-[30rem] flex-col justify-center">
              <div className="rounded-[1.1rem] border border-black/7 bg-white/72 px-4 py-3 shadow-[0_10px_28px_rgba(12,12,12,0.04)] backdrop-blur-sm">
                <p className="text-[0.64rem] font-medium uppercase tracking-[0.24em] text-tm-warm-gray">{eyebrow}</p>
                <h2 className="mt-2 font-cormorant text-[2.05rem] font-light leading-none tracking-[-0.03em] text-tm-charcoal sm:text-[2.35rem]">
                  {title}
                </h2>
                <p className="mt-4 font-dm text-[0.95rem] leading-7 text-tm-warm-gray">{body}</p>
              </div>

              <div className="mt-6">{children}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function AdminLoginPage() {
  const navigate = useNavigate();
  const signInAdmin = useTailoredStore((state) => state.signInAdmin);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AdminAuthShell
      eyebrow="Admin login"
      title="Enter the Tailored Manor workspace"
      body="Use your approved Firebase account to enter the admin panel. Access is checked against both your sign-in and your assigned role."
    >
      <div className="rounded-[1.5rem] border border-black/7 bg-white/76 p-5 shadow-[0_18px_40px_rgba(18,14,11,0.05)] backdrop-blur-sm sm:p-6">
        <form
          className="space-y-5"
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
            <span className="mb-2 block font-dm text-[0.68rem] font-medium uppercase tracking-[0.24em] text-tm-warm-gray">Email</span>
            <div className="group flex min-h-[3.7rem] items-center gap-3 rounded-[1.15rem] border border-black/10 bg-[#fffdf9] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition duration-200 ease-out focus-within:border-tm-gold/45 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(184,147,90,0.08)]">
              <Mail className="h-4.5 w-4.5 shrink-0 text-tm-warm-gray transition group-focus-within:text-tm-gold" />
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="min-w-0 flex-1 border-none bg-transparent py-4 font-dm text-[0.96rem] text-tm-charcoal outline-none placeholder:text-tm-warm-gray/70"
                placeholder="owner@tailoredmanor.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="block">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="block font-dm text-[0.68rem] font-medium uppercase tracking-[0.24em] text-tm-warm-gray">Password</span>
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="inline-flex items-center gap-1 text-[0.67rem] font-medium uppercase tracking-[0.18em] text-tm-warm-gray transition hover:text-tm-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tm-gold/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f0e7]"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="group flex min-h-[3.7rem] items-center gap-3 rounded-[1.15rem] border border-black/10 bg-[#fffdf9] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition duration-200 ease-out focus-within:border-tm-gold/45 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(184,147,90,0.08)]">
              <LockKeyhole className="h-4.5 w-4.5 shrink-0 text-tm-warm-gray transition group-focus-within:text-tm-gold" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="min-w-0 flex-1 border-none bg-transparent py-4 font-dm text-[0.96rem] text-tm-charcoal outline-none placeholder:text-tm-warm-gray/70"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
          </label>

          {error ? (
            <p className="rounded-[1.15rem] border border-tm-error/20 bg-[rgba(176,59,46,0.07)] px-4 py-3 font-dm text-sm leading-6 text-[#9e4439]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[3.9rem] w-full items-center justify-center gap-2 rounded-[1.15rem] bg-tm-charcoal px-6 py-4 font-dm text-[0.76rem] font-medium uppercase tracking-[0.24em] text-tm-cream shadow-[0_16px_36px_rgba(12,12,12,0.14)] transition duration-200 ease-out hover:bg-[#17120e] disabled:cursor-not-allowed disabled:opacity-72"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Enter admin'}
          </button>

          <div className="rounded-[1.15rem] border border-black/7 bg-[#fcfaf6] px-4 py-4">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-tm-warm-gray">Access note</p>
            <p className="mt-2 font-dm text-[0.84rem] leading-6 text-tm-warm-gray">
              If sign-in succeeds but access is denied, the account likely exists in Firebase Auth without an allowed Tailored Manor role.
            </p>
          </div>
        </form>
      </div>
    </AdminAuthShell>
  );
}

export function AdminAuthLoadingPage() {
  return (
    <AdminAuthShell
      eyebrow="Admin access"
      title="Restoring your session"
      body="We are confirming your sign-in, permissions, and workspace access before opening the admin panel."
    >
      <div className="rounded-[1.5rem] border border-black/7 bg-white/76 p-6 shadow-[0_18px_40px_rgba(18,14,11,0.05)] backdrop-blur-sm sm:p-7">
        <div className="flex items-center gap-4 rounded-[1.25rem] border border-black/7 bg-[#fffdf9] px-4 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-tm-gold/26 bg-tm-gold/10 text-tm-gold">
            <LoaderCircle className="h-5 w-5 animate-spin" />
          </div>
          <div>
            <p className="text-[0.76rem] font-medium uppercase tracking-[0.18em] text-tm-charcoal">Checking credentials</p>
            <p className="mt-1 font-dm text-[0.88rem] leading-6 text-tm-warm-gray">
              Verifying your Firebase session and loading the correct admin experience.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <div className="h-3.5 w-32 animate-pulse rounded-full bg-black/8" />
          <div className="h-12 animate-pulse rounded-[1rem] bg-black/6" />
          <div className="h-12 animate-pulse rounded-[1rem] bg-black/5" />
          <div className="h-14 animate-pulse rounded-[1rem] bg-black/8" />
        </div>
      </div>
    </AdminAuthShell>
  );
}
