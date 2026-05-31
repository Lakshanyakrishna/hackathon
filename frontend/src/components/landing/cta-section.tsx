import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl border border-border bg-bg-surface px-8 py-14 text-center sm:px-16 sm:py-16"
      >
        <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">
          Ready to build something amazing?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-text-muted">
          Join the platform where innovation meets opportunity. Start your hackathon journey today.
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="w-full sm:w-auto gap-2 bg-accent text-white hover:bg-accent-hover text-base"
            onClick={() => navigate('/auth/signup')}
          >
            Get Started <ArrowRight className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-base"
            onClick={() => navigate('/hackathons')}
          >
            Browse Events
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
