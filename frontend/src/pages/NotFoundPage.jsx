import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  const destination = isAuthenticated ? '/dashboard' : '/';

  return <main className="page-shell grid min-h-[70vh] place-items-center">
    <section className="ui-card w-full max-w-xl text-center">
      <p className="ui-eyebrow">Page not found</p>
      <h1 className="ui-page-title">We could not find this page</h1>
      <p className="ui-page-description">The address may be incorrect, or the page may have moved.</p>
      <Link to={destination} className="ui-button ui-button--primary mt-6">
        {isAuthenticated ? 'Back to dashboard' : 'Back to home'}
      </Link>
    </section>
  </main>;
}
