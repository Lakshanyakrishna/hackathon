import { Outlet, Link } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-4 py-12">
      <Link to="/" className="mb-8 text-2xl font-bold bg-gradient-to-r from-accent to-pink bg-clip-text text-transparent">
        HackHub
      </Link>
      <div className="w-full max-w-[440px] animate-fade-in">
        <Outlet />
      </div>
    </div>
  );
}
