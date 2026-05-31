import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

export function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-base">
      <nav className="sticky top-0 z-40 border-b border-border bg-bg-base/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-accent to-accent-dim bg-clip-text text-transparent">
            HackHub
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link to="/hackathons" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Browse
            </Link>
            <Link to="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              How it Works
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <span className="text-sm text-text-muted">{user?.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth/login')}>
                  Log In
                </Button>
                <Button size="sm" onClick={() => navigate('/auth/signup')}>
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          <button
            className="md:hidden rounded-md p-2 text-text-secondary hover:text-text-primary"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-bg-surface px-4 py-4 md:hidden animate-slide-down">
            <div className="flex flex-col gap-3">
              <Link to="/hackathons" className="text-sm text-text-secondary hover:text-text-primary py-1" onClick={() => setMobileOpen(false)}>
                Browse Hackathons
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="text-sm text-text-secondary hover:text-text-primary py-1" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                  <Link to="/profile" className="text-sm text-text-secondary hover:text-text-primary py-1" onClick={() => setMobileOpen(false)}>
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth/login" className="text-sm text-text-secondary hover:text-text-primary py-1" onClick={() => setMobileOpen(false)}>
                    Log In
                  </Link>
                  <Link to="/auth/signup" className="text-sm text-text-secondary hover:text-text-primary py-1" onClick={() => setMobileOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-border bg-bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-accent to-accent-dim bg-clip-text text-transparent">HackHub</h3>
              <p className="mt-2 text-sm text-text-muted">Build. Ship. Win. The ultimate hackathon platform.</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-text-primary">Platform</h4>
              <ul className="mt-3 space-y-2">
                <li><Link to="/hackathons" className="text-sm text-text-muted hover:text-text-secondary">Browse Hackathons</Link></li>
                <li><Link to="/how-it-works" className="text-sm text-text-muted hover:text-text-secondary">How it Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-text-primary">Company</h4>
              <ul className="mt-3 space-y-2">
                <li><Link to="/about" className="text-sm text-text-muted hover:text-text-secondary">About</Link></li>
                <li><Link to="/privacy" className="text-sm text-text-muted hover:text-text-secondary">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm text-text-muted hover:text-text-secondary">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-text-primary">Support</h4>
              <ul className="mt-3 space-y-2">
                <li><Link to="/help" className="text-sm text-text-muted hover:text-text-secondary">Help Center</Link></li>
                <li>
                  <a
                    href="mailto:hello@hackhub.dev"
                    className="text-sm text-text-muted hover:text-text-secondary transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-text-primary">Community</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href="https://github.com/hackhub"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-text-muted hover:text-text-secondary transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://twitter.com/hackhub"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-text-muted hover:text-text-secondary transition-colors"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="https://discord.gg/hackhub"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-text-muted hover:text-text-secondary transition-colors"
                  >
                    Discord
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-6 text-center text-sm text-text-muted">
            © {new Date().getFullYear()} HackHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
