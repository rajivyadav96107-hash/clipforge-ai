import { useEffect, useState } from 'react';

export type RoutePath = '/' | '/login' | '/signup' | '/dashboard';

function parseHash(): RoutePath {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  if (raw === '/login' || raw === '/signup' || raw === '/dashboard') return raw;
  return '/';
}

export function navigate(path: RoutePath) {
  if (window.location.hash.replace(/^#/, '') === path) {
    // Force a re-render even when the path is unchanged.
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = path;
  }
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

export function useHashRoute(): RoutePath {
  const [path, setPath] = useState<RoutePath>(parseHash());

  useEffect(() => {
    const onChange = () => setPath(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return path;
}
