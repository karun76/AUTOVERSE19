import React, { useEffect } from 'react';
import { ExternalLink, LogIn, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SignInModal: React.FC = () => {
  const {
    signInModalOpen,
    closeSignInModal,
    signIn,
    signInWithRedirectFlow,
    signingIn,
    authError,
    authFailureCode,
  } = useAuth();

  useEffect(() => {
    if (!signInModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSignInModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [signInModalOpen, closeSignInModal]);

  if (!signInModalOpen) return null;

  const isInIframe =
    typeof window !== 'undefined' && window.self !== window.top;
  const currentUrl =
    typeof window !== 'undefined' ? window.location.href : '#';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-modal-title"
      onClick={closeSignInModal}
    >
      <div
        className="w-full max-w-md bg-[#12161f] border border-white/12 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-white/8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wider text-[#d6b45d] mb-1">
              AUTOVERSE Account
            </p>
            <h2
              id="signin-modal-title"
              className="text-xl font-semibold text-white tracking-tight"
            >
              Sign In with Google
            </h2>
          </div>
          <button
            type="button"
            onClick={closeSignInModal}
            aria-label="Close sign-in dialog"
            className="p-2 rounded-lg text-[#a7adba] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-[#b5bbc8] leading-relaxed">
            Sign in with your Google account to save your favorite vehicles to
            your personal Garage across sessions.
          </p>

          {authError && (
            <div
              role="alert"
              className="rounded-lg bg-[#1b1610] border border-[#d6b45d]/40 px-4 py-3 text-xs text-[#f4dfb0] leading-relaxed"
            >
              <p className="font-medium text-white mb-1">
                Sign-in needs another method
              </p>
              <p>{authError}</p>
              {authFailureCode && (
                <p className="mt-1.5 text-[11px] font-mono-tabular text-[#d6b45d]">
                  Code: {authFailureCode}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              disabled={signingIn}
              onClick={() => void signIn()}
              className="w-full h-11 px-4 rounded-lg bg-[#d6b45d] text-[#090b10] text-sm font-semibold hover:bg-[#e2c26d] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>
                {signingIn ? 'Connecting to Google...' : 'Continue with Google'}
              </span>
            </button>

            <button
              type="button"
              disabled={signingIn}
              onClick={() => void signInWithRedirectFlow()}
              className="w-full h-10 px-4 rounded-lg bg-[#1a202c] border border-white/12 text-white hover:border-[#d6b45d]/60 disabled:opacity-60 text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#d6b45d]" aria-hidden="true" />
              <span>Sign In via Google Redirect</span>
            </button>

            {isInIframe && (
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-10 px-4 rounded-lg bg-[#0b0e14] border border-white/10 text-[#d1d5df] hover:text-white hover:border-white/25 text-xs font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#d6b45d]" aria-hidden="true" />
                <span>Open App in New Tab to Sign In</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
