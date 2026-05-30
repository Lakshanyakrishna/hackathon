# Frontend Architecture — Hackathon Platform

## 1. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Build | Vite 6 | Fast HMR, native ESM, TypeScript-first |
| UI | React 18 + TypeScript | Existing codebase convention |
| Routing | React Router v6 | Nested layouts, loaders, `useFetcher` |
| Styling | Tailwind CSS v3 + `tailwind-variants` | Design system, dark mode native |
| Components | shadcn/ui (Radix primitives) | Accessible, unstyled, Tailwind-native |
| Icons | lucide-react | Consistent, tree-shakeable icons |
| Client State | Zustand | Lightweight, no boilerplate, stores/ dir matches |
| Server State | TanStack Query v5 | Caching, refetch, optimistic updates |
| HTTP | axios + axios-retry | Interceptors for JWT refresh |
| Forms | react-hook-form + zod | Performant, type-safe validation |
| Charts | recharts | Lightweight, composable, React-native |
| Drag/Drop | @dnd-kit | Modern, accessible, for Stage Builder |
| Animations | framer-motion | Micro-interactions, page transitions |

## 2. Color Theme — Dark Purple / Pink

```
--bg-base:     #0a0a0f     (deepest bg)
--bg-surface:  #12121a     (card bg)
--bg-elevated: #1a1a2e     (hover/dropdown)
--border:      #2d2d4a     (subtle borders)
--text-primary:#e2e8f0     (headings)
--text-secondary:#a1a1aa   (body)
--text-muted:  #6b6b80     (labels/hints)
--accent:      #8b5cf6     (purple primary)
--accent-hover:#a78bfa     (purple light)
--accent-dim:  #6d28d9     (purple deep)
--pink:        #ec4899     (pink accent)
--pink-hover:  #f472b6     (pink light)
--gradient:    linear-gradient(135deg, #8b5cf6, #ec4899)
--success:     #22c55e
--warning:     #f59e0b
--error:       #ef4444
--info:        #3b82f6
```

Tailwind config extends these as `purple-*`, `pink-*` on a dark theme.

## 3. Route Structure

```
/                                   → LandingPage
/auth/signup                        → SignupPage
/auth/login                         → LoginPage
/auth/forgot-password               → ForgotPasswordPage
/auth/reset-password                → ResetPasswordPage
/auth/verify-email                  → VerifyEmailPage

/dashboard                          → ParticipantDashboard

/hackathons                         → HackathonListPage
/hackathons/:slug                   → HackathonPublicPage (tabs)
/hackathons/:slug/register          → RegistrationPage
/hackathons/:slug/:stage/leaderboard→ StageLeaderboardPage

/team/create                        → CreateTeamPage
/team/:id                           → TeamDashboardPage
/team/:id/settings                  → TeamSettingsPage

/submissions/:id                    → SubmissionDetailPage
/submissions/:id/edit               → SubmissionEditPage

/organize                           → OrganizerDashboardPage
/organize/new                       → CreateHackathonPage
/organize/:slug                     → OrganizerWorkspacePage (sidebar tabs)
/organize/:slug/stages/:id          → StageBuilderDetailPage
/organize/:slug/submissions         → ReviewSubmissionsPage
/organize/:slug/submissions/:id     → SubmissionReviewPage
/organize/:slug/analytics           → AnalyticsDashboardPage
/organize/:slug/winners             → WinnerSelectionPage

/profile                            → ProfilePage
/notifications                      → NotificationsPage
/activity                           → ActivityLogPage

/admin                              → AdminDashboardPage
/admin/users                        → AdminUsersPage
/admin/hackathons                   → AdminHackathonsPage
```

## 4. Layout Hierarchy

```
<App>
  <QueryClientProvider>
    <BrowserRouter>
      <Routes>
        ── <PublicLayout>              [navbar + footer]
        │   ├── LandingPage
        │   ├── HackathonListPage
        │   └── HackathonPublicPage
        │
        ── <AuthLayout>               [centered card]
        │   ├── SignupPage
        │   ├── LoginPage
        │   ├── ForgotPasswordPage
        │   ├── ResetPasswordPage
        │   └── VerifyEmailPage
        │
        ── <AppLayout>                [sidebar + topbar]  ProtectedRoute
        │   ├── ParticipantDashboard
        │   ├── CreateTeamPage
        │   ├── TeamDashboardPage
        │   ├── SubmissionEditPage
        │   ├── ProfilePage
        │   └── NotificationsPage
        │
        ── <OrganizerLayout>          [sidebar + topbar]  OrganizerRoute
        │   ├── OrganizerDashboardPage
        │   ├── CreateHackathonPage
        │   ├── OrganizerWorkspacePage (nested tabs)
        │   ├── StageBuilderDetailPage
        │   ├── ReviewSubmissionsPage
        │   ├── AnalyticsDashboardPage
        │   └── WinnerSelectionPage
        │
        ── <AdminLayout>              [sidebar]           SuperAdminRoute
            ├── AdminDashboardPage
            ├── AdminUsersPage
            └── AdminHackathonsPage
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
</App>
```

## 5. Component Hierarchy

### Shared / Primitives (shadcn/ui)
```
<Button variants={primary|secondary|ghost|danger|gradient} sizes={sm|md|lg|icon}>
<Input label error helperText prefixIcon>
<Select options searchable>
<Textarea autoResize>
<Switch>
<Checkbox>
<RadioGroup>
<Badge variant={success|warning|error|info|neutral}>
<Card padding={sm|md|lg} hoverable>
<Modal size={sm|md|lg|full} slideUp>
<Sheet> (mobile drawer)
<DropdownMenu>
<Tabs variant={underline|pill|sidebar}>
<Table sortable selectable>
<Avatar size={sm|md|lg} fallback>
<Toast> (stackable, auto-dismiss)
<Tooltip>
<Progress value max>
<Skeleton variant={text|card|avatar}>
</Tooltip>
```

### Feature Components — Public
```
<Navbar>              logo, nav links, auth buttons, mobile hamburger
<Footer>              links, social, copyright
<HeroSection>         tagline, CTA buttons, animated gradient bg, stat counters
<LiveStatsSection>    animated counters: "500+ Hackathons", "10k+ Participants", "$500k+ Prizes"
<SocialProofSection>  partner logos carousel, "Trusted by X universities/companies"
<FeaturedHackathons>  horizontal scroll cards with gradient overlay
<HackathonCard>       thumbnail, title, date range, prize pool, status badge
<TimelineSection>     vertical timeline with animated dots
<TestimonialCard>     avatar, quote, name, role
<FAQSection>          accordion items with search
<PrizeShowcase>       tier cards (1st, 2nd, 3rd) + special awards
<ProblemStatementCard>title, difficulty badge, tech stack tags, description
<FeaturedWinners>     grid of past winner cards with project spotlight
<WinnerSpotlightCard> team name, award, prize amount, member avatars, project desc, demo link
```

### Feature Components — Participant
```
<DashboardSidebar>    nav items, active state, collapsed mode
<DashboardTopbar>     search, notification dropdown (bell + badge + last 5 items), profile menu
<NextActionCard>      prominent primary action: "Submit Stage 2 (5d left)" / "Pay fee" / "Join team"
<TeamStatusCard>      team name, member count, lock status
<StageProgressCard>   current stage, submitted/not, deadline countdown
<SubmissionCard>      status badge, version, submitted at, preview button
<DeadlineTimeline>    upcoming deadlines with days remaining
<RegistrationCard>    status badge (PENDING_PAYMENT/APPROVED), payment CTA
<InvitationCard>      team name, inviter, accept/reject buttons
<TeamMemberList>      avatars, role badges, remove button (owner)
<NotificationDropdown>last 5 notifications, unread dots, "See all" link
<NotificationList>    full list with filters (all/unread/by type), mark read, mark all read
<SubmissionForm>      dynamic fields from StageConfig.requirements
<SubmissionPreview>   read-only merged view (requirements + values)
<SubmissionHistory>   version list with diff indicators
```

### Feature Components — Organizer
```
<OrganizerSidebar>    hackathon-specific nav items
<OrganizerTopbar>     hackathon title, View As Participant toggle, publish/archive actions
<ViewAsParticipant>   overlay/modal showing the participant-facing hackathon page
<StageBuilder>        drag-reorderable stage list + add/edit/delete
<StageCard>           name, order, date range, status, config button
<StageTimeline>       horizontal visual timeline showing all stages with current/completed/future
<CriteriaBuilder>     add/remove criteria rows, name + maxScore + weight
<PromotionRuleForm>   type selector (TOP_N|MINIMUM_SCORE|MANUAL_SELECTION) + value
<SubmissionReviewCard>team name, stage, status, score, review button
<ScoreInput>          criteria breakdown + total + comment
<TeamPromotePanel>    ranked team list with select/promote actions
<WinnerForm>          team selector, award title input, prize picker
<WinnerCard>          team name, award badge, prize amount
<RegistrationWizard>  multi-step: SelectTeam → Confirm → Payment → Confirmation
<RegistrationProgress>4-step progress indicator at top of wizard
<FunnelChart>         registration → paid → approved → submitted bars
<LeaderboardTable>    rank, team, stage percentage, overall percentage
<ConversionCard>      percentage with delta indicator
```

## 6. State Management Strategy

| Category | Tool | What It Holds |
|----------|------|---------------|
| Server State | TanStack Query | All API data: hackathons, teams, submissions, scores, registrations, users, notifications, activity logs. Cache keys: `['hackathons']`, `['hackathons', slug]`, `['submissions', id]`, etc. |
| Auth State | Zustand (`stores/auth`) | `user`, `accessToken`, `isAuthenticated`, `login()`, `logout()`, `refreshToken()` |
| UI State | Zustand (`stores/ui`) | `sidebarOpen`, `theme`, `toasts[]`, `activeModal` |
| Form State | react-hook-form | All form data — local to component, reset on submit |
| Route State | URL params + search params | `slug`, `id`, `page`, `filter`, `tab` — source of truth in URL |

### Auth Store (Zustand)
```ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}
```
JWT stored in httpOnly cookie (refresh) + memory (access). Axios interceptor auto-refreshes on 401.

### Query Key Convention
```
['hackathons']                          — list all
['hackathons', slug]                    — single
['hackathons', slug, 'stages']          — stages list
['hackathons', slug, 'registrations']   — registrations
['hackathons', slug, 'leaderboard']     — leaderboard overall
['hackathons', slug, 'analytics']       — analytics funnel
['teams', id]                           — single team
['teams', id, 'members']               — team members
['submissions', id]                     — single submission
['submissions', id, 'versions']        — version history
['users', id]                           — user profile
['notifications', userId]               — user notifications
['scores', { hackathonId, stageId }]   — scores list
['winners', hackathonId]                — winners list
```

## 7. Responsive Design Plan

### Breakpoints (Tailwind defaults)
```
sm: 640px   — mobile landscape
md: 768px   — tablet
lg: 1024px  — tablet landscape / small desktop
xl: 1280px  — desktop
2xl: 1536px — wide desktop
```

### Layout Behavior
| Element | Mobile (< 768) | Tablet (768-1023) | Desktop (1024+) |
|---------|---------------|-------------------|-----------------|
| Navbar | hamburger + slide-out drawer | hamburger + slide-out | full horizontal |
| Landing Page | stacked sections | 2-col grid for features | 3-col, full hero |
| Auth forms | full-width card | 400px centered | 440px centered |
| Dashboard | stacked cards, 1-col | 2-col grid | 3-col grid |
| Sidebar | hidden, overlay drawer | collapsed icons | expanded labels |
| Hackathon Page | stacked tabs dropdown | scrollable pill tabs | sidebar tabs |
| Organizer Workspace | full-screen modal per section | sidebar + content | sidebar + content |
| Tables | horizontal scroll wrapper | horizontal scroll | full table |
| Submission Form | single column | 2-col for fields | 2-col with preview |
| Leaderboard | compact rows, scroll | normal rows | full rows |
| Analytics | single chart visible | 2 charts side-by-side | full dashboard grid |

### Mobile-First Patterns
- All layouts start stacked, expand to grid at `md:`
- Sidebar becomes bottom navigation on mobile (participant) or overlay drawer (organizer)
- Tables use horizontal scroll with sticky first column
- Modal dialogs become full-screen sheets on mobile
- Buttons use `w-full` on mobile, `w-auto` on desktop

## 8. UI Wireframes (Text-Based)

### 8.1 Landing Page
```
┌──────────────────────────────────────────────────────────┐
│ [Logo]           Browse  HowItWorks  [Login] [Sign Up]   │  ← Navbar
├──────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐  │
│ │                                                    │  │
│ │    Build. Ship. Win.                               │  │
│ │    The Ultimate Hackathon Platform                 │  │
│ │                                                    │  │
│ │    [Register Now →]  [Explore Hackathons]          │  │
│ │                                                    │  │
│ └────────────────────────────────────────────────────┘  │  ← Hero (animated gradient)
│                                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ 📊       │ │ 👥       │ │ 💰       │ │ 📝       │   │  ← Live Stats
│ │ 50+      │ │ 10k+     │ │ $500k+   │ │ 5k+      │   │     (animated counters)
│ │Hackathons│ │Participants│ │ Prizes   │ │Submissions│   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐                                │
│ │AI  │ │Web3│ │ML  │ │Dev │  ← Featured Hackathons     │  ← Featured
│ │Hack│ │Hack│ │Hack│ │Ops │                              │
│ └───┘ └───┘ └───┘ └───┘                                │
│                                                          │
│ ┌─ MIT ─┐ ┌─ Google ─┐ ┌─ Stanford ─┐ ┌─ Microsoft ─┐  │  ← Social Proof
│ │ Logo  │ │  Logo    │ │   Logo     │ │   Logo      │  │     (partner carousel)
│ └───────┘ └──────────┘ └────────────┘ └────────────┘  │
│  "Trusted by leading universities and organizations"     │
│                                                          │
│  Timeline    │  Prizes    │  Problem Statements           │  ← Sections
│  ┌─●─┐       │  🥇 $10k  │  ┌─Problem 1──┐              │
│  │Reg│       │  🥈 $5k   │  │ [ML/AI]     │              │
│  ├─●─┤       │  🥉 $2k   │  │ Solve X...  │              │
│  │Sub│       │  🌟 Awards │  └────────────┘              │
│  └─●─┘       │           │  ┌─Problem 2──┐              │
│                                                          │
│ ┌─ Featured Winners ────────────────────────────────┐   │  ← Featured Winners
│ │ ┌─────────────────┐ ┌─────────────────┐           │   │
│ │ │ 🏆 Team Alpha   │ │ 🥈 Team Beta    │           │   │
│ │ │ Winner · $10k   │ │ Runner Up · $5k │           │   │
│ │ │ "AI solution..."│ │ "Web3 platform."│           │   │
│ │ │ [View Project]  │ │ [View Project]  │           │   │
│ │ └─────────────────┘ └─────────────────┘           │   │
│ └───────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ "Amazing platform. Won my first hackathon!"      │   │  ← Testimonials
│  │ — John D.                                        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  FAQ: [What is a hackathon?] [How do teams work?] ...   │
│                                                          │
│  [Logo]  About  Terms  Privacy  ©2026                    │  ← Footer
└──────────────────────────────────────────────────────────┘
```

### 8.2 Participant Dashboard
```
┌──────────┬──────────────────────────────────────────────┐
│ Dashboard │  Hi, John!                          🔔 👤   │  ← Topbar (bell has
│           │                                              │     unread badge + dropdown)
│ 📊 Dash   │  ┌────────────────────────────────────────┐  │
│ 👥 Teams  │  │ 🚀 Submit Stage 2: MVP Development    │  │  ← Next Action Card
│ 📝 Submis │  │    Deadline: Feb 28 (5 days left)     │  │     (prominent, gradient)
│ 🔔 Notif  │  │    [Go to Submission →]               │  │
│ ⚙ Settings│  └────────────────────────────────────────┘  │
│           │  ┌────────────┐ ┌────────────┐ ┌──────────┐│
│           │  │🚀 Current  │ │👥 My Team  │ │📅 Upcoming││
│           │  │  AI Hack   │ │  Alpha    │ │  Stage 2  ││
│           │  │  Stage 2/3 │ │  3 members│ │  Feb 15   ││
│           │  │  📋 Submit │ │  ✅ Active │ │  5 days   ││
│           │  └────────────┘ └────────────┘ └──────────┘│  ← Dashboard
│           │  ┌────────────────────────────────────────┐ │     Cards
│           │  │ Stage Progress                         │ │
│           │  │ Stage 1: Idea  ● ● ● ● ● ● ● ● ● 100% │ │
│           │  │ Stage 2: MVP   ● ● ● ● ● ● ○ ○ ○  60% │ │
│           │  │ Stage 3: Final ○ ○ ○ ○ ○ ○ ○ ○ ○   0%  │ │
│           │  └────────────────────────────────────────┘ │
│           │                                              │
│           │  ┌────────────────────────────────────────┐ │
│           │  │ Recent Notifications                   │ │
│           │  │ 🔔 Team invited to "Beta"        2m ago │ │
│           │  │ ✅ Submission approved            1h ago │ │
│           │  │ 🏆 Promoted to Stage 2            1d ago │ │
│           │  └────────────────────────────────────────┘ │
├──────────┴──────────────────────────────────────────────┤
│ Sidebar (collapsible)                    Main Content    │
└──────────────────────────────────────────────────────────┘
```

### 8.3 Hackathon Public Page (Tabs)
```
┌──────────────────────────────────────────────────────────┐
│ ← All Hackathons                                         │
│                                                          │
│  AI Hackathon 2026                              [Register]│
│  🗓 Feb 1 - Mar 15  |  👥 500+ Participants  |  🏆 $50k │
│                                                          │
│ ┌─ Stage Timeline ────────────────────────────────────┐  │
│ │  ●───────●────────●────────●                        │  │  ← Visual stage timeline
│ │  Idea    MVP      Final    Results                   │  │     (horizontal, clickable)
│ │  Feb 1   Feb 15   Mar 1    Mar 15                    │  │
│ │  ✅      🔥 LIVE   ⏳       🔒                        │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                          │
│  [Overview] [Timeline] [Rules] [Prizes] [Stages] [Ann]  │  ← Tabs
├──────────────────────────────────────────────────────────┤
│  About the Hackathon                                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │ This hackathon focuses on AI/ML solutions for...   │  │
│  │                                                    │  │
│  │ Timeline:                                          │  │
│  │ Stage 1: Idea Submission — Feb 1-14                │  │
│  │ Stage 2: MVP Development — Feb 15-28               │  │
│  │ Stage 3: Final Pitch — Mar 1-15                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Prizes:                                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│  │ 🥇     │ │ 🥈     │ │ 🥉     │ │ 🌟     │            │
│  │ $10,000│ │ $5,000 │ │ $2,000 │ │ Best   │            │
│  │ Winner │ │ Runner │ │ 2nd    │ │ UI/UX  │            │
│  │        │ │ Up     │ │ Runner │ │ $1,000 │            │
│  └────────┘ └────────┘ └────────┘ └────────┘            │
└──────────────────────────────────────────────────────────┘
```

### 8.4 Organizer Workspace
```
┌──────────┬──────────────────────────────────────────────┐
│ AI Hack  │  [AI Hackathon 2026]    [👁 View as User] ⚙️ │  ← Topbar with preview toggle
│          │                                              │
│ 📋 Over  │  ┌────────────────────────────────────────┐  │
│ 📐 Stage │  │ Hackathon Title: [AI Hackathon 2026   ]│  │
│ 📜 Rules │  │ Description: [textarea...             ]│  │
│ 🏆 Prizes│  │ Start Date: [date] End Date: [date]   │  │
│ 📊 Probs │  │ Status: ● PUBLISHED  [Save Changes]    │  │
│ 📝 Subms │  └────────────────────────────────────────┘  │
│ 📈 Analy │                                              │
│ 🏅 Winner│  ┌─ Stages ──────────────────────────────┐  │
│ 🔊 Ann   │  │ ≡ Stage 1: Idea         ⚙️ 🗑️       │  │
│ ⚙️ Settng│  │ ≡ Stage 2: MVP          ⚙️ 🗑️       │  │
│          │  │ ≡ Stage 3: Final        ⚙️ 🗑️       │  │
│          │  │ [+] Add Stage                            │  │
│          │  └────────────────────────────────────────┘  │
│          │                                              │
│          │  ┌─ Analytics ────────────────────────────┐  │
│          │  │ Reg: 500  │ Paid: 300  │ Appr: 250     │  │
│          │  │ ┌────────────────────────────────────┐ │  │
│          │  │ │ ████ Reg                          │ │  │
│          │  │ │ ██████ Paid                       │ │  │
│          │  │ │ ████████ Approved                 │ │  │
│          │  │ └────────────────────────────────────┘ │  │
│          │  └────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────┘
```

### 8.5 Submission Form
```
┌──────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                                      │
│                                                          │
│ Stage 2: MVP Development  —  Team Alpha                  │
│ Deadline: Feb 28, 2026 (5 days left)                 🔒  │
│                                                          │
│ ┌─ Progress ──────────────────────────────────────────┐  │
│ │ ████████████████░░░░░░░░░░░░░░░░  60%               │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌─ Submission Form ───────────────────────────────────┐  │
│ │                                                      │  │
│ │ GitHub URL:                                          │  │
│ │ [https://github.com/team/repo                  🖇️]  │  │
│ │                                                      │  │
│ │ Demo Video:                                          │  │
│ │ [https://youtube.com/watch?v=...               🖇️]  │  │
│ │                                                      │  │
│ │ Description:                                         │  │
│ │ [We built an AI-powered...                    ]      │  │
│ │ [                                   ]                │  │
│ │                                                      │  │
│ │ Screenshots:                                    📎   │  │
│ │ [Choose files or drag & drop]                       │  │
│ │                                                      │  │
│ │ ┌────────────────────────────────────────────────┐  │  │
│ │ │  screenshot1.png  ██████████  100%      🗑️    │  │  │
│ │ │  screenshot2.png  ████████░░  80%       🗑️    │  │  │
│ │ └────────────────────────────────────────────────┘  │  │
│ │                                                      │  │
│ │ [Save Draft]          [👁 Preview]          [Submit] │  │
│ │                                                      │  │
│ │ Last saved: 2 min ago                                │  │
│ └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 8.6 Analytics Dashboard (Organizer)
```
┌──────────┬──────────────────────────────────────────────┐
│ AI Hack  │  Analytics                                    │
│          │                                              │
│ 📋 Over  │  ┌─ Funnel ───────────────────────────────┐  │
│ 📐 Stage │  │  Registrations     ████████████  500    │  │
│ 📜 Rules │  │           ↘ 60%                        │  │
│ ...      │  │  Paid              ██████████   300    │  │
│ 📈 Analy │  │           ↘ 83%                        │  │
│          │  │  Approved          ████████    250     │  │
│          │  │           ↘ 40%                        │  │
│          │  │  Submitted (S1)    ███████     100     │  │
│          │  │           ↘ 70%                        │  │
│          │  │  Submitted (S2)    █████       50      │  │
│          │  └────────────────────────────────────────┘  │
│          │                                              │
│          │  ┌─ Leaderboard ──────┐ ┌─ Team Growth ───┐ │
│          │  │ #  Team    %       │ │ 📈 500          │ │
│          │  │ 1  Alpha   92%    │ │   400     ●────  │ │
│          │  │ 2  Beta    87%    │ │   300  ●───      │ │
│          │  │ 3  Gamma   85%    │ │   200───         │ │
│          │  │ 4  Delta   78%    │ │   100─            │ │
│          │  │ 5  Epsilon 72%    │ │   Jan Feb Mar     │ │
│          │  └───────────────────┘ └──────────────────┘ │
│          │                                              │
│          │  ┌─ Stats ────────────────────────────────┐  │
│          │  │ 📊 Reg: 500  │ 💰 Paid: 300            │  │
│          │  │ 👥 Teams: 85 │ 📝 Submitted: 100       │  │
│          │  │ 📈 Conv: 20% │ ⏳ Avg Score: 78%       │  │
│          │  └────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────┘
```

### 8.7 Winner Showcase
```
┌──────────────────────────────────────────────────────────┐
│  🏆 AI Hackathon 2026 — Winners                          │
│                                                          │
│  ┌─ Grand Winner Spotlight ──────────────────────────┐  │
│  │  ┌──────────────────────┐                         │  │
│  │  │       🏆🥇           │  Team Alpha              │  │  ← Featured spotlight
│  │  │                      │  Award: Winner           │  │     (larger, prominent)
│  │  │    ┌───┐ ┌───┐     │  Prize: $10,000           │  │
│  │  │    │ A │ │ B │      │                          │  │
│  │  │    └───┘ └───┘     │  "Built an AI-powered     │  │
│  │  │    ┌───┐ ┌───┐     │   solution that..."       │  │
│  │  │    │ C │ │ D │      │  🛠 Python, TensorFlow    │  │
│  │  │    └───┘ └───┘     │  🔗 [Demo] [GitHub]       │  │
│  │  └──────────────────────┘                         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 🥈      │ │ 🥉      │ │ 🌟      │ │ 🌟      │   │
│  │ Team    │ │ Team    │ │ Best    │ │ Special  │   │  ← Smaller cards
│  │ Beta    │ │ Gamma   │ │ UI/UX   │ │ Mention  │   │     with hover zoom
│  │ $5,000  │ │ $2,000  │ │ $1,000  │ │ —        │   │
│  │ Runner  │ │ 2nd     │ │ Team    │ │ Team     │   │
│  │ Up      │ │ Runner  │ │ Delta   │ │ Epsilon  │   │
│  │ ┌───┐  │ │ ┌───┐   │ │ ┌───┐   │ │ ┌───┐   │   │
│  │ │A E│  │ │ │G H│   │ │ │D F│   │ │ │E J│   │   │
│  │ └───┘  │ │ └───┘   │ │ └───┘   │ │ └───┘   │   │
│  │ [View] │ │ [View]   │ │ [View]   │ │ [View]   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│  🏅 Hall of Fame  ── All Winners Across Hackathons       │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │2026  │ │2025  │ │2025  │ │2024  │                   │
│  │AI    │ │Web3  │ │ML    │ │Dev   │                   │
│  │Hack  │ │Hack  │ │Hack  │ │Hack  │                   │
│  │ 🏆🥈🥉│ │ 🏆🥈  │ │ 🏆🥈🥉│ │ 🏆   │                   │
│  └──────┘ └──────┘ └──────┘ └──────┘                   │
└──────────────────────────────────────────────────────────┘
```

### 8.8 Registration Wizard
```
┌──────────────────────────────────────────────────────────┐
│  ← AI Hackathon 2026                                     │
│                                                          │
│  Register for AI Hackathon 2026                          │
│                                                          │
│  ┌─ Progress ─────────────────────────────────────────┐  │
│  │  ● ● ○ ○                                            │  │  4-step progress bar
│  │  Team  Details  Payment  Confirm                    │  │  (current = Details)
│  └──────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Step 2: Confirm Details ──────────────────────────┐  │
│  │                                                      │  │
│  │  Team: Alpha (3 members)                [Change]    │  │
│  │                                                     │  │
│  │  Members:                                           │  │
│  │  ┌───┐ John (you) — Team Lead          ✅          │  │
│  │  ┌───┐ Jane                            ✅          │  │
│  │  ┌───┐ Bob                             ✅          │  │
│  │                                                     │  │
│  │  Registration Fee: $50                              │  │
│  │                                                     │  │
│  │         [Back]                    [Continue →]      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Step 3: Payment (if paid) ────────────────────────┐  │
│  │                                                     │  │
│  │  💳 Payment Details                                 │  │
│  │                                                     │  │
│  │  Amount: $50.00                                     │  │
│  │                                                     │  │
│  │  [Pay with Razorpay 💳]                             │  │
│  │                                                     │  │
│  │  or                                                 │  │
│  │                                                     │  │
│  │  [Pay Later] (if approval-based)                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Step 4: Confirmation ─────────────────────────────┐  │
│  │                                                     │  │
│  │  ✅ You're registered! 🎉                           │  │
│  │                                                     │  │
│  │  Team: Alpha                                        │  │
│  │  Status: PENDING_APPROVAL (or APPROVED if free)     │  │
│  │                                                     │  │
│  │  [Go to Dashboard →]                                │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 8.9 Notification Center
```
┌──────────────────────────────────────────────────────────┐
│  ← Dashboard                                              │
│                                                          │
│  🔔 Notifications                                        │
│  ┌─ Filters ──────────────────────────────────────────┐  │
│  │  [All] [Unread] [Team] [Hackathon] [Submission]    │  │  ← Filter tabs
│  │                                     [Mark All Read] │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Today ────────────────────────────────────────────┐  │
│  │  ● 🔔 Team invited to "Beta"                 2m ago│  │  ← Unread = blue dot
│  │       John invited you to join their team          │  │
│  │       [Accept] [Reject]                            │  │
│  │  ● 🏆 Promoted to Stage 2                    1h ago│  │
│  │       Team Alpha advanced to MVP Development       │  │
│  │  ○ 📝 Submission approved                    2h ago│  │  ← Read = no dot
│  │       Stage 1 submission was approved              │  │
│  │  ○ 💳 Payment received                       1d ago│  │
│  │       Your registration payment is confirmed       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Yesterday ────────────────────────────────────────┐  │
│  │  ○ 🔊 New announcement: Schedule change      1d ago│  │
│  │       Hackathon extended by 2 days                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                          │
│  [Load More]                                              │
└──────────────────────────────────────────────────────────┘

```
### 8.10 Notification Dropdown (Topbar)
```
┌────────────────────────────────────────────────────────────┐
│  [🔔 3]   ← Topbar bell icon with unread count            │
├────────────────────────────────────────────────────────────┤
│ ┌─ Notification Dropdown ───────────────────────────────┐  │
│ │ ● 🔔 Team invited to Beta                 2m ago     │  │
│ │ ● 🏆 Promoted to Stage 2                   1h ago    │  │
│ │ ○ 💳 Payment received                        1d ago   │  │
│ │ ○ 🔊 New announcement                       1d ago   │  │
│ │ ───────────────────────────────────────────            │  │
│ │ [View All Notifications →]                            │  │
│ └────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## 9. Backend Gaps to Fill

The following modules exist but have stubs only (no CRUD):
- **Rules** — `GET /api/v1/rules` returns module status
- **Prizes** — `GET /api/v1/prizes` returns module status
- **Problem Statements** — `GET /api/v1/problem-statements` returns module status
- **Announcements** — `GET /api/v1/announcements` returns module status

Full CRUD needed for Phase 4 Admin Builder UI:
- `GET/POST /api/v1/hackathons/:hid/rules` and `PUT/DELETE :id`
- `GET/POST /api/v1/hackathons/:hid/prizes` and `PUT/DELETE :id`
- `GET/POST /api/v1/hackathons/:hid/problem-statements` and `PUT/DELETE :id`
- `GET/POST /api/v1/hackathons/:hid/announcements` and `PUT/DELETE :id`

## 10. Project Structure

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/               ← shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── public-layout.tsx
│   │   │   ├── auth-layout.tsx
│   │   │   ├── app-layout.tsx
│   │   │   ├── organizer-layout.tsx
│   │   │   ├── admin-layout.tsx
│   │   │   ├── navbar.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── topbar.tsx
│   │   │   └── footer.tsx
│   │   ├── landing/
│   │   │   ├── hero-section.tsx
│   │   │   ├── live-stats-section.tsx
│   │   │   ├── social-proof-section.tsx
│   │   │   ├── featured-hackathons.tsx
│   │   │   ├── timeline-section.tsx
│   │   │   ├── prize-showcase.tsx
│   │   │   ├── featured-winners.tsx
│   │   │   ├── winner-spotlight-card.tsx
│   │   │   ├── problem-statements.tsx
│   │   │   ├── testimonials.tsx
│   │   │   ├── faq-section.tsx
│   │   │   └── cta-section.tsx
│   │   ├── hackathon/
│   │   │   ├── hackathon-card.tsx
│   │   │   ├── hackathon-tabs.tsx
│   │   │   ├── stage-timeline.tsx
│   │   │   ├── timeline-view.tsx
│   │   │   ├── rules-view.tsx
│   │   │   ├── prizes-view.tsx
│   │   │   ├── problem-statements-view.tsx
│   │   │   ├── stages-view.tsx
│   │   │   ├── announcements-view.tsx
│   │   │   ├── results-view.tsx
│   │   │   ├── registration-wizard.tsx
│   │   │   └── registration-progress.tsx
│   │   ├── team/
│   │   │   ├── team-card.tsx
│   │   │   ├── team-member-list.tsx
│   │   │   ├── invite-form.tsx
│   │   │   └── invitation-card.tsx
│   │   ├── submission/
│   │   │   ├── submission-form.tsx
│   │   │   ├── submission-preview.tsx
│   │   │   ├── submission-history.tsx
│   │   │   ├── file-upload.tsx
│   │   │   └── progress-indicator.tsx
│   │   ├── organizer/
│   │   │   ├── organizer-topbar.tsx
│   │   │   ├── stage-builder.tsx
│   │   │   ├── stage-card.tsx
│   │   │   ├── criteria-builder.tsx
│   │   │   ├── promotion-rule-form.tsx
│   │   │   ├── submission-review-card.tsx
│   │   │   ├── score-input.tsx
│   │   │   ├── team-promote-panel.tsx
│   │   │   ├── view-as-participant.tsx
│   │   │   ├── winner-form.tsx
│   │   │   ├── winner-card.tsx
│   │   │   └── analytics/
│   │   │       ├── funnel-chart.tsx
│   │   │       ├── leaderboard-table.tsx
│   │   │       ├── team-growth-chart.tsx
│   │   │       ├── conversion-card.tsx
│   │   │       └── stat-card.tsx
│   │   └── shared/
│   │       ├── loading.tsx
│   │       ├── error-state.tsx
│   │       ├── empty-state.tsx
│   │       ├── confirm-dialog.tsx
│   │       ├── status-badge.tsx
│   │       ├── countdown-timer.tsx
│   │       ├── next-action-card.tsx
│   │       ├── notification-dropdown.tsx
│   │       ├── notification-list.tsx
│   │       ├── pagination.tsx
│   │       └── search-input.tsx
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-debounce.ts
│   │   ├── use-media-query.ts
│   │   ├── use-auto-save.ts
│   │   └── use-countdown.ts
│   ├── pages/
│   │   ├── landing.tsx
│   │   ├── auth/
│   │   │   ├── signup.tsx
│   │   │   ├── login.tsx
│   │   │   ├── forgot-password.tsx
│   │   │   ├── reset-password.tsx
│   │   │   └── verify-email.tsx
│   │   ├── dashboard.tsx
│   │   ├── hackathons/
│   │   │   ├── list.tsx
│   │   │   ├── [slug].tsx
│   │   │   └── register.tsx
│   │   ├── team/
│   │   │   ├── create.tsx
│   │   │   └── [id].tsx
│   │   ├── submissions/
│   │   │   ├── [id].tsx
│   │   │   └── [id]/edit.tsx
│   │   ├── organize/
│   │   │   ├── dashboard.tsx
│   │   │   ├── new.tsx
│   │   │   ├── [slug].tsx
│   │   │   ├── [slug]/analytics.tsx
│   │   │   └── [slug]/winners.tsx
│   │   ├── profile.tsx
│   │   ├── notifications.tsx
│   │   └── admin/
│   │       ├── dashboard.tsx
│   │       ├── users.tsx
│   │       └── hackathons.tsx
│   ├── routes/
│   │   ├── index.tsx
│   │   ├── protected-route.tsx
│   │   └── role-route.tsx
│   ├── services/
│   │   ├── api.ts              ← axios instance + interceptors
│   │   ├── auth.ts
│   │   ├── hackathons.ts
│   │   ├── teams.ts
│   │   ├── submissions.ts
│   │   ├── registrations.ts
│   │   ├── scores.ts
│   │   ├── promotions.ts
│   │   ├── winners.ts
│   │   ├── analytics.ts
│   │   ├── notifications.ts
│   │   └── users.ts
│   ├── stores/
│   │   ├── auth-store.ts
│   │   └── ui-store.ts
│   ├── types/
│   │   ├── api.ts
│   │   ├── hackathon.ts
│   │   ├── team.ts
│   │   ├── submission.ts
│   │   ├── registration.ts
│   │   ├── score.ts
│   │   ├── winner.ts
│   │   ├── user.ts
│   │   └── common.ts
│   ├── utils/
│   │   ├── cn.ts              ← clsx + tailwind-merge
│   │   ├── format.ts          ← dates, currency
│   │   └── constants.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── package.json
```

## 11. Implementation Order

1. **Scaffold**: Vite + React + Tailwind + shadcn/ui setup
2. **Base UI**: primitives (button, input, card, modal, etc.)
3. **Auth Flow**: login/signup pages + Zustand auth store + axios interceptors
4. **Layouts**: public, auth, app, organizer, admin
5. **Landing Page**: all sections (hero, featured, timeline, etc.)
6. **Hackathon Module**: public pages + registration
7. **Team Module**: create, invite, join, manage
8. **Dashboard**: participant dashboard with cards
9. **Submission**: form builder + dynamic fields + auto-save + preview
10. **Organizer Workspace**: full builder UI
11. **Analytics**: charts + funnel + leaderboard
12. **Winners**: showcase + hall of fame
13. **Admin**: user + hackathon management
14. **Polish**: animations, responsive, edge cases
