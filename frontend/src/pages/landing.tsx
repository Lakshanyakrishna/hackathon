import { HeroSection } from '@/components/landing/hero-section';
import { SocialProofSection } from '@/components/landing/social-proof-section';
import { LiveStatsSection } from '@/components/landing/live-stats-section';
import { FeaturedHackathons } from '@/components/landing/featured-hackathons';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { WinnerShowcasePreview } from '@/components/landing/winner-showcase-preview';
import { WinnerSpotlightSection } from '@/components/landing/winner-spotlight-section';
import { FAQSection } from '@/components/landing/faq-section';
import { CTASection } from '@/components/landing/cta-section';

export function LandingPage() {
  return (
    <div>
      <HeroSection />
      <SocialProofSection />
      <LiveStatsSection />
      <FeaturedHackathons />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <WinnerSpotlightSection />
      <WinnerShowcasePreview />
      <FAQSection />
      <CTASection />
    </div>
  );
}
