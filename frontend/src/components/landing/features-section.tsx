import { motion } from 'framer-motion';
import { Layers, Users2, BarChart3, Zap } from 'lucide-react';

const features = [
  {
    icon: Layers,
    title: 'Dynamic Stages',
    description: 'Multi-stage hackathons with configurable requirements, evaluation criteria, and automated promotion rules.',
    gradient: 'from-accent to-purple-500',
  },
  {
    icon: Users2,
    title: 'Team Collaboration',
    description: 'Create teams, invite members, and manage submissions together. Built-in team management and communication.',
    gradient: 'from-purple-500 to-pink',
  },
  {
    icon: BarChart3,
    title: 'Powerful Analytics',
    description: 'Track registrations, submissions, and team performance with detailed funnel metrics and conversion rates.',
    gradient: 'from-pink to-red-500',
  },
  {
    icon: Zap,
    title: 'Real-time Updates',
    description: 'Instant notifications for submissions, promotions, scores, and announcements. Stay in the loop.',
    gradient: 'from-red-500 to-accent',
  },
];

export function FeaturesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-14 text-center"
      >
        <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
          Everything you need
        </h2>
        <p className="mt-3 text-lg text-text-muted">
          A complete platform for admins and participants
        </p>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            className="group rounded-xl border border-border bg-bg-surface p-6 transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
          >
            <div className={`mb-4 inline-flex rounded-lg bg-gradient-to-br ${feature.gradient} p-2.5`}>
              <feature.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-text-primary">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-text-muted">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
