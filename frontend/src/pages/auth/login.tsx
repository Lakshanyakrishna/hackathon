import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/services/auth';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      const res = await authService.login(data);
      localStorage.setItem('accessToken', res.data.accessToken);
      login(res.data.user, res.data.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">Welcome back</h1>
        <p className="mt-1 text-sm text-text-muted">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-error-bg px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
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

        <div className="flex items-center justify-end">
          <Link to="/auth/forgot-password" className="text-sm text-accent hover:text-accent-hover">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <Link to="/auth/signup" className="text-accent hover:text-accent-hover font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
