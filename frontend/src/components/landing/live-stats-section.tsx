import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Users, Trophy, Building2, DollarSign } from 'lucide-react';

const stats = [
  { icon: Users, value: 10000, label: 'Participants', suffix: '+' },
  { icon: Building2, value: 50, label: 'Hackathons', suffix: '+' },
  { icon: Trophy, value: 2000, label: 'Teams', suffix: '+' },
  { icon: DollarSign, value: 500, label: 'Prize Pool', prefix: '$', suffix: 'K+' },
];

function AnimatedCounter({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="text-3xl font-bold text-text-primary sm:text-4xl tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

export function LiveStatsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="rounded-2xl border border-border bg-bg-surface/50 p-8 sm:p-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div className="rounded-full bg-accent/10 p-3">
                <stat.icon className="h-6 w-6 text-accent" />
              </div>
              <AnimatedCounter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              <p className="text-sm text-text-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
