import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative border-b border-border bg-white">
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
            Build. Compete. Win.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-text-muted sm:text-lg">
            Create, manage, and compete in hackathons. A platform for organizers and participants.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Button
              size="lg"
              className="gap-2 bg-accent text-white font-semibold hover:bg-accent-hover text-base"
              onClick={() => navigate('/auth/signup')}
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-base"
              onClick={() => navigate('/hackathons')}
            >
              Browse Events
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
