import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CheckCircle2, Bell, Settings, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { driverAuth } from '@/lib/driverAuth';
import { toast } from '@/hooks/use-toast';

interface BottomTabNavigationProps {
  children: React.ReactNode;
  driverName?: string;
  unreadNotifications?: number;
}

const tabs = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/driver/dashboard',
  },
  {
    id: 'missions',
    label: 'Missions',
    icon: CheckCircle2,
    path: '#missions-tab',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    path: '/driver/notifications',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/driver/settings',
  },
];

export default function BottomTabNavigation({
  children,
  driverName = 'Driver',
  unreadNotifications = 0,
}: BottomTabNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/driver/dashboard')) return 'dashboard';
    if (path.includes('/driver/mission')) return 'missions';
    if (path.includes('/driver/notifications')) return 'notifications';
    if (path.includes('/driver/settings')) return 'settings';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

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

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fbd65b3cd7a86452e803a3d7dc7a3d048%2Fdab107460bc24c05b37400810c2b1332?format=webp&width=100"
              alt="ACES"
              className="h-8 w-auto"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-semibold text-gray-900 truncate">
                {driverName}
              </h1>
              <p className="text-xs text-gray-500">Driver App</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigate('/driver/dashboard')}
                className="cursor-pointer"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/driver/notifications')}
                className="cursor-pointer"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {unreadNotifications > 0 && (
                  <span className="ml-auto text-xs bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/driver/settings')}
                className="cursor-pointer"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="cursor-pointer text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="w-full h-full">{children}</div>
      </div>

      {/* Bottom Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
        <div className="h-20 px-2 flex items-center justify-around">
          {tabs.map(({ id, label, icon: Icon, path }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => navigate(path)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" />
                  {id === 'notifications' && unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadNotifications > 9 ? '9' : unreadNotifications}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium ${isActive ? '' : ''}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
