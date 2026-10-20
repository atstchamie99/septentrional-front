import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { CategoryProvider } from '@features/public/contexts/CategoryContext';
import { SiteSettingsProvider } from '@features/public/contexts/SiteSettingsContext';

export default function PublicLayout() {
  return (
    <SiteSettingsProvider>
      <CategoryProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </CategoryProvider>
    </SiteSettingsProvider>
  );
}
