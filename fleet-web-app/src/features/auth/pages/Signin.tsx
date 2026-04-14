import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiMail, FiLock, FiTruck } from 'react-icons/fi';
import { Button, Input, toast } from '../../../shared/components';
import { authAPI } from '../services/auth.service';
import type { SignInCredentials } from '../services/auth.service';
import { ROUTES } from '../../../utils/constants.ts';
import { useDispatch } from 'react-redux';
import { setUser } from '../../../store/authSlice';

interface SignInForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function Signin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [count,setcount]=useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<SignInForm>();
  
  const onSubmit = async (data: SignInForm) => {
    if (isForgotMode) {
      if (!data.email) {
        setErrorMsg('Please enter your email code.');
        return;
      }
      setIsLoading(true);
      setErrorMsg(null);
      try {
        await authAPI.forgotPassword(data.email);
        toast.success('If the email exists, a new password has been sent to your inbox.');
        setIsForgotMode(false);
      } catch (error: any) {
        const msg = error.response?.data?.message || error.message || 'Failed to request new password';
        toast.error(msg);
        setErrorMsg(msg);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setcount(count + 1); 
   
    setIsLoading(true); 
    setErrorMsg(null);
    try {
      const credentials: SignInCredentials = {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe || false,
      };

      // Backend sets httpOnly cookies automatically.
      // We only receive the user profile in the JSON body.
      const user = await authAPI.signIn(credentials);
      if (!user) throw new Error('Login failed');

      dispatch(setUser(user));
      toast.success('Welcome back!');
      navigate(ROUTES.DASHBOARD);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      const msg = axiosError.response?.data?.message || axiosError.message || 'Failed to sign in';
      toast.error(msg);
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <FiTruck className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isForgotMode ? 'Reset Password' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600">
            {isForgotMode ? 'Enter your email to receive a new password' : 'Sign in to access your fleet dashboard'}
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Error banner */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div className="relative">
              <FiMail className="absolute left-3 top-10 text-gray-400" />
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
            </div>

            {!isForgotMode && (
              <>
                {/* Password */}
                <div className="relative">
                  <FiLock className="absolute left-3 top-10 text-gray-400" />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
                    error={errors.password?.message}
                    {...register('password', {
                      required: isForgotMode ? false : 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' },
                    })}
                  />
                </div>

                {/* Remember me */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      {...register('rememberMe')}
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setErrorMsg(null);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              </>
            )}

            {/* Submit */}
            <Button type="submit" fullWidth isLoading={isLoading} size="lg">
              {isForgotMode ? 'Send new password' : 'Sign In'}
            </Button>
            
            {isForgotMode && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsForgotMode(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          © 2026 Smart AXIA Fleet Manager. All rights reserved.
        </p>
      </div>
    </div>
  );
}