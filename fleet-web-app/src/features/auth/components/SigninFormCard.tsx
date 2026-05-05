import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AuthCheckbox from './AuthCheckbox';
import AuthInputField from './AuthInputField';
import { AlertIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from './AuthIcons';

type AuthErrors = {
  email?: string;
  password?: string;
  form?: string;
};

type SigninFormCardProps = {
  email: string;
  password: string;
  remember: boolean;
  showPwd: boolean;
  isForgotMode: boolean;
  loading: boolean;
  success: boolean;
  errors: AuthErrors;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onRememberChange: (value: boolean) => void;
  onTogglePasswordVisibility: () => void;
  onToggleForgotMode: () => void;
  onBackToSignIn: () => void;
  onSubmit: () => void;
};

export default function SigninFormCard({
  email,
  password,
  remember,
  showPwd,
  isForgotMode,
  loading,
  success,
  errors,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onTogglePasswordVisibility,
  onToggleForgotMode,
  onBackToSignIn,
  onSubmit,
}: SigninFormCardProps) {
  const { t } = useTranslation();
  return (
    <div
      className="sa-right"
      style={{
        flex: 1,
        minWidth: '340px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #e8eeff 0%, #dde8ff 40%, #e4eaff 70%, #eef1ff 100%)',
        padding: '48px 28px',
        position: 'relative',
      }}
    >
      <div
        className="sa-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 16px 48px rgba(37,99,235,0.10), 0 1px 3px rgba(0,0,0,0.05)',
          padding: '38px 38px 34px',
          animation: 'fadeUp 0.5s 0.1s ease both',
        }}
      >
        {isForgotMode && (
          <button
            onClick={onBackToSignIn}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6 focus-visible:outline-none focus-visible:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('auth.backToSignIn')}
          </button>
        )}

        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#2563eb',
            marginBottom: '10px',
          }}
        >
          {t('brand.fleetManager')}
        </p>

        <h2
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: 'clamp(22px, 2.5vw, 28px)',
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '-0.025em',
            lineHeight: 1.2,
            marginBottom: '8px',
          }}
        >
          {isForgotMode ? (
            t('auth.resetPassword')
          ) : (
            <>
              {t('auth.signInTitleLine1')}
              <br />
              {t('auth.signInTitleLine2')}
            </>
          )}
        </h2>

        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px', lineHeight: 1.6 }}>
          {isForgotMode ? t('auth.forgotSubtitle') : t('auth.signInSubtitle')}
        </p>

        {errors.form && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '9px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              padding: '11px 14px',
              marginBottom: '18px',
              fontSize: '13px',
              color: '#dc2626',
            }}
          >
            <span style={{ color: '#dc2626', flexShrink: 0, marginTop: '1px' }}>
              <AlertIcon />
            </span>
            <span>{errors.form}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              padding: '11px 14px',
              marginBottom: '18px',
              fontSize: '13px',
              color: '#16a34a',
            }}
          >
            <span>✓</span>
            <span>{isForgotMode ? t('auth.passwordResetSent') : t('auth.welcomeRedirect')}</span>
          </div>
        )}

        <AuthInputField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          placeholder={t('auth.emailPlaceholder')}
          icon={<MailIcon />}
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          error={errors.email}
        />

        {!isForgotMode && (
          <AuthInputField
            label={t('auth.password')}
            type={showPwd ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder={t('auth.passwordPlaceholder')}
            icon={<LockIcon />}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            error={errors.password}
            trailing={
              <button
                type="button"
                onClick={onTogglePasswordVisibility}
                aria-label={showPwd ? t('auth.hidePassword') : t('auth.showPassword')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 13px',
                  color: showPwd ? '#2563eb' : '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.18s',
                }}
              >
                {showPwd ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            }
          />
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '22px',
            marginTop: '4px',
          }}
        >
          {!isForgotMode && <AuthCheckbox checked={remember} onChange={onRememberChange} label={t('auth.rememberMe')} />}
          {!isForgotMode && (
            <a
              href="#"
              className="sa-forgot"
              style={{
                fontSize: '14px',
                color: '#2563eb',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onClick={(event) => {
                event.preventDefault();
                onToggleForgotMode();
              }}
            >
              {t('auth.forgotPassword')}
            </a>
          )}
        </div>

        <button
          type="button"
          className="sa-btn-submit"
          disabled={loading || success}
          onClick={onSubmit}
          style={{
            width: '100%',
            padding: '13.5px',
            background: loading || success ? 'linear-gradient(135deg,#93c5fd,#60a5fa)' : 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px',
            fontWeight: 600,
            cursor: loading || success ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'transform 0.15s, box-shadow 0.15s, background 0.2s',
            letterSpacing: '0.01em',
          }}
        >
          {loading && (
            <div
              style={{
                width: '16px',
                height: '16px',
                flexShrink: 0,
                border: '2px solid rgba(255,255,255,0.35)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          )}
          <span>
            {success
              ? isForgotMode
                ? t('auth.emailSentShort')
                : t('auth.welcomeBackShort')
              : loading
                ? isForgotMode
                  ? t('auth.sendingReset')
                  : t('auth.signingIn')
                : isForgotMode
                  ? t('auth.sendResetLink')
                  : t('auth.signIn')}
          </span>
        </button>
      </div>

      <p
        style={{
          position: 'absolute',
          bottom: '18px',
          left: 0,
          right: 0,
          fontSize: '11px',
          color: '#94a3b8',
          letterSpacing: '0.02em',
          textAlign: 'center',
        }}
      >
        {t('auth.footer', { year: new Date().getFullYear() })}
      </p>
    </div>
  );
}
