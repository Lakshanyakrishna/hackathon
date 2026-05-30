import { motion } from 'framer-motion';
import { UserPlus, Users, Upload, Trophy } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Register',
    description: 'Create your account and browse upcoming hackathons. Find one that matches your interests.',
    gradient: 'from-accent to-purple-500',
  },
  {
    icon: Users,
    title: 'Form a Team',
    description: 'Create a team or join existing ones. Invite members and collaborate on your project.',
    gradient: 'from-purple-500 to-pink',
  },
  {
    icon: Upload,
    title: 'Submit',
    description: 'Work through the stages and submit your work. Get scored and advance to the next round.',
    gradient: 'from-pink to-orange-500',
  },
  {
    icon: Trophy,
    title: 'Win',
    description: 'Top teams get recognized with awards and prizes. Showcase your achievement to the world.',
    gradient: 'from-orange-500 to-accent',
  },
];

export function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-14 text-center"
      >
        <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">How It Works</h2>
        <p className="mt-3 text-lg text-text-muted">
          From registration to victory in four simple steps
        </p>
      </motion.div>

      <div className="relative">
        <div className="absolute left-1/2 top-0 hidden h-full w-px bg-gradient-to-b from-accent via-pink to-accent md:block" />

        <div className="grid gap-12 md:grid-cols-2 md:gap-x-12 md:gap-y-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative flex flex-col items-center text-center md:items-start md:text-left ${
                index % 2 === 1 ? 'md:mt-16' : ''
              }`}
            >
              <div className={`relative z-10 mb-4 rounded-xl bg-gradient-to-br ${step.gradient} p-3`}>
                <step.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-text-primary">{step.title}</h3>
              <p className="max-w-sm text-sm text-text-muted">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
