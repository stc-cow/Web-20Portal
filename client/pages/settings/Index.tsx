import Header from '@/components/layout/Header';
import { AppShell } from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsIndexPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <Header />
      <div className="px-4 pb-10 pt-4">
        <div className="mb-4 text-sm text-muted-foreground">
          {t('settings')}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link to="/settings/general" className="block">
                <Button variant="default" className="w-full h-20">
                  <SettingsIcon className="mr-2 h-5 w-5" />{' '}
                  {t('settingsGeneral')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
