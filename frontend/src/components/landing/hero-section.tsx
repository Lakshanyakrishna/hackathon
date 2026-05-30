import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, LayoutDashboard, Layers, Users, BarChart3, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AnimatedBackground } from './animated-bg';

const mockupCards = [
  { icon: LayoutDashboard, label: 'Dashboard', color: 'from-accent to-purple-500' },
  { icon: Layers, label: 'Stage Timeline', color: 'from-purple-500 to-pink' },
  { icon: Users, label: 'Team Hub', color: 'from-pink to-orange-500' },
  { icon: BarChart3, label: 'Analytics', color: 'from-orange-500 to-accent' },
];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden px-4 pb-28 pt-16 sm:px-6 sm:pt-24 lg:pt-32">
      <AnimatedBackground />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-accent/20 blur-[128px]" />
        <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-pink/15 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 text-sm text-accent"
        >
          <Sparkles className="h-4 w-4" />
          The Ultimate Hackathon Platform
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Build. Ship.{' '}
          <span className="bg-gradient-to-r from-accent via-accent-hover to-pink bg-clip-text text-transparent">
            Win.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary sm:text-xl"
        >
          The platform where innovators compete, collaborate, and showcase their skills.
          Join thousands of participants building the future.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Button
            size="lg"
            className="w-full sm:w-auto gap-2 bg-gradient-to-r from-accent to-pink hover:opacity-90 text-base"
            onClick={() => navigate('/auth/signup')}
          >
            Start Building Today
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-base"
            onClick={() => navigate('/hackathons')}
          >
            Browse Hackathons
          </Button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative mx-auto mt-20 max-w-5xl"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-accent/10 to-transparent blur-3xl" />
        <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {mockupCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`relative overflow-hidden rounded-xl border border-border bg-bg-surface/80 backdrop-blur-sm p-4 sm:p-6 transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5`}
            >
              <div className={`mb-3 inline-flex rounded-lg bg-gradient-to-br ${card.color} p-2`}>
                <card.icon className="h-4 w-4 text-white sm:h-5 sm:w-5" />
              </div>
              <h3 className="text-xs font-semibold text-text-primary sm:text-sm">{card.label}</h3>
              <div className="mt-2 space-y-1.5">
                <div className="h-1.5 rounded-full bg-bg-elevated">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-accent to-pink" />
                </div>
                <div className="flex gap-1">
                  <div className="h-1.5 flex-1 rounded-full bg-bg-elevated" />
                  <div className="h-1.5 flex-1 rounded-full bg-bg-elevated" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-text-muted sm:text-xs">
                <Trophy className="h-3 w-3 text-warning" />
                {i === 0 && 'Stage 2/3'}
                {i === 1 && '3 stages'}
                {i === 2 && 'Active'}
                {i === 3 && '85% conv'}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
