"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/* ===== NAV ===== */
export function Nav() {
  return (
    <header className="nav">
      <Link href="/" className="brand">
        <span className="brand-mark serif">S$</span>
        <span className="brand-name">SplitSmart</span>
      </Link>
      <nav className="nav-links mono">
        <a href="#how">How it works</a>
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
      </nav>
      <Link href="/login" className="nav-signin mono">Sign in →</Link>
    </header>
  );
}

/* ===== MARQUEE ===== */
export function ScrollMarquee() {
  const items = [
    "$1,284,506 settled this month",
    "Zero awkward Venmo requests",
    "Equal · Exact · % · Shares",
    "Snap a receipt. We do the math.",
    "Multi-currency by default",
    "Built for trips, roommates & couples",
  ];
  const loop = [...items, ...items, ...items];
  return (
    <div className="marquee mono">
      <div className="marquee-track">
        {loop.map((t, i) => (
          <span key={i} className="marquee-item">
            <span className="marquee-dot">●</span>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ===== STAT STRIP ===== */
export function StatStrip() {
  return (
    <div className="stat-strip">
      <Stat num="12.4M" label="expenses logged" />
      <Stat num="183"   label="countries" />
      <Stat num="$0"    label="to use, forever" />
      <Stat num="2.1s"  label="avg. expense add" />
    </div>
  );
}
function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div className="stat">
      <div className="stat-num serif">{num}</div>
      <div className="stat-label mono">{label}</div>
    </div>
  );
}

/* ===== HOW IT WORKS ===== */
const STEPS = [
  { n: "01", title: "Snap it",   text: "Drop a photo of the receipt. Our scanner reads merchant, total, and line items." },
  { n: "02", title: "Split it",  text: "Equal, exact, percentage, or shares. Pick people, pick the math, done." },
  { n: "03", title: "Settle it", text: "We collapse every IOU in the group into one clean transfer per person." },
];
export function HowItWorks() {
  const [step, setStep] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s % 3) + 1), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="how" className="howit">
      <div className="section-rule" />
      <div className="section-head">
        <div className="section-num mono">§ 02</div>
        <h2 className="section-title serif">
          Three steps. <em>That&rsquo;s the whole app.</em>
        </h2>
      </div>
      <div className="howit-grid">
        <div className="howit-steps">
          {STEPS.map((s, i) => (
            <button
              key={s.n}
              className={`step-row ${step === i + 1 ? "active" : ""}`}
              onClick={() => setStep(i + 1)}
              type="button"
            >
              <div className="step-num mono">{s.n}</div>
              <div className="step-body">
                <div className="step-title serif">{s.title}</div>
                <div className="step-text">{s.text}</div>
              </div>
              <div className="step-bar">
                <div
                  className="step-fill"
                  key={step === i + 1 ? "on" : "off"}
                  style={{
                    animationPlayState: step === i + 1 ? "running" : "paused",
                    opacity: step === i + 1 ? 1 : 0,
                  }}
                />
              </div>
            </button>
          ))}
        </div>
        <div className="howit-phone">
          <PhoneMock step={step} />
          <div className="phone-glow" />
        </div>
      </div>
    </section>
  );
}

function PhoneMock({ step }: { step: number }) {
  return (
    <div className="phone">
      <div className="phone-notch" />
      <div className="phone-screen">
        <div className="phone-status mono">
          <span>9:41</span>
          <span>SplitSmart</span>
        </div>
        {step === 1 && <PhoneStep1 />}
        {step === 2 && <PhoneStep2 />}
        {step === 3 && <PhoneStep3 />}
      </div>
    </div>
  );
}
function PhoneStep1() {
  return (
    <div className="phone-body">
      <div className="phone-title serif">New expense</div>
      <div className="phone-receipt">
        <div className="phone-receipt-head mono">SCANNING…</div>
        <div className="phone-receipt-lines">
          <div className="rline"><span>Pad Thai</span><span>14.00</span></div>
          <div className="rline"><span>Som Tum</span><span>11.00</span></div>
          <div className="rline"><span>Singha ×3</span><span>18.00</span></div>
          <div className="rline tot"><span>Total</span><span>52.84</span></div>
        </div>
        <div className="phone-scanline" />
      </div>
      <div className="phone-chip mono">
        <span className="chip-dot" />
        Detected: Thai food · Bangkok · THB
      </div>
    </div>
  );
}
function PhoneStep2() {
  const people = [
    { n: "Mira", c: "#1f5c3b", a: "$13.21" },
    { n: "Theo", c: "#e16850", a: "$13.21" },
    { n: "Ada",  c: "#7a4914", a: "$13.21" },
    { n: "You",  c: "#1c3a6e", a: "$13.21" },
  ];
  return (
    <div className="phone-body">
      <div className="phone-title serif">Split four ways</div>
      <div className="splitters">
        {people.map((p, i) => (
          <div className="splitter" key={i}>
            <div className="avatar" style={{ background: p.c }}>{p.n[0]}</div>
            <div className="splitter-name">{p.n}</div>
            <div className="splitter-bar">
              <div className="splitter-fill" style={{ width: "25%", background: p.c }} />
            </div>
            <div className="splitter-amt mono">{p.a}</div>
          </div>
        ))}
      </div>
      <div className="phone-segment mono">
        <button className="seg seg-on" type="button">EQUAL</button>
        <button className="seg" type="button">EXACT</button>
        <button className="seg" type="button">%</button>
      </div>
    </div>
  );
}
function PhoneStep3() {
  return (
    <div className="phone-body">
      <div className="phone-title serif">Settle up</div>
      <div className="balance-list">
        <BalanceRow color="#1f5c3b" letter="M" name="Mira owes you" amt="+$42.10" sign="pos" />
        <BalanceRow color="#e16850" letter="T" name="You owe Theo"   amt="−$18.50" sign="neg" />
        <BalanceRow color="#7a4914" letter="A" name="Ada owes you"   amt="+$7.25"  sign="pos" />
      </div>
      <button className="settle-btn mono" type="button">
        Settle all → <span className="serif">$30.85</span>
      </button>
    </div>
  );
}
function BalanceRow({ color, letter, name, amt, sign }:
  { color: string; letter: string; name: string; amt: string; sign: "pos" | "neg" }) {
  return (
    <div className="bal-row">
      <div className="avatar sm" style={{ background: color }}>{letter}</div>
      <div className="bal-name">{name}</div>
      <div className={`bal-amt mono ${sign}`}>{amt}</div>
    </div>
  );
}

/* ===== FEATURE GRID ===== */
export function FeatureGrid() {
  return (
    <section id="features" className="features">
      <div className="section-rule" />
      <div className="section-head">
        <div className="section-num mono">§ 03</div>
        <h2 className="section-title serif">
          Built for the <em>messy</em> middle of group spending.
        </h2>
      </div>
      <div className="feature-grid">
        <FeatureCard
          tag="MATH"
          title="Smart splitting"
          desc="Equal, exact, percentage, or weighted shares — the math is on us."
          kicker="Track every shared expense and see who owes whom in seconds."
          art={<LedgerArt />}
        />
        <FeatureCard
          tag="AI"
          title="AI receipt scanner"
          desc="Snap a photo. Gemini fills the form. You confirm in one tap."
          kicker="Extracts merchant, total, date, line items, and category — instantly."
          art={<ScannerArt />}
        />
        <FeatureCard
          tag="FX"
          title="Multi-currency"
          desc="Cross-border trips with no math headaches."
          kicker="Log expenses in any currency — balances reconcile to your group base."
          art={<CurrencyArt />}
        />
      </div>
    </section>
  );
}
function FeatureCard({ tag, title, desc, kicker, art }:
  { tag: string; title: string; desc: string; kicker: string; art: React.ReactNode }) {
  return (
    <article className="feat">
      <div className="feat-tag mono">{tag}</div>
      <div className="feat-art">{art}</div>
      <h3 className="feat-title serif">{title}</h3>
      <p className="feat-desc">{desc}</p>
      <p className="feat-kicker">{kicker}</p>
    </article>
  );
}
function LedgerArt() {
  const rows = [
    { who: "Mira", what: "Groceries", amt: "$84.20" },
    { who: "Theo", what: "Gas",       amt: "$42.00" },
    { who: "You",  what: "Pad Thai",  amt: "$52.84" },
    { who: "Ada",  what: "Movie",     amt: "$36.00" },
  ];
  return (
    <div className="art ledger-art">
      {rows.map((r, i) => (
        <div key={i} className="ledger-row mono">
          <span className="led-who">{r.who}</span>
          <span className="led-dash">····························</span>
          <span className="led-what">{r.what}</span>
          <span className="led-amt">{r.amt}</span>
        </div>
      ))}
      <div className="ledger-total mono"><span>SUBTOTAL</span><span>$215.04</span></div>
    </div>
  );
}
function ScannerArt() {
  return (
    <div className="art scanner-art">
      <div className="scan-receipt">
        <div className="scan-head">CAFÉ NORD</div>
        <div className="scan-line"><span>Espresso ×2</span><span>6.00</span></div>
        <div className="scan-line"><span>Croissant</span><span>3.50</span></div>
        <div className="scan-line"><span>Tartine</span><span>9.50</span></div>
        <div className="scan-tot"><span>TOTAL</span><span>19.00 €</span></div>
        <div className="scan-bars">
          <div /><div /><div /><div /><div /><div /><div />
        </div>
      </div>
      <div className="scan-bracket tl" />
      <div className="scan-bracket tr" />
      <div className="scan-bracket bl" />
      <div className="scan-bracket br" />
    </div>
  );
}
function CurrencyArt() {
  return (
    <div className="art currency-art">
      <FxRow from="$100"   to="€92.40" />
      <FxRow from="£50"    to="¥9,420" />
      <FxRow from="₹2,000" to="$24.10" />
      <div className="fx-foot mono">Rates updated 4 min ago</div>
    </div>
  );
}
function FxRow({ from, to }: { from: string; to: string }) {
  return (
    <div className="fx-row">
      <span className="fx-from serif">{from}</span>
      <span className="fx-arrow">→</span>
      <span className="fx-to serif">{to}</span>
    </div>
  );
}

/* ===== QUOTE ===== */
export function QuoteSection() {
  return (
    <section className="quote">
      <div className="quote-mark serif">&ldquo;</div>
      <p className="quote-text serif">
        The first app I&rsquo;ve used where settling up actually feels{" "}
        <em>good</em>. Our group chat is finally just memes again.
      </p>
      <div className="quote-attr mono">
        <span className="quote-avatar" style={{ background: "#1f5c3b" }}>M</span>
        Mira — Lisbon · 6-person trip
      </div>
    </section>
  );
}

/* ===== FINAL CTA ===== */
export function FinalCTA() {
  return (
    <section className="final">
      <div className="final-inner">
        <div className="final-eyebrow mono">§ 04 — GET STARTED</div>
        <h2 className="final-title serif">
          Stop chasing receipts.
          <br />
          <em>Start splitting smart.</em>
        </h2>
        <div className="final-ctas">
          <Link href="/register" className="btn btn-primary btn-lg">
            <span>Create your free account</span>
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/login" className="btn btn-ghost btn-lg">I already have one</Link>
        </div>
        <div className="final-meta mono">
          NO CREDIT CARD · NO ADS · WORKS OFFLINE · 30-SEC SETUP
        </div>
      </div>
    </section>
  );
}

/* ===== FOOTER ===== */
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <span className="brand-mark serif">S$</span>
          <span className="brand-name">SplitSmart</span>
        </div>
        <div className="footer-cols">
          <div>
            <div className="foot-h mono">Product</div>
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Changelog</a>
          </div>
          <div>
            <div className="foot-h mono">Company</div>
            <a href="#">About</a>
            <a href="#">Press</a>
            <a href="#">Careers</a>
          </div>
          <div>
            <div className="foot-h mono">Legal</div>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </div>
      <div className="footer-bot mono">
        <span>© 2026 SplitSmart Inc.</span>
        <span>Made for friends who still want to be friends.</span>
      </div>
    </footer>
  );
}
