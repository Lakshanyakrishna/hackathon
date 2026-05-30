import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth';

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    try {
      setError('');
      await authService.forgotPassword(data.email);
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    }
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-bg">
          <CheckCircle className="h-6 w-6 text-success" />
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">Check your email</h1>
        <p className="mt-2 text-sm text-text-muted">
          We&apos;ve sent password reset instructions to your email.
        </p>
        <Link to="/auth/login" className="mt-6 inline-block text-sm text-accent hover:text-accent-hover">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">Reset password</h1>
        <p className="mt-1 text-sm text-text-muted">Enter your email to receive reset instructions</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-error-bg px-4 py-3 text-sm text-error">{error}</div>
        )}
        <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Send Reset Instructions
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Remember your password?{' '}
        <Link to="/auth/login" className="text-accent hover:text-accent-hover font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
