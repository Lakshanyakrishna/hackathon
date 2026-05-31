import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Winner, AI Hackathon 2025',
    avatar: null,
    content: 'The platform made it incredibly easy to collaborate with my team and submit our project. The stage-based approach kept us focused and on track.',
  },
  {
    name: 'Marcus Johnson',
    role: 'Hackathon Organizer',
    avatar: null,
    content: 'Managing a hackathon has never been easier. The analytics dashboard gives me real-time insights into participant engagement and progress.',
  },
  {
    name: 'Priya Patel',
    role: 'Participant, Web3 Hackathon',
    avatar: null,
    content: 'I loved the seamless experience from registration to submission. The automatic promotion system made the competition fair and transparent.',
  },
];

export function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-14 text-center"
      >
        <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
          Loved by the community
        </h2>
        <p className="mt-3 text-lg text-text-muted">
          Hear from participants and admins
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="rounded-xl border border-border bg-bg-surface p-6"
          >
            <div className="mb-4 flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-warning text-warning" />
              ))}
            </div>
            <p className="mb-6 text-sm leading-relaxed text-text-secondary">
              &ldquo;{testimonial.content}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <Avatar name={testimonial.name} size="sm" />
              <div>
                <p className="text-sm font-medium text-text-primary">{testimonial.name}</p>
                <p className="text-xs text-text-muted">{testimonial.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
