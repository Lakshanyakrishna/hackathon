import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

const faqs = [
  {
    question: 'What is a hackathon?',
    answer: 'A hackathon is a time-bound event where participants collaborate to build innovative solutions to challenges. Teams work on projects, submit their work across multiple stages, and compete for prizes.',
  },
  {
    question: 'How do teams work?',
    answer: 'You can create a team or join an existing one. Teams have a leader who manages invitations and settings. Members collaborate on submissions throughout the hackathon stages.',
  },
  {
    question: 'How are winners selected?',
    answer: 'Winners are selected based on their performance across all stages. Each stage has configurable evaluation criteria and promotion rules. The organizer reviews submissions and scores teams.',
  },
  {
    question: 'Is there a registration fee?',
    answer: 'Registration fees vary by hackathon. Some are free, while others may have a fee. All fees are clearly displayed on the hackathon page before registration.',
  },
  {
    question: 'Can I participate solo?',
    answer: 'Yes, if the hackathon allows solo registration. You can register individually and participate without a team. Check the hackathon details for team size requirements.',
  },
  {
    question: 'How do payments work?',
    answer: 'Payments are processed securely through Razorpay. Your payment is only captured when you complete the registration. Refunds are processed according to the hackathon policy.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-10 text-center"
      >
        <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
          Frequently Asked Questions
        </h2>
        <p className="mt-3 text-lg text-text-muted">
          Everything you need to know about the platform
        </p>
      </motion.div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="rounded-xl border border-border overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-bg-elevated/50"
            >
              <span className="text-sm font-medium text-text-primary">{faq.question}</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-text-muted transition-transform duration-200',
                  openIndex === index && 'rotate-180',
                )}
              />
            </button>
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border px-6 py-4">
                    <p className="text-sm leading-relaxed text-text-muted">{faq.answer}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
