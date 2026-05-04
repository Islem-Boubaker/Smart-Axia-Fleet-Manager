import { useState } from 'react';
import SigninFormCard from '../components/SigninFormCard';
import SigninHeroPanel from '../components/SigninHeroPanel';
import { useAuth } from '../hooks/useAuth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export default function SignIn() {
  const { signIn, forgotPassword, loading, error } = useAuth();
  const rememberedEmail = localStorage.getItem('axia.remember') ?? '';
  const [email, setEmail] = useState(rememberedEmail);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(Boolean(rememberedEmail));
  const [showPwd, setShowPwd] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});
  const [success, setSuccess] = useState(false);

  const validate = (): AuthErrors => {
    const nextErrors: AuthErrors = {};
    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!EMAIL_RE.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!isForgotMode) {
      if (!password) {
        nextErrors.password = 'Password is required.';
      } else if (password.length < 8) {
        nextErrors.password = 'Password must be at least 8 characters.';
      }
    }
    return nextErrors;
  };

  const handleSubmit = async () => {
    const foundErrors = validate();
    setErrors(foundErrors);
    if (Object.keys(foundErrors).length > 0) {
      return;
    }

    try {
      if (isForgotMode) {
        await forgotPassword(email.trim());
        setSuccess(true);
      } else {
        await signIn({ email: email.trim(), password, rememberMe: remember });
        if (remember) {
          localStorage.setItem('axia.remember', email.trim());
        } else {
          localStorage.removeItem('axia.remember');
        }
      }
      setErrors({});
    } catch (submitError) {
      const fallbackMessage = submitError instanceof Error ? submitError.message : 'Something went wrong.';
      setErrors((prev) => ({ ...prev, form: error || fallbackMessage }));
    }
  };

  const resetForForgotMode = () => {
    setIsForgotMode(true);
    setSuccess(false);
    setShowPwd(false);
    setPassword('');
    setErrors({});
  };

  const resetForSignInMode = () => {
    setIsForgotMode(false);
    setSuccess(false);
    setErrors({});
  };

  return (
    <div className="sa-root sa-split" style={{ fontFamily: "'DM Sans', sans-serif", display: 'flex', minHeight: '100vh', width: '100%' }}>
      <SigninHeroPanel />
      <SigninFormCard
        email={email}
        password={password}
        remember={remember}
        showPwd={showPwd}
        isForgotMode={isForgotMode}
        loading={loading}
        success={success}
        errors={{ ...errors, form: errors.form || error || undefined }}
        onEmailChange={(value) => {
          setEmail(value);
          setSuccess(false);
          setErrors((prev) => ({ ...prev, email: undefined, form: undefined }));
        }}
        onPasswordChange={(value) => {
          setPassword(value);
          setErrors((prev) => ({ ...prev, password: undefined, form: undefined }));
        }}
        onRememberChange={setRemember}
        onTogglePasswordVisibility={() => setShowPwd((prev) => !prev)}
        onToggleForgotMode={resetForForgotMode}
        onBackToSignIn={resetForSignInMode}
        onSubmit={handleSubmit}
      />
    </div>
  );
}