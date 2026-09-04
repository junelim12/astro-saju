"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Day Master (stem+element) -> temperament subtitle */
const DAY_PILLAR_SUBTITLES: Record<string, string> = {
  갑목: "The drive of a great tree growing straight and tall",
  을목: "A tenacious, adaptable life force hidden beneath a soft exterior",
  병화: "The sun that becomes the center of the world",
  정화: "Moonlit warmth paired with sharp, discerning insight",
  무토: "A tall mountain that embraces everything around it and inspires trust",
  기토: "Solid, grounded earth that nurtures everything around it",
  경금: "A sense of justice built on standards only you can see",
  신금: "A refined, detail-oriented mind that chases perfection",
  임수: "Deep wisdom churning beneath a calm sea",
  계수: "Rich sensitivity and charm that wins people over wherever you go",
};

type AnalyzeResponse = {
  one_line: string;
  personality: string;
  career: string;
  /** Jobs that fit you — Saju / Stars logic, ranked by fit (3-5 items) */
  careerJobsSaju?: string[];
  careerJobsZodiac?: string[];
  /** Industries to explore — Saju / Stars logic, ranked by fit (3-5 items) */
  careerIndustriesSaju?: string[];
  careerIndustriesZodiac?: string[];
  love: string;
  /** Love — who you might marry / what to watch out for */
  loveSpousePrediction?: string;
  loveCaution?: string;
  destiny: string;
  /** Temperament paragraph 1 (all four pillars), paragraph 2 (day pillar) — used on the temperament card when present */
  personality_1?: string;
  personality_2?: string;
  /** Combined Saju + Astrology paragraph — used at the top section when present */
  personality_3?: string;
  /** Used to look up the temperament subtitle */
  dayStem?: string;
  stemElement?: string;
  /** Sun/Moon/Rising signs — no longer shown as their own cards, but the AI still uses them as input */
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
  /** Assumptions / limitations behind this reading */
  analysisLogs?: string[];
};

function splitParagraphs(text: string) {
  if (!text || typeof text !== "string") return [];
  return text
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-saju-text mb-1">{children}</h2>;
}

/** Subtitle: uses the vivid purple accent color */
function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-medium mb-3 text-saju-accent">
      {children}
    </p>
  );
}

function BodyText({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm text-saju-text leading-relaxed space-y-4">
      {children}
    </div>
  );
}

function SkeletonCard({
  title,
  items,
  text,
  children,
}: {
  title: string;
  /** Recommendations ranked by fit, highest first (3-5 items). Rendered as a list when present. */
  items?: string[];
  /** Paragraph text, rendered when there are no items */
  text?: string;
  children?: React.ReactNode;
}) {
  const paragraphs = text ? splitParagraphs(text) : [];
  return (
    <div className="bg-saju-surface rounded-2xl px-5 py-4 border border-saju-border">
      <p className="text-xs font-medium text-saju-muted mb-2">{title}</p>
      <div className="min-h-[60px] text-sm">
        {items && items.length > 0 ? (
          <ul className="space-y-1.5 list-disc list-inside marker:text-saju-muted text-saju-text">
            {items.map((item, i) => (
              <li key={i} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        ) : paragraphs.length > 0 ? (
          <div className="text-saju-text leading-relaxed space-y-2">
            {paragraphs.map((p, i) => (
              <p key={i} className="mb-0">
                {p}
              </p>
            ))}
          </div>
        ) : (
          children ?? (
            <span className="italic text-saju-muted">(Coming soon)</span>
          )
        )}
      </div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [userName, setUserName] = useState("You");

  useEffect(() => {
    const savedData = localStorage.getItem("sajuResult");
    const savedName = localStorage.getItem("userName");
    if (savedName) setUserName(savedName);

    if (!savedData) {
      alert("No results found. Please try again.");
      router.replace("/");
      return;
    }

    try {
      const parsedData = JSON.parse(savedData);
      setResult(parsedData);
    } catch (error) {
      console.error("JSON parse error:", error);
      alert("We couldn't load your results.");
      router.replace("/");
    }
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen bg-saju-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-saju-text mb-2">
            Loading your results...
          </p>
          <p className="text-sm text-saju-muted">Just a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-saju-bg flex justify-center px-4 py-8 pb-16">
      <div className="w-full max-w-md">
        <header className="mb-8">
          <h1 className="text-xl font-bold text-saju-text flex items-center gap-2">
            Your Reading
            <span className="text-saju-accent" aria-hidden>🔮</span>
          </h1>
        </header>

        <div className="space-y-8">
          {/* 1. Personality — Astrology meets Saju (top) */}
          <section>
            <SectionTitle>{userName}&apos;s Personality: Astrology Meets Saju</SectionTitle>
            <div className="bg-saju-surface rounded-2xl px-5 py-4 border border-saju-border">
              <BodyText>
                {(() => {
                  const third =
                    result.personality_3 ??
                    splitParagraphs(result.personality)[2];
                  return third ? (
                    <p className="mb-0">{third}</p>
                  ) : (
                    <p className="text-saju-muted">No analysis available.</p>
                  );
                })()}
              </BodyText>
            </div>
          </section>

          {/* 2. What Your Saju Says (2 paragraphs: all pillars combined + day pillar) */}
          <section>
            <SectionTitle>What Your Saju Says About {userName}&apos;s Temperament</SectionTitle>
            <SubTitle>
              {result.dayStem && result.stemElement
                ? DAY_PILLAR_SUBTITLES[`${result.dayStem}${result.stemElement}`] ??
                  "Solid, grounded earth that forms a steady center"
                : "Solid, grounded earth that forms a steady center"}
            </SubTitle>
            <div className="bg-saju-surface rounded-2xl px-5 py-4 border border-saju-border">
              <BodyText>
                {(() => {
                  const para1 = result.personality_1;
                  const para2 = result.personality_2;
                  const useStructured =
                    para1 !== undefined || para2 !== undefined;
                  const firstTwo = useStructured
                    ? [para1, para2].filter(Boolean)
                    : splitParagraphs(result.personality).slice(0, 2);
                  return firstTwo.length > 0 ? (
                    firstTwo.map((p, i) => (
                      <p key={i} className="mb-4 last:mb-0">
                        {p}
                      </p>
                    ))
                  ) : (
                    <p className="text-saju-muted">No analysis available.</p>
                  );
                })()}
              </BodyText>
            </div>
          </section>

          {/* 3. Career & Work */}
          <section>
            <SectionTitle>Career &amp; Work</SectionTitle>
            <SubTitle>Jobs That Fit You</SubTitle>
            <div className="space-y-3 mb-4">
              <SkeletonCard title="From Your Saju ✨" items={result.careerJobsSaju} />
              <SkeletonCard title="From Your Stars ✨" items={result.careerJobsZodiac} />
            </div>
            <SubTitle>Industries to Explore</SubTitle>
            <div className="space-y-3 mb-4">
              <SkeletonCard title="From Your Saju ✨" items={result.careerIndustriesSaju} />
              <SkeletonCard title="From Your Stars ✨" items={result.careerIndustriesZodiac} />
            </div>
            <SubTitle>{userName}&apos;s Work Style &amp; Communication</SubTitle>
            <div className="bg-saju-surface rounded-2xl px-5 py-4 border border-saju-border mb-4">
              <BodyText>
                {splitParagraphs(result.career).length > 0 ? (
                  splitParagraphs(result.career).map((p, i) => (
                    <p key={i} className="mb-4 last:mb-0">
                      {p}
                    </p>
                  ))
                ) : (
                  <p className="text-saju-muted">No analysis available.</p>
                )}
              </BodyText>
            </div>
          </section>

          {/* 4. Love Life */}
          <section>
            <SectionTitle>{userName}&apos;s Love Life</SectionTitle>
            <SubTitle>Who You&apos;re Drawn To</SubTitle>
            <div className="bg-saju-surface rounded-2xl px-5 py-4 border border-saju-border mb-4">
              <BodyText>
                {splitParagraphs(result.love).length > 0 ? (
                  splitParagraphs(result.love).map((p, i) => (
                    <p key={i} className="mb-4 last:mb-0">
                      {p}
                    </p>
                  ))
                ) : (
                  <p className="text-saju-muted">No analysis available.</p>
                )}
              </BodyText>
            </div>
            <div className="space-y-3">
              <SkeletonCard title="Who You Might Marry" text={result.loveSpousePrediction} />
              <SkeletonCard title="Watch Out For" text={result.loveCaution} />
            </div>
          </section>

          {/* 5. What the Stars & Your Chart Whisper About Your Destiny */}
          <section>
            <SectionTitle>
              What the Stars &amp; {userName}&apos;s Chart Whisper About the Future
            </SectionTitle>
            <div className="bg-saju-surface rounded-2xl px-5 py-4 border border-saju-border">
              <BodyText>
                {splitParagraphs(result.destiny).length > 0 ? (
                  splitParagraphs(result.destiny).map((p, i) => (
                    <p key={i} className="mb-4 last:mb-0">
                      {p}
                    </p>
                  ))
                ) : (
                  <p className="text-saju-muted">No analysis available.</p>
                )}
              </BodyText>
            </div>
          </section>

          {/* Notes on this reading (assumptions & limitations) */}
          {result.analysisLogs && result.analysisLogs.length > 0 && (
            <section className="mt-6">
              <details className="bg-saju-border/30 rounded-2xl px-4 py-3 border border-saju-border">
                <summary className="text-sm font-medium text-saju-muted cursor-pointer list-none flex items-center gap-2">
                  <span className="text-saju-muted">About This Reading</span>
                  <span className="text-xs">(assumptions &amp; limitations)</span>
                </summary>
                <ul className="mt-3 space-y-2 text-xs text-saju-muted pl-0 list-disc list-inside">
                  {result.analysisLogs.map((log, i) => (
                    <li key={i}>{log}</li>
                  ))}
                </ul>
              </details>
            </section>
          )}
        </div>

        <div className="pt-10 pb-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full py-3.5 rounded-2xl bg-saju-accent text-white text-sm font-semibold shadow-md shadow-saju-accent/20 hover:bg-saju-accent-hover active:scale-[0.98] transition"
          >
            Start a New Reading
          </button>
        </div>
      </div>
    </main>
  );
}
