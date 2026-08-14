import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Loader from '../components/common/Loader.jsx';
import TopNavbar from '../components/navbar/TopNavbar.jsx';
import { cn } from '../utils/cn.js';

export default function SiteLayout({ mainClassName = '' }) {
  return <div className="min-h-screen bg-page text-foreground">
    <a href="#main-content" className="skip-link">Skip to main content</a>
    <TopNavbar />
    <main id="main-content" className={cn('page-shell', mainClassName)}>
      <Suspense fallback={<Loader label="Loading page..." />}>
        <Outlet />
      </Suspense>
    </main>
  </div>;
}
