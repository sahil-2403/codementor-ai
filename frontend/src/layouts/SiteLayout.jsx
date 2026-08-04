import { Outlet } from 'react-router-dom';
import TopNavbar from '../components/navbar/TopNavbar.jsx';
import { cn } from '../utils/cn.js';

export default function SiteLayout({ mainClassName = '' }) {
  return <div className="min-h-screen bg-page text-foreground">
    <a href="#main-content" className="skip-link">Skip to main content</a>
    <TopNavbar />
    <main id="main-content" className={cn('page-shell', mainClassName)}>
      <Outlet />
    </main>
  </div>;
}
