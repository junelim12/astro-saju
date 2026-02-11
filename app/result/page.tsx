"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SUN_SIGN_DESCRIPTIONS,
  MOON_SIGN_DESCRIPTIONS,
  RISING_SIGN_DESCRIPTIONS,
} from "@/lib/zodiacDescriptions";

type AnalyzeResponse = {
  one_line: string;
  personality: string;
  career: string;
  love: string;
  investment: string;
  destiny: string;
  /** 재물과 투자 — 전반적인 재물운 (상세 카드용) */
  investmentWealth?: string;
  /** 재물과 투자 — 투자성향 (상세 카드용) */
  investmentStyle?: string;
  /** 재물과 투자 — 주의해야 할 점 (상세 카드용) */
  investmentCaution?: string;
  /** 별자리 카드: 태양별자리 한글명 (예: 처녀자리) */
  sunSign?: string;
  /** 별자리 카드: 달별자리 한글명 */
  moonSign?: string;
  /** 별자리 카드: 상승궁 한글명 */
  risingSign?: string;
};

function splitParagraphs(text: string) {
  if (!text || typeof text !== "string") return [];
  return text
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-black mb-1">{children}</h2>;
}

/** 서브타이틀: #8F35AD (보라) */
function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-medium mb-3" style={{ color: "#8F35AD" }}>
      {children}
    </p>
  );
}

function BodyText({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm text-black leading-relaxed space-y-4">
      {children}
    </div>
  );
}

function SkeletonCard({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl px-5 py-4 border border-saju-border">
      <p className="text-xs font-medium text-saju-muted mb-2">{title}</p>
      <div className="min-h-[60px] text-sm text-saju-muted">
        {children ?? <span className="italic">(추후 채워넣을 영역)</span>}
      </div>
    </div>
  );
}

/** 별자리가 말하는 00님 — Sun / Moon / 상승궁 카드 (별자리명 → 하드코딩 설명) */
const ZODIAC_CARD_CONFIG: readonly {
  key: "sunSign" | "moonSign" | "risingSign";
  label: string;
  emoji: string;
  description: string;
  descriptionsMap: Record<string, string>;
}[] = [
  {
    key: "sunSign",
    label: "Sun Sign (태양별자리)",
    emoji: "☀️",
    description: "외부에 드러나는 에너지, 본질적인 성향",
    descriptionsMap: SUN_SIGN_DESCRIPTIONS,
  },
  {
    key: "moonSign",
    label: "Moon Sign (달별자리)",
    emoji: "🌙",
    description: "내면의 감정과 욕구, 숨겨진 나",
    descriptionsMap: MOON_SIGN_DESCRIPTIONS,
  },
  {
    key: "risingSign",
    label: "상승궁 (Rising)",
    emoji: "⬆️",
    description: "첫인상과 사회적 가면, 세상에 보이는 모습",
    descriptionsMap: RISING_SIGN_DESCRIPTIONS,
  },
];

function ZodiacCard({
  label,
  emoji,
  description,
  signName,
  descriptionText,
}: {
  label: string;
  emoji: string;
  description: string;
  signName: string | undefined;
  descriptionText: string | undefined;
}) {
  const hasContent = signName && descriptionText;
  return (
    <div className="bg-white rounded-2xl px-5 py-4 border border-saju-border">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl" aria-hidden>
          {emoji}
        </span>
        <div>
          <p className="text-sm font-semibold text-black">{label}</p>
          <p className="text-xs text-saju-muted">{description}</p>
        </div>
      </div>
      <div className="text-sm text-black leading-relaxed mt-3 min-h-[48px]">
        {hasContent ? (
          <>
            <p className="mb-3">
              <strong>별자리: {signName}</strong>
            </p>
            <p className="mb-0">{descriptionText}</p>
          </>
        ) : (
          <span className="italic text-saju-muted">
            (분석 결과에서 별자리 정보를 불러올 수 없습니다)
          </span>
        )}
      </div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [userName, setUserName] = useState("당신");

  useEffect(() => {
    const savedData = localStorage.getItem("sajuResult");
    const savedName = localStorage.getItem("userName");
    if (savedName) setUserName(savedName);

    if (!savedData) {
      alert("분석 결과가 없습니다. 다시 시도해주세요.");
      router.replace("/");
      return;
    }

    try {
      const parsedData = JSON.parse(savedData);
      setResult(parsedData);
    } catch (error) {
      console.error("JSON 파싱 에러:", error);
      alert("결과를 읽을 수 없습니다.");
      router.replace("/");
    }
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-black mb-2">
            결과를 불러오는 중입니다...
          </p>
          <p className="text-sm text-saju-muted">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#ffffff] flex justify-center px-4 py-8 pb-16">
      <div className="w-full max-w-md">
        <header className="mb-8">
          <h1 className="text-xl font-bold text-black flex items-center gap-2">
            분석 결과
            <span className="text-purple-500" aria-hidden>🔮</span>
          </h1>
        </header>

        <div className="space-y-8">
          {/* 1. 사주가 이야기하는 00님의 기질 */}
          <section>
            <SectionTitle>사주가 이야기하는 {userName}님의 기질</SectionTitle>
            <SubTitle>흙의 사주가 만드는 단단한 중심</SubTitle>
            <div className="bg-white rounded-2xl px-5 py-4 border border-saju-border">
              <BodyText>
                {splitParagraphs(result.personality).length > 0 ? (
                  splitParagraphs(result.personality).map((p, i) => (
                    <p key={i} className="mb-4 last:mb-0">
                      {p}
                    </p>
                  ))
                ) : (
                  <p className="text-saju-muted">분석 내용이 없습니다.</p>
                )}
              </BodyText>
            </div>
          </section>

          {/* 2. 별자리가 말하는 00님 — Sun / Moon / 상승궁 (LLM 결과 + 이모지) */}
          <section>
            <SectionTitle>별자리가 말하는 {userName}님</SectionTitle>
            <SubTitle>태양·달·상승궁으로 읽는 당신</SubTitle>
            <div className="space-y-4">
              {ZODIAC_CARD_CONFIG.map((item) => {
                const signName = result[item.key];
                const descriptionText = signName
                  ? item.descriptionsMap[signName]
                  : undefined;
                return (
                  <ZodiacCard
                    key={item.key}
                    label={item.label}
                    emoji={item.emoji}
                    description={item.description}
                    signName={signName}
                    descriptionText={descriptionText}
                  />
                );
              })}
            </div>
          </section>

          {/* 3. 직업과 진로 */}
          <section>
            <SectionTitle>직업과 진로</SectionTitle>
            <SubTitle>어울리는 직업</SubTitle>
            <div className="space-y-3 mb-4">
              <SkeletonCard title="사주 추천 ✨" />
              <SkeletonCard title="별자리 추천 ✨" />
            </div>
            <SubTitle>추천 산업</SubTitle>
            <div className="space-y-3 mb-4">
              <SkeletonCard title="사주 추천 ✨" />
              <SkeletonCard title="별자리 추천 ✨" />
            </div>
            <SubTitle>{userName}님의 업무 스타일과 소통 방식</SubTitle>
            <div className="bg-white rounded-2xl px-5 py-4 border border-saju-border mb-4">
              <BodyText>
                {splitParagraphs(result.career).length > 0 ? (
                  splitParagraphs(result.career).map((p, i) => (
                    <p key={i} className="mb-4 last:mb-0">
                      {p}
                    </p>
                  ))
                ) : (
                  <p className="text-saju-muted">분석 내용이 없습니다.</p>
                )}
              </BodyText>
            </div>
            <SkeletonCard title="추천 이직 시기" />
            <div className="mt-3">
              <SkeletonCard title="은퇴 시절 예측" />
            </div>
          </section>

          {/* 4. 00님의 로맨스 */}
          <section>
            <SectionTitle>{userName}님의 로맨스</SectionTitle>
            <SubTitle>끌리는 상대 특징</SubTitle>
            <div className="bg-white rounded-2xl px-5 py-4 border border-saju-border mb-4">
              <BodyText>
                {splitParagraphs(result.love).length > 0 ? (
                  splitParagraphs(result.love).map((p, i) => (
                    <p key={i} className="mb-4 last:mb-0">
                      {p}
                    </p>
                  ))
                ) : (
                  <p className="text-saju-muted">분석 내용이 없습니다.</p>
                )}
              </BodyText>
            </div>
            <SkeletonCard title="어울리는 나이차이" />
            <div className="mt-3">
              <SkeletonCard title="이별을 결심하는 계기" />
            </div>
            <div className="mt-3">
              <SkeletonCard title="결혼을 결심하는 계기" />
            </div>
            <SkeletonCard title="추천 결혼 시기" />
            <div className="mt-3">
              <SkeletonCard title="결혼 상대 예측" />
            </div>
            <div className="mt-3">
              <SkeletonCard title="주의해야 할 연애" />
            </div>
          </section>

          {/* 5. 재물과 투자 — 운명 속삭임 위에, 3개 상세 카드 */}
          <section>
            <SectionTitle>재물과 투자</SectionTitle>
            <SubTitle>재물운·투자성향·주의사항</SubTitle>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl px-5 py-4 border border-saju-border">
                <p className="text-xs font-medium text-saju-muted mb-2">
                  {userName}님의 전반적인 재물운
                </p>
                <div className="text-sm text-black leading-relaxed min-h-[48px]">
                  {result.investmentWealth ? (
                    splitParagraphs(result.investmentWealth).map((p, i) => (
                      <p key={i} className="mb-3 last:mb-0">
                        {p}
                      </p>
                    ))
                  ) : (typeof result.investment === "string" && result.investment.trim().length > 0) ? (
                    splitParagraphs(result.investment).map((p, i) => (
                      <p key={i} className="mb-3 last:mb-0">
                        {p}
                      </p>
                    ))
                  ) : (
                    <span className="italic text-saju-muted">
                      (추후 채워넣을 영역)
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-2xl px-5 py-4 border border-saju-border">
                <p className="text-xs font-medium text-saju-muted mb-2">
                  {userName}님의 투자성향
                </p>
                <div className="text-sm text-black leading-relaxed min-h-[48px]">
                  {result.investmentStyle ? (
                    splitParagraphs(result.investmentStyle).map((p, i) => (
                      <p key={i} className="mb-3 last:mb-0">
                        {p}
                      </p>
                    ))
                  ) : (
                    <span className="italic text-saju-muted">
                      (추후 채워넣을 영역)
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-2xl px-5 py-4 border border-saju-border">
                <p className="text-xs font-medium text-saju-muted mb-2">
                  주의해야 할 점
                </p>
                <div className="text-sm text-black leading-relaxed min-h-[48px]">
                  {result.investmentCaution ? (
                    splitParagraphs(result.investmentCaution).map((p, i) => (
                      <p key={i} className="mb-3 last:mb-0">
                        {p}
                      </p>
                    ))
                  ) : (
                    <span className="italic text-saju-muted">
                      (추후 채워넣을 영역)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 6. 운명을 바라보는 별과 사주의 속삭임 */}
          <section>
            <SectionTitle>
              {userName}님의 운명을 바라보는 별과 사주의 속삭임
            </SectionTitle>
            <div className="bg-white rounded-2xl px-5 py-4 border border-saju-border">
              <BodyText>
                {splitParagraphs(result.destiny).length > 0 ? (
                  splitParagraphs(result.destiny).map((p, i) => (
                    <p key={i} className="mb-4 last:mb-0">
                      {p}
                    </p>
                  ))
                ) : (
                  <p className="text-saju-muted">분석 내용이 없습니다.</p>
                )}
              </BodyText>
            </div>
          </section>
        </div>

        <div className="pt-10 pb-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full py-3.5 rounded-2xl bg-black text-white text-sm font-semibold shadow-md hover:bg-black/90 active:scale-[0.98] transition"
          >
            공유하기
          </button>
        </div>
      </div>
    </main>
  );
}
