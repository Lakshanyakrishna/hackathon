import { motion } from 'framer-motion';
import { UserPlus, Upload, Trophy } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Register',
    description: 'Create your account and browse upcoming hackathons. Find one that matches your interests.',
  },
  {
    icon: Upload,
    title: 'Submit',
    description: 'Work through the stages and submit your work. Get scored and advance to the next round.',
  },
  {
    icon: Trophy,
    title: 'Win',
    description: 'Top teams get recognized with awards and prizes. Showcase your achievement to the world.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-10 text-center"
      >
        <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">How It Works</h2>
      </motion.div>

      <div className="grid gap-8 sm:grid-cols-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="text-center"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <step.icon className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-1.5 text-lg font-semibold text-text-primary">{step.title}</h3>
            <p className="text-sm leading-relaxed text-text-muted">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
