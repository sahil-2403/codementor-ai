import { useLocation } from 'react-router-dom';
import SiteLayout from './SiteLayout.jsx';

export default function PublicLayout() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return <SiteLayout mainClassName={isLandingPage ? 'py-10 sm:py-12' : 'py-4 sm:py-6'} />;
}
