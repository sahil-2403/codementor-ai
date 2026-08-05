import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Application rendering failed.', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return <main className="page-shell grid min-h-screen place-items-center">
      <section className="ui-card w-full max-w-xl text-center" role="alert">
        <p className="ui-eyebrow">Something went wrong</p>
        <h1 className="ui-page-title">This page could not be displayed</h1>
        <p className="ui-page-description">Reload the page to try again. Your saved learning progress is not affected.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="ui-button ui-button--primary" onClick={() => window.location.reload()}>Reload page</button>
          <button type="button" className="ui-button ui-button--secondary" onClick={() => window.location.assign('/')}>Go to home</button>
        </div>
      </section>
    </main>;
  }
}
