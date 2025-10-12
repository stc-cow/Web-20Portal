import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useI18n } from '@/i18n';
import { toast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional().default(false),
});

type FormValues = z.infer<typeof schema>;

const VALID_PASSWORD = 'Aces@6343';
const ADMINS_STORAGE_KEY = 'app.admins';

export default function Login() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: 'Bannaga', password: '', remember: false },
  });

  useEffect(() => {
    const remembered = localStorage.getItem('remember.username');
    if (remembered) {
      setValue('username', remembered);
      setValue('remember', true);
    }
    if (localStorage.getItem('auth.loggedIn') === 'true') {
      navigate('/');
    }
  }, [setValue, navigate]);

  const [authError, setAuthError] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    setAuthError(null);
    // Validate against Supabase admins table
    let ok = false;
    const { data, error } = await supabase
      .from('admins')
      .select('id, username, password, position')
      .eq('username', values.username.trim())
      .maybeSingle();
    let isSuperAdmin = false;
    if (!error && data) {
      ok = data.password === values.password;
      isSuperAdmin = (data.position || '').toLowerCase() === 'admin';
    }
    // fallback to legacy hardcoded admin if table not yet populated
    if (!ok) {
      const { data: authUser, error: authErr } = await supabase
        .from('authorizations')
        .select('username, password, position')
        .eq('username', values.username.trim())
        .maybeSingle();
      if (!authErr && authUser) {
        ok = authUser.password === values.password;
        isSuperAdmin =
          String(authUser.position || '').toLowerCase() === 'admin';
      }
    }
    if (!ok && (!data || error)) {
      ok =
        values.username.trim() === 'Bannaga' && values.password === 'Aces@6343';
      if (ok) isSuperAdmin = true;
    }

    if (!ok) {
      setAuthError('Invalid username or password.');
      return;
    }
    if (values.remember) {
      localStorage.setItem('remember.username', values.username);
    } else {
      localStorage.removeItem('remember.username');
    }
    localStorage.setItem('auth.loggedIn', 'true');
    localStorage.setItem('auth.username', values.username);
    localStorage.setItem('auth.role', isSuperAdmin ? 'superadmin' : 'user');
    // Log to admin_log table
    try {
      await supabase
        .from('admin_log')
        .insert({ username: values.username, event: 'login' });
    } catch {}
    navigate('/');
  };

  const { t } = useI18n();
  const [resetOpen, setResetOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const sendReset = async () => {
    const email = resetEmail.trim();
    const emailOk = /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email);
    if (!emailOk) {
      toast({ title: t('invalidEmail') });
      return;
    }
    try {
      await fetch('/api/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      toast({ title: t('resetEmailSent') });
      setResetOpen(false);
    } catch {
      toast({ title: t('resetEmailSent') });
      setResetOpen(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background image layer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://cdn.builder.io/api/v1/image/assets%2Fbd65b3cd7a86452e803a3d7dc7a3d048%2F8d9e83e302314801bae39aaa4940bba6?format=webp&width=1600')",
          backgroundAttachment: 'fixed',
        }}
      />
      {/* Dark overlay for contrast */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[#0B1220]/70" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
        <Card className="w-full max-w-md bg-[linear-gradient(to_bottom,rgba(255,255,255,0.9),rgba(240,240,240,0.95))] backdrop-blur-[12px] border border-white/60 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-in-out hover:scale-[1.01]">
          <CardContent className="p-10">
            <div className="mb-8">
              <div className="mx-auto mb-3 flex items-center justify-center">
                <div className="inline-block bg-white/20 rounded-xl px-[10px] py-[6px]">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2Fbd65b3cd7a86452e803a3d7dc7a3d048%2F105b639e4bb8470085fcfa7a9656d760?format=webp&width=800"
                    alt="ACES Managed Services"
                    className="mx-auto w-[160px] max-w-[80%] h-auto object-contain drop-shadow-[0_0_6px_rgba(0,0,0,0.25)]"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>
              <h1 className="text-lg md:text-xl font-semibold text-black/70 text-center">
                Sign in to ACES MSD Fuel Portal
              </h1>
              <p className="mt-2 text-xs md:text-sm text-black/60 text-center">
                {t('signInSubtitle')}
              </p>
              <div className="border-t border-black/10 my-4" />
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Label htmlFor="username" className="text-black/70">
                  {t('username')}
                </Label>
                <Input
                  id="username"
                  placeholder={t('username')}
                  autoComplete="username"
                  className="mt-2 h-12 rounded-lg bg-[#f2f2f2] border border-black/10 text-black placeholder:text-black/50 shadow-inner transition-colors duration-200 focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-400/30"
                  {...register('username')}
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-rose-400">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="password" className="text-black/70">
                  {t('password')}
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('password')}
                    autoComplete="current-password"
                    className="h-12 rounded-lg bg-[#f2f2f2] border border-black/10 text-black placeholder:text-black/50 shadow-inner transition-colors duration-200 focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-400/30 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-400">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-black/70">
                  <Checkbox
                    className="border-black/30 data-[state=checked]:bg-primary"
                    {...register('remember')}
                  />
                  <span className="text-sm">{t('rememberMe')}</span>
                </label>
              </div>
              {authError && (
                <p className="-mt-1 text-sm text-rose-400">{authError}</p>
              )}
              <Button
                type="submit"
                className="w-full h-12 rounded-lg font-bold text-lg bg-[linear-gradient(90deg,#ff3b3b,#6c63ff)] text-white shadow-[0_3px_12px_rgba(108,99,255,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-5 w-5" />}
                {isSubmitting ? t('signingIn') : t('login')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('resetPassword')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="resetEmail">{t('enterEmailToReset')}</Label>
            <Input
              id="resetEmail"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setResetOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button type="button" onClick={sendReset}>
              {t('sendResetLink')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Decor() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
        <radialGradient
          id="r1"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(200,150) rotate(45) scale(400)"
        >
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="r2"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(1000,650) rotate(-30) scale(500)"
        >
          <stop offset="0%" stopColor="#fda4af" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="rCenter"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(600,400) scale(600)"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="60" />
        </filter>
      </defs>
      <g opacity="0.45" className="">
        <circle cx="200" cy="150" r="300" fill="url(#r1)" filter="url(#blur)" />
        <circle
          cx="1000"
          cy="650"
          r="350"
          fill="url(#r2)"
          filter="url(#blur)"
        />
        <circle
          cx="600"
          cy="400"
          r="380"
          fill="url(#rCenter)"
          filter="url(#blur)"
          className="opacity-60"
        />
      </g>
      <g fill="none" stroke="url(#g)" strokeOpacity="0.12" className="">
        <path d="M0 700 L300 500 600 650 900 450 1200 600" />
        <path d="M0 500 L250 350 500 500 750 350 1000 500 1200 400" />
        <path d="M0 300 L300 200 600 300 900 200 1200 250" />
      </g>
    </svg>
  );
}
