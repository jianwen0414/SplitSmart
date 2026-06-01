"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

import {
  Nav,
  ScrollMarquee,
  StatStrip,
  HowItWorks,
  FeatureGrid,
  QuoteSection,
  FinalCTA,
  Footer,
} from "@/components/landing/Sections";

import "../styles/landing.css";

const HeroScene = dynamic(() => import("@/components/landing/HeroScene"), { ssr: false });

export default function LandingPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) router.replace("/groups");
  }, [loading, session, router]);

  return (
    <main className="ss-page">
      <Nav />

      <section className="hero">
        <div className="hero-stage">
          <HeroScene />
          <div className="hero-text-layer">
            <div className="hero-copy">
              <div className="eyebrow mono">
                <span className="eyebrow-dot" />
                FOR ROOMMATES, TRIPS, &amp; EVERY DINNER IN-BETWEEN
              </div>

              <h1 className="hero-title serif">
                Split <em>expenses.</em>
                <br />
                Not <span className="hero-strike">friendships.</span>
              </h1>

              <p className="hero-sub">
                Track who paid, who owes, and settle the whole thing in a tap. No math, no
                spreadsheets, no &ldquo;I&rsquo;ll Venmo you later.&rdquo;
              </p>

              <div className="hero-ctas">
                <Link href="/register" className="btn btn-primary">
                  <span>Get started</span>
                  <svg
                    viewBox="0 0 24 24"
                    width={16}
                    height={16}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href="/login" className="btn btn-ghost">
                  Sign in
                </Link>
              </div>

              <div className="hero-hint mono">
                <span className="hero-hint-arrow">↳</span>
                Try it — grab the money. Tap a coin to flip.
              </div>
            </div>
          </div>
        </div>
      </section>

      <ScrollMarquee />
      <StatStrip />
      <HowItWorks />
      <FeatureGrid />
      <QuoteSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}
