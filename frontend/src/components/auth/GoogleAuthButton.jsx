import { useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GOOGLE_SCRIPT_ID = 'google-identity-services';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

let googleScriptPromise = null;

const loadGoogleIdentityServices = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    let script = document.getElementById(GOOGLE_SCRIPT_ID);

    const handleLoad = () => {
      if (window.google?.accounts?.id) return resolve();
      reject(new Error('Google Identity Services failed to initialize'));
    };

    const handleError = () => reject(new Error('Google Identity Services failed to load'));

    if (!script) {
      script = document.createElement('script');
      script.id = GOOGLE_SCRIPT_ID;
      script.src = GOOGLE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
  }).catch((error) => {
    googleScriptPromise = null;
    throw error;
  });

  return googleScriptPromise;
};

export default function GoogleAuthButton({
  onCredential,
  text = 'signin_with',
  disabled = false
}) {
  const buttonRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;
    const buttonElement = buttonRef.current;

    if (!GOOGLE_CLIENT_ID) {
      setLoadError('Google sign-in is not configured.');
      return undefined;
    }

    setLoadError('');

    loadGoogleIdentityServices()
      .then(() => {
        if (cancelled || !buttonElement) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) onCredentialRef.current(response.credential);
          }
        });

        buttonElement.innerHTML = '';
        window.google.accounts.id.renderButton(buttonElement, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          logo_alignment: 'left',
          width: Math.min(buttonElement.clientWidth || 360, 360)
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError('Google sign-in is temporarily unavailable.');
      });

    return () => {
      cancelled = true;
      if (buttonElement) buttonElement.innerHTML = '';
    };
  }, [text]);

  if (loadError) {
    return <p className="text-center text-xs leading-5 text-muted-foreground" role="status">{loadError}</p>;
  }

  return <div
    className={`flex w-full justify-center ${disabled ? 'pointer-events-none opacity-60' : ''}`}
    aria-busy={disabled}
  >
    <div ref={buttonRef} className="w-full max-w-[360px]" />
  </div>;
}
