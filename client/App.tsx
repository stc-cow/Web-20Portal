import './global.css';

import { Toaster } from '@/components/ui/toaster';
import { createRoot } from 'react-dom/client';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import DriverApp from './pages/mobile/DriverApp';

const App = () => (
  <>
    <Toaster />
    <Sonner />
    <HashRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/mobile/driver" element={<DriverApp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  </>
);

const container = document.getElementById('root')!;
if ((window as any).__app_root) {
  (window as any).__app_root.render(<App />);
} else {
  const root = createRoot(container);
  (window as any).__app_root = root;
  root.render(<App />);
}
