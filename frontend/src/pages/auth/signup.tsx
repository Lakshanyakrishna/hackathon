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

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

export function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      setError('');
      const res = await authService.signup({
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
      });
      localStorage.setItem('accessToken', res.data.accessToken);
      login(res.data.user, res.data.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
    }
  };

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">Create account</h1>
        <p className="mt-1 text-sm text-text-muted">Join the hackathon community</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-error-bg px-4 py-3 text-sm text-error">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input label="Full Name" placeholder="John Doe" error={errors.name?.message} {...register('name')} />
          <Input label="Username" placeholder="johndoe" error={errors.username?.message} {...register('username')} />
        </div>

        <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />

        <div className="relative">
          <Input
            label="Password"
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
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-accent hover:text-accent-hover font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
