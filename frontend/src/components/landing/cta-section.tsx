import { motion } from 'framer-motion';
import { ArrowRight, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-bg-surface to-pink/10 px-8 py-16 text-center sm:px-16 sm:py-20"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-accent/10 blur-[80px]" />
          <div className="absolute -bottom-20 left-0 h-64 w-64 rounded-full bg-pink/10 blur-[80px]" />
        </div>

        <div className="relative">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <Rocket className="h-8 w-8 text-accent" />
          </div>

          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
            Ready to build something amazing?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-text-muted">
            Join the platform where innovation meets opportunity. Start your hackathon journey today.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="w-full sm:w-auto gap-2 bg-gradient-to-r from-accent to-pink hover:opacity-90 text-base"
              onClick={() => navigate('/auth/signup')}
            >
              Join Your Next Hackathon
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base"
              onClick={() => navigate('/hackathons')}
            >
              Explore Hackathons
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
