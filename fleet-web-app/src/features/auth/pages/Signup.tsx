import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiMail, FiLock, FiUser, FiTruck } from 'react-icons/fi';
import { Button, Input, toast } from '../../../shared/components';
import { ROUTES } from '../../../utils/constants';
import { authAPI } from '../services/auth.service';
import type { SignUpData } from '../services/auth.service';
import type { AxiosError } from 'axios';

interface SignUpForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpForm>();

  const password = watch('password');

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true);

    try {
      const payload: SignUpData = {
        name: data.name,
        email: data.email,
        password: data.password,
      };

      await authAPI.signUp(payload);

      toast.success('Account created successfully! Please sign in.');
      // Redirect after success
      navigate(ROUTES.SIGN_IN);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;

      const msg = axiosError.response?.data?.message || 'Failed to create account. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <FiTruck className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">
            Join Smart AXIA Fleet Manager today
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Name */}
            <div className="relative">
              <FiUser className="absolute left-3 top-10 text-gray-400" />
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                className="pl-10"
                error={errors.name?.message}
                {...register('name', {
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters',
                  },
                })}
              />
            </div>

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

            {/* Password */}
            <div className="relative">
              <FiLock className="absolute left-3 top-10 text-gray-400" />
              <Input
                label="Password"
                type="password"
                placeholder="Create a strong password"
                className="pl-10"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <FiLock className="absolute left-3 top-10 text-gray-400" />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                className="pl-10"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value =>
                    value === password || 'Passwords do not match',
                })}
              />
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                  {...register('agreeToTerms', {
                    required: 'You must agree to the terms',
                  })}
                />
                <span className="ml-2 text-sm text-gray-600">
                  I agree to the Terms of Service and Privacy Policy
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.agreeToTerms.message}
                </p>
              )}
            </div>

            <Button type="submit" fullWidth isLoading={isLoading} size="lg">
              Create Account
            </Button>

          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to={ROUTES.SIGN_IN}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          © 2026 Smart AXIA Fleet Manager. All rights reserved.
        </p>

      </div>
    </div>
  );
}