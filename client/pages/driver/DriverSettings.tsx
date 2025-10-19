import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { driverAuth, DriverSession } from '@/lib/driverAuth';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, LogOut, Lock, Bell, Smartphone } from 'lucide-react';

export default function DriverSettings() {
  const navigate = useNavigate();
  const [session, setSession] = useState<DriverSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    platform: 'Web',
    appVersion: '1.0.0',
  });

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const currentSession = await driverAuth.getSession();
        if (!currentSession) {
          navigate('/driver/login');
          return;
        }
        setSession(currentSession);
        detectDevice();
      } catch (error) {
        console.error('Session initialization error:', error);
        navigate('/driver/login');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [navigate]);

  const detectDevice = () => {
    const capacitor = (window as any).Capacitor;
    if (capacitor) {
      const platform = capacitor.getPlatform();
      setDeviceInfo((prev) => ({
        ...prev,
        platform: platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'Web',
      }));
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Validation error',
        description: 'Please fill in all password fields',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Validation error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Validation error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      if (!session?.email) {
        throw new Error('Email not found');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Failed to change password',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await driverAuth.signOut();
      toast({ title: 'Logged out successfully' });
      navigate('/driver/login');
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: 'Please try again',
        variant: 'destructive',
      });
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-4">Session not found</p>
            <Button onClick={() => navigate('/driver/login')}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/driver/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600">Manage your account</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Profile Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-gray-600 uppercase">Full Name</Label>
              <p className="font-semibold text-gray-900">{session.name}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600 uppercase">Email</Label>
              <p className="font-semibold text-gray-900">{session.email}</p>
            </div>
            {session.phone && (
              <div>
                <Label className="text-xs text-gray-600 uppercase">Phone</Label>
                <p className="font-semibold text-gray-900">{session.phone}</p>
              </div>
            )}
            {session.assigned_site && (
              <div>
                <Label className="text-xs text-gray-600 uppercase">Assigned Site</Label>
                <p className="font-semibold text-gray-900">
                  {session.assigned_site}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              <span>Device Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-gray-600 uppercase">Platform</Label>
              <p className="font-semibold text-gray-900">{deviceInfo.platform}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600 uppercase">App Version</Label>
              <p className="font-semibold text-gray-900">
                {deviceInfo.appVersion}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <span>Notification Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Push notifications are enabled. You'll receive alerts for:
            </p>
            <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li>New task assignments</li>
              <li>Task deadline reminders</li>
              <li>System updates</li>
              <li>Important announcements</li>
            </ul>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <span>Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and set a new one
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isChangingPassword}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isChangingPassword}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isChangingPassword}
                      className="mt-2"
                    />
                  </div>
                  <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPasswordDialogOpen(false)}
                      disabled={isChangingPassword}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Logout */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/driver/dashboard')}
            disabled={isLoggingOut}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </div>
    </div>
  );
}
