import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { driverAuth } from '@/lib/driverAuth';
import { toast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function DriverLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkExistingSession = async () => {
      const session = await driverAuth.getSession();
      if (session) {
        navigate('/driver/dashboard');
      }
    };
    checkExistingSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const session = await driverAuth.signIn(email, password);
      toast({
        title: 'Login successful',
        description: `Welcome back, ${session.name}!`,
      });
      navigate('/driver/dashboard');
    } catch (err: any) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      toast({
        title: 'Login failed',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://cdn.builder.io/api/v1/image/assets%2Fbd65b3cd7a86452e803a3d7dc7a3d048%2F8d9e83e302314801bae39aaa4940bba6?format=webp&width=1600')",
          backgroundAttachment: 'fixed',
        }}
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[#0B1220]/70" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
        <Card className="w-full max-w-md bg-[linear-gradient(to_bottom,rgba(255,255,255,0.9),rgba(240,240,240,0.95))] backdrop-blur-[12px] border border-white/60 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.08)]">
          <CardContent className="p-10">
            <div className="mb-8">
              <div className="mx-auto mb-4 flex items-center justify-center">
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
                Driver App Login
              </h1>
              <p className="mt-2 text-xs md:text-sm text-black/60 text-center">
                Sign in with your driver credentials
              </p>
              <div className="border-t border-black/10 my-4" />
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-black/70">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="driver@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-12 rounded-lg bg-[#f2f2f2] border border-black/10 text-black placeholder:text-black/50 shadow-inner transition-colors duration-200 focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-400/30"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-black/70">
                  Password
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-lg bg-[#f2f2f2] border border-black/10 text-black placeholder:text-black/50 shadow-inner transition-colors duration-200 focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-400/30 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-lg font-bold text-lg bg-[linear-gradient(90deg,#E21E26,#6c63ff)] text-white shadow-[0_3px_12px_rgba(226,30,38,0.3)] transition-all duration-300 hover:opacity-95"
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-black/60">
              <p>Admin portal? </p>
              <a
                href="#/login"
                className="font-medium text-cyan-600 hover:text-cyan-700"
              >
                Go to admin login
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
