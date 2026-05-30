import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

const winners = [
  {
    rank: 1,
    team: 'Team Alpha',
    award: 'Winner',
    icon: Trophy,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    members: ['Alice', 'Bob', 'Charlie'],
  },
  {
    rank: 2,
    team: 'Team Beta',
    award: 'Runner Up',
    icon: Medal,
    color: 'text-gray-400',
    bg: 'bg-gray-400/10',
    border: 'border-gray-400/30',
    members: ['David', 'Eve'],
  },
  {
    rank: 3,
    team: 'Team Gamma',
    award: 'Second Runner Up',
    icon: Star,
    color: 'text-amber-700',
    bg: 'bg-amber-700/10',
    border: 'border-amber-700/30',
    members: ['Frank', 'Grace', 'Henry'],
  },
];

export function WinnerShowcasePreview() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-14 text-center"
      >
        <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
          Recent Winners
        </h2>
        <p className="mt-3 text-lg text-text-muted">
          Celebrating the best projects and brightest minds
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {winners.map((winner, index) => (
          <motion.div
            key={winner.team}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`relative rounded-xl border ${winner.border} ${winner.bg} p-6 text-center`}
          >
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${winner.bg}`}>
              <winner.icon className={`h-8 w-8 ${winner.color}`} />
            </div>
            <h3 className="text-xl font-bold text-text-primary">{winner.team}</h3>
            <p className={`mt-1 text-sm font-medium ${winner.color}`}>{winner.award}</p>
            <div className="mt-4 flex justify-center -space-x-2">
              {winner.members.map((member, i) => (
                <Avatar key={i} name={member} size="sm" className="border-2 border-bg-base" />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-10 text-center"
      >
        <Link to="/hackathons">
          <Button variant="gradient" size="lg">
            <Trophy className="mr-2 h-5 w-5" />
            View All Winners
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
