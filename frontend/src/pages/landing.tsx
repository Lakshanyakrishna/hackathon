import { HeroSection } from '@/components/landing/hero-section';
import { FeaturedHackathons } from '@/components/landing/featured-hackathons';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { CTASection } from '@/components/landing/cta-section';

export function LandingPage() {
  return (
    <div>
      <HeroSection />
      <FeaturedHackathons />
      <HowItWorksSection />
      <CTASection />
    </div>
  );
}
