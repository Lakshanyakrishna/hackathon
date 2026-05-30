import { motion } from 'framer-motion';

const partners = [
  'MIT', 'Stanford', 'Google', 'Microsoft', 'Amazon', 'Meta',
];

export function SocialProofSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <p className="mb-8 text-sm font-medium text-text-muted uppercase tracking-wider">
          Trusted by leading organizations
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {partners.map((partner, index) => (
            <motion.div
              key={partner}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="text-lg font-semibold text-text-muted/50 grayscale hover:grayscale-0 hover:text-text-muted transition-all duration-300"
            >
              {partner}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
