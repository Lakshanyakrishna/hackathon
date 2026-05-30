import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth';

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetForm = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }
    try {
      setError('');
      await authService.resetPassword(token, data.password);
      setSuccess(true);
      setTimeout(() => navigate('/auth/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-bg">
          <CheckCircle className="h-6 w-6 text-success" />
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">Password reset!</h1>
        <p className="mt-2 text-sm text-text-muted">Redirecting to sign in...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-8 text-center">
        <h1 className="text-xl font-semibold text-text-primary">Invalid reset link</h1>
        <p className="mt-2 text-sm text-text-muted">This link is invalid or has expired.</p>
        <Link to="/auth/forgot-password" className="mt-4 inline-block text-sm text-accent">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">Set new password</h1>
        <p className="mt-1 text-sm text-text-muted">Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-error-bg px-4 py-3 text-sm text-error">{error}</div>
        )}

        <div className="relative">
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-text-muted hover:text-text-primary"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Reset Password
        </Button>
      </form>
    </div>
  );
}
