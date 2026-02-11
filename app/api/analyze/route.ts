import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getSaju, getMoonSign, getRisingSign } from "@/lib/sajuConverter";
import { getCoordinates } from "@/lib/geocoder";
import {
  SUN_SIGN_DESCRIPTIONS,
  MOON_SIGN_DESCRIPTIONS,
  RISING_SIGN_DESCRIPTIONS,
} from "@/lib/zodiacDescriptions";

export const maxDuration = 60;

/** 해석 기준: 십성(일간-일지 관계)별 의미 — 키워드 조합이 아닌 이 로직으로만 유도 */
const SIBSEONG_LOGIC = `
- **비겁** (일지가 나와 같은 오행): 동료·경쟁·자기주장·동년배. 재물은 나와 나눠 씀.
- **식상** (일지가 내가 생하는 오행): 표현·창작·소통·자식. 재물은 표현을 통해 벌거나 쓰임.
- **재성** (일지가 내가 극하는 오행): 재물·실행·관리·배우자. 일지에 재성이 있으면 재물에 대한 태도/방식이 이 관계로 해석됨.
- **인성** (일지가 나를 생하는 오행): 학문·귀인·보호·어머니. 일지에 인성이 있으면 배움·보호받음·원조 쪽 성향.
- **관성** (일지가 나를 극하는 오행): 규율·압박·책임·직업·아버지. 일지에 관성이 있으면 원칙·부담·리더십 쪽 성향.
`;
/** 오행별 에너지 — 성격/직업/재물 해석 시 이 의미를 적용 */
const OHENG_LOGIC = `
- 목: 성장·직선·인내·확장. 화: 빛·표현·열정·주목. 토: 중앙·포용·안정·중재. 금: 정의·정리·결단·규칙. 수: 지혜·유동·침착·융통.
`;
/** 연·월·시 지지와 일지 간 합·충·형·파 해석 기준 — 이 데이터가 있으면 반드시 반영 */
const PILLAR_RELATION_GUIDE = `
- **연지-일지**: 뿌리·초년운·가족·출신. **합**=가족/출신과 조화·지원. **충**=초년 변동·가족과 갈등·이동. **형**=부담·압박·갈등. **파**=미묘한 틈·해이.
- **월지-일지**: 부모·청년·사회적 기반. **합**=부모·상사와 조화·귀인. **충**=청년기 변동·관계 갈등. **형**=책임·압박·갈등. **파**=불협화·소원.
- **시지-일지**: 자녀·말년·결과. **합**=자녀·말년과 조화·안정. **충**=말년 변동·자녀와 다른 성향. **형**=말년 부담. **파**=미묘한 거리감.
- 위 관계가 **합**이면 해당 영역(연/월/시)을 긍정적으로, **충·형·파**가 있으면 해당 영역에서 변동·갈등·보완이 필요함을 해석에 반영하라.
`;

export type AnalyzeResponse = {
  one_line: string;
  personality: string;
  personality_1?: string;
  personality_2?: string;
  personality_3?: string;
  career: string;
  love: string;
  investment: string;
  destiny: string;
  dayStem?: string;
  stemElement?: string;
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
  /** 한계·가정·참고사항 — 원인과 해결책 안내 */
  analysisLogs?: string[];
};

function pad2(n: number) {
  return String(Math.trunc(n)).padStart(2, "0");
}

function normalizeToString(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return Object.values(value)
      .filter((v) => typeof v === "string")
      .join("\n\n");
  }
  return String(value);
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key Missing" }, { status: 500 });
    }

    const body = await request.json();

    const year = parseInt(body.year, 10);
    const month = parseInt(body.month, 10);
    const day = parseInt(body.day, 10);
    let hour = parseInt(body.hour, 10);
    const minute = parseInt(body.minute, 10);
    const ampm = body.ampm || "AM";
    const locationInput = body.location || "서울";
    const name = body.name || "내담자";

    if (ampm === "PM" && hour < 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    const geo = getCoordinates(locationInput);
    // Saju 데이터 추출 (zodiac = 태양별자리)
    const { dayPillarCore, activeShinsal, zodiac, pillars, pillarRelations } = getSaju(year, month, day, hour, minute);
    const moonSign = getMoonSign(year, month, day, hour, minute);
    const risingSign = getRisingSign(hour, minute);
    const sunDesc = SUN_SIGN_DESCRIPTIONS[zodiac] ?? "";
    const moonDesc = MOON_SIGN_DESCRIPTIONS[moonSign] ?? "";
    const risingDesc = RISING_SIGN_DESCRIPTIONS[risingSign] ?? "";

    // 한계·가정 로그 (원인 + 해결책)
    const analysisLogs: string[] = [];
    if (!body.location || body.location.trim() === "") {
      analysisLogs.push(
        "원인: 출생지 미입력. 해결: 위치를 입력하면 해당 지역 좌표·시간대로 보정됩니다."
      );
    }
    analysisLogs.push(
      "참고: 상승궁은 생시만으로 근사(2시간당 1궁)하며, 지역별 정확한 상승궁은 출생지·정확 시간이 필요합니다."
    );
    analysisLogs.push(
      "참고: 달별자리는 날짜·시간 기반 근사치이며, 정밀 계산은 천문 데이터가 필요합니다."
    );
    if (activeShinsal.length === 0) {
      analysisLogs.push(
        "참고: 이 사주에는 적용되는 12신살·특수신살이 없어, 신살 항목은 해석에서 제외되었습니다."
      );
    }

    const timeSeed = Number(
      `${year}${pad2(month)}${pad2(day)}${pad2(hour)}${pad2(minute)}`
    );
    const geoSeed = Math.floor((geo.lat + geo.lng) * 1000);
    const finalSeed = timeSeed + geoSeed;

    // 1. System Prompt (기본 설정 & 데이터 주입)
    const SYSTEM_PROMPT = `
You are an expert Fortune Teller who integrates Eastern Four Pillars (Saju) and Western Modern Astrology.

Your Goal:
Provide a personalized, insightful, and "bone-hitting" (sharp & accurate) analysis.
The output language must be **Korean (Polite Honorifics/존댓말)**.

[Naming Convention - VERY IMPORTANT]
- **ALWAYS** use the user's name: **"${name}님"** as the subject of sentences.
- Instead of saying "${dayPillarCore.dayPillar}일주는...", say "${name}님은...".

[Confirmed Analytical Data]
1. Four Pillars (사주): Year(연주)=${pillars.year}, Month(월주)=${pillars.month}, Day(일주)=${pillars.day}, Hour(시주)=${pillars.hour}
   - Day Pillar (일주): ${dayPillarCore.dayPillar} — 일간 ${dayPillarCore.dayStem}(${dayPillarCore.stemElement}), 일지 ${dayPillarCore.dayBranch}(${dayPillarCore.branchElement}), **십성(일간-일지 관계): ${dayPillarCore.structuralRelation}**
2. Western Zodiac (태양=${zodiac}, 달=${moonSign}, 상승=${risingSign})
   - 태양(자아·목표): ${sunDesc}
   - 달(감정·필요): ${moonDesc}
   - 상승(첫인상·행동): ${risingDesc}
3. Active Shinsal:
${activeShinsal.length ? activeShinsal.map(s => `   - ${s.name}: ${s.description}`).join("\n") : "   (없음)"}
4. 연·월·시 지지와 일지(日支) 간 합·충·형·파:
   - ${pillarRelations.year.label}
   - ${pillarRelations.month.label}
   - ${pillarRelations.hour.label}

[Interpretation Logic - Use as the ONLY basis; do not invent from keywords]
**사주:** ${SIBSEONG_LOGIC}
**오행:** ${OHENG_LOGIC}
**연월시지-일지 합·충·형·파:** ${PILLAR_RELATION_GUIDE}
- 연주=뿌리/초년, 월주=부모/청년, 일주=자신/부부, 시주=자녀/말년. 성격·직업·재물·운명 해석 시 위 **합·충·형·파**가 있으면 해당 영역(연/월/시)을 반드시 반영하라.
**별자리:** 태양=자아·목표, 달=감정·필요, 상승=외적 행동·첫인상. 위 "태양/달/상승" 설명문을 **근거**로 사용하고, 그 결론만 서술하라.
**결합:** 사주와 별자리가 같은 방향이면 강화, 반대면 충돌로 서술.

[Rules]
- **Every sentence must be derived from the Analytical Data + Interpretation Logic above.** Do NOT state the obvious; do NOT combine one or two keywords with generic situations to produce plausible-sounding text.
- If you cannot derive a point from the data, omit it or be brief. Prefer precise, logic-based analysis over filler.
- Use "${name}님" as subject. No "If you...", "In some cases...".
`;

    // 2. Step 1: 한줄요약 & 성격 (기질 = 사주 중심 2문단, 결합 = 1문단)
    function promptStep1() {
      return `
OUTPUT FORMAT: JSON with keys "one_line", "personality_1", "personality_2", "personality_3".
Each of personality_1, personality_2, personality_3 must be a single string (one paragraph). No newlines inside each string.

A. one_line
- One-sentence life-direction summary **derived from** the Analytical Data and Interpretation Logic (사주 십성·오행 + 별자리 태양/달/상승). No generic metaphors; tie to this person's data. Include "${name}님".

B. personality_1 (기질 카드 1문단)
- **Only from** 연월일시주 + 십성·오행 해석 기준. Combine Year/Month/Day/Hour pillars using the logic (연주=뿌리, 월주=부모, 일주=자신/십성, 시주=말년). Do NOT mention Zodiac; do NOT list pillar names. Subject: "${name}님".

B. personality_2 (기질 카드 2문단)
- MUST start with **"특히,"**. Describe **only from Day Pillar**: 일간-일지 십성(${dayPillarCore.structuralRelation})과 오행(${dayPillarCore.stemElement}/${dayPillarCore.branchElement}) 의미로 유도. No filler. Subject: "${name}님".

B. personality_3 (맨 위 "사주와 별자리를 결합한 성격" 섹션용)
- **Only from** 사주(일주 십성·오행) + 별자리(태양/달/상승 설명문). Describe how the two systems combine for this person—where they align or conflict. You may mention ${dayPillarCore.dayPillar}일주. Subject: "${name}님".
`;
    }

// 3. Step 2: 직업 & 연애 (별자리 반영 강화)
function promptStep2() {
    return `
OUTPUT FORMAT: JSON with keys "career", "love".

C. career
- **Derive only from** Saju (십성 ${dayPillarCore.structuralRelation}, 오행 ${dayPillarCore.stemElement}) + Zodiac (태양/달/상승 설명문). Subject: "${name}님".
- Structure (3 paragraphs): 1) Industries/roles that **follow from** the logic (e.g. 재성→실행·관리, 관성→규율·리더십, 식상→표현·창작; + 별자리 스타일). 2) Work style **derived from** same. 3) Boss/coworker synergy **from** 오행 상생·상극 or 별자리 관계. No generic advice.

D. love
- **Derive only from** Zodiac (태양/달/상승 = 자아·감정·첫인상) + Saju (일주 십성·오행). Subject: "${name}님". Use the given Sun/Moon/Rising descriptions as basis; no stereotype phrases.
- Structure (3 paragraphs): 1) Romantic atmosphere & dating style **from** the logic. 2) Bad type vs Good type **from** 상극/상생 or 별자리 충돌·조화. 3) Long-term partner traits **from** data. No filler.
`;
    }

    // 4. Step 3: 재물 & 운명
    function promptStep3() {
      return `
OUTPUT FORMAT: JSON with keys "investment", "destiny".

E. investment
- **Derive only from** Saju: 일주 십성(일지 관계)이 재물 해석의 기준—재성/식상/인성/관성/비겁 각각의 의미를 적용. Subject: "${name}님".
- Structure (3 paragraphs): 1) Attitude toward money **from** 십성·오행 (e.g. 재성=극하는 기운→재물에 대한 태도). 2) How to earn **from** same logic. 3) Leaks & solutions **from** data (오행 상극·신살 등). No generic "절약하세요" without logic tie.

F. destiny
- **Only from** Saju (연월일시, 일주 십성·오행) + Zodiac (태양/달/상승 설명문). Subject: "${name}님". Structure:

1) **사주가 강화하는 행동 성향 2가지** — Explicitly tied to 십성·오행 and pillars (e.g. "인성 위에 일간이므로...").

2) **별자리가 강화하는 행동 성향 2가지** — Explicitly tied to the given Sun/Moon/Rising description text.

3) **사주와 별자리가 충돌할 때 2가지** — Where the two systems pull in opposite directions; derive from the logic, not generic situations.

4) **향후 1~2년 내 충돌이 두드러질 수 있는 지점** — One point derived from the above conflict (e.g. 어떤 결정/관계에서).

5) **해결책** — Behavior adjustments that follow from the conflict (e.g. 어떤 쪽을 의식적으로 보완할지). Specific, logic-based.
`;
    }

    async function callOpenAI(userPrompt: string, seed: number) {
      const openai = new OpenAI({ apiKey });
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        seed,
      });
      const content = res.choices[0]?.message?.content;
      if (!content) throw new Error("Empty response");
      return JSON.parse(content);
    }

    const step1 = await callOpenAI(promptStep1(), finalSeed);
    const step2 = await callOpenAI(promptStep2(), finalSeed);
    const step3 = await callOpenAI(promptStep3(), finalSeed);

    const p1 = normalizeToString(step1.personality_1).trim();
    const p2 = normalizeToString(step1.personality_2).trim();
    const p3 = normalizeToString(step1.personality_3).trim();
    const hasStructured = p1 !== "" || p2 !== "" || p3 !== "";
    const result: AnalyzeResponse = {
      one_line: normalizeToString(step1.one_line),
      personality: hasStructured
        ? [p1, p2, p3].filter(Boolean).join("\n\n")
        : normalizeToString(step1.personality),
      ...(hasStructured && {
        personality_1: p1 || undefined,
        personality_2: p2 || undefined,
        personality_3: p3 || undefined,
      }),
      career: normalizeToString(step2.career),
      love: normalizeToString(step2.love),
      investment: normalizeToString(step3.investment),
      destiny: normalizeToString(step3.destiny),
      dayStem: dayPillarCore.dayStem,
      stemElement: dayPillarCore.stemElement,
      sunSign: zodiac,
      moonSign,
      risingSign,
      analysisLogs: analysisLogs.length > 0 ? analysisLogs : undefined,
    };

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}