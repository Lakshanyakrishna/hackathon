import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, OrganizerRoute, AdminRoute } from './protected-route';
import { PageLoading } from '@/components/shared/loading';

function LazyLoad(Component: React.LazyExoticComponent<React.ComponentType<any>>) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Component />
    </Suspense>
  );
}

import { LandingPage } from '@/pages/landing';
import { LoginPage } from '@/pages/auth/login';
import { SignupPage } from '@/pages/auth/signup';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password';
import { ResetPasswordPage } from '@/pages/auth/reset-password';

const DashboardPage = lazy(() => import('@/pages/dashboard').then((m) => ({ default: m.DashboardPage })));
const HackathonListPage = lazy(() => import('@/pages/hackathons/list').then((m) => ({ default: m.HackathonListPage })));
const HackathonDetailPage = lazy(() => import('@/pages/hackathons/[slug]').then((m) => ({ default: m.HackathonDetailPage })));
const RegisterPage = lazy(() => import('@/pages/hackathons/register').then((m) => ({ default: m.RegisterPage })));
const CreateTeamPage = lazy(() => import('@/pages/team/create').then((m) => ({ default: m.CreateTeamPage })));
const TeamDetailPage = lazy(() => import('@/pages/team/[id]').then((m) => ({ default: m.TeamDetailPage })));
const PendingInvitationsPage = lazy(() => import('@/pages/team/invitations').then((m) => ({ default: m.PendingInvitationsPage })));
const SubmissionDetailPage = lazy(() => import('@/pages/submissions/[id]').then((m) => ({ default: m.SubmissionDetailPage })));
const SubmissionEditPage = lazy(() => import('@/pages/submissions/[id]/edit').then((m) => ({ default: m.SubmissionEditPage })));
const ResultsPage = lazy(() => import('@/pages/hackathons/[slug]/results').then((m) => ({ default: m.ResultsPage })));
const HallOfFamePage = lazy(() => import('@/pages/hall-of-fame').then((m) => ({ default: m.HallOfFamePage })));
const OrganizeDashboardPage = lazy(() => import('@/pages/organize/dashboard').then((m) => ({ default: m.OrganizeDashboardPage })));
const CreateHackathonPage = lazy(() => import('@/pages/organize/new').then((m) => ({ default: m.CreateHackathonPage })));
const OrganizerWorkspacePage = lazy(() => import('@/pages/organize/[slug]').then((m) => ({ default: m.OrganizerWorkspacePage })));
const AnalyticsPage = lazy(() => import('@/pages/organize/[slug]/analytics').then((m) => ({ default: m.AnalyticsPage })));
const WinnersPage = lazy(() => import('@/pages/organize/[slug]/winners').then((m) => ({ default: m.WinnersPage })));
const RegistrationsPage = lazy(() => import('@/pages/organize/[slug]/registrations').then((m) => ({ default: m.RegistrationsPage })));
const SubmissionsPage = lazy(() => import('@/pages/organize/[slug]/submissions').then((m) => ({ default: m.SubmissionsPage })));
const ProfilePage = lazy(() => import('@/pages/profile').then((m) => ({ default: m.ProfilePage })));
const NotificationsPage = lazy(() => import('@/pages/notifications').then((m) => ({ default: m.NotificationsPage })));
const AdminDashboardPage = lazy(() => import('@/pages/admin/dashboard').then((m) => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import('@/pages/admin/users').then((m) => ({ default: m.AdminUsersPage })));

import { PublicLayout } from '@/components/layout/public-layout';
import { AuthLayout } from '@/components/layout/auth-layout';
import { AppLayout } from '@/components/layout/app-layout';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { AdminLayout } from '@/components/layout/admin-layout';

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/hackathons', element: LazyLoad(HackathonListPage) },
      { path: '/hackathons/:slug', element: LazyLoad(HackathonDetailPage) },
      { path: '/hackathons/:slug/results', element: LazyLoad(ResultsPage) },
      { path: '/hall-of-fame', element: LazyLoad(HallOfFamePage) },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/auth/login', element: <LoginPage /> },
      { path: '/auth/signup', element: <SignupPage /> },
      { path: '/auth/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/auth/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: LazyLoad(DashboardPage) },
          { path: '/hackathons/:slug/register', element: LazyLoad(RegisterPage) },
          { path: '/team/create', element: LazyLoad(CreateTeamPage) },
          { path: '/team/:id', element: LazyLoad(TeamDetailPage) },
          { path: '/team/invitations', element: LazyLoad(PendingInvitationsPage) },
          { path: '/submissions/:id', element: LazyLoad(SubmissionDetailPage) },
          { path: '/submissions/:id/edit', element: LazyLoad(SubmissionEditPage) },
          { path: '/profile', element: LazyLoad(ProfilePage) },
          { path: '/notifications', element: LazyLoad(NotificationsPage) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <OrganizerRoute />,
        children: [
          {
            element: <OrganizerLayout />,
            children: [
              { path: '/organize', element: LazyLoad(OrganizeDashboardPage) },
              { path: '/organize/new', element: LazyLoad(CreateHackathonPage) },
              { path: '/organize/:slug', element: LazyLoad(OrganizerWorkspacePage) },
              { path: '/organize/:slug/analytics', element: LazyLoad(AnalyticsPage) },
              { path: '/organize/:slug/winners', element: LazyLoad(WinnersPage) },
              { path: '/organize/:slug/registrations', element: LazyLoad(RegistrationsPage) },
              { path: '/organize/:slug/submissions', element: LazyLoad(SubmissionsPage) },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/admin', element: LazyLoad(AdminDashboardPage) },
              { path: '/admin/users', element: LazyLoad(AdminUsersPage) },
            ],
          },
        ],
      },
    ],
  },
]);
