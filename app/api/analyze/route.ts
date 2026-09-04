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

/** Interpretation basis: what each Ten God (Day Stem vs Day Branch relation) means — never invent from keywords alone */
const SIBSEONG_LOGIC = `
- **Companion** (Day Branch is the same element as you): peers, competition, self-assertion, people your age. Wealth is shared with others.
- **Expression** (Day Branch is the element you produce): self-expression, creativity, communication, children. Wealth is earned or spent through self-expression.
- **Wealth** (Day Branch is the element you control): money, execution, management, spouse. If Wealth sits in the Day Branch, it shapes this person's whole attitude toward and approach to money.
- **Resource** (Day Branch is the element that produces you): learning, mentors/benefactors, being protected, mother. If Resource sits in the Day Branch, it leans toward learning, being protected, and receiving support.
- **Authority** (Day Branch is the element that controls you): discipline, pressure, responsibility, career, father. If Authority sits in the Day Branch, it leans toward principle, pressure, and leadership.
`;
/** Five Elements energy — apply this meaning when interpreting personality/career/wealth */
const OHENG_LOGIC = `
- Wood: growth, directness, persistence, expansion. Fire: light, expression, passion, the spotlight. Earth: centeredness, tolerance, stability, mediation. Metal: justice, order, decisiveness, discipline. Water: wisdom, adaptability, calm, flexibility.
`;
/** Combination/Clash/Punishment/Break between the Year/Month/Hour Branch and the Day Branch — reflect this whenever the data is present */
const PILLAR_RELATION_GUIDE = `
- **Year Branch - Day Branch**: roots, early life, family, origins. **Combination** = harmony/support from family or origins. **Clash** = upheaval in early life, conflict with family, relocation. **Punishment** = burden, pressure, conflict. **Break** = a subtle rift or slack.
- **Month Branch - Day Branch**: parents, young adulthood, social foundation. **Combination** = harmony with parents/superiors, a benefactor. **Clash** = upheaval in young adulthood, relationship conflict. **Punishment** = responsibility, pressure, conflict. **Break** = friction, distance.
- **Hour Branch - Day Branch**: children, later life, outcomes. **Combination** = harmony/stability with children or in later life. **Clash** = upheaval in later life, a child with a very different temperament. **Punishment** = a burden in later life. **Break** = a subtle sense of distance.
- If the relation above is a **Combination**, describe that area (year/month/hour) positively. If it's a **Clash, Punishment, or Break**, describe that area as needing change, conflict, or repair.
`;

/** Korean single-character element -> English, for clean inline use in English prompts */
const ELEMENT_EN: Record<string, string> = {
  목: "Wood", 화: "Fire", 토: "Earth", 금: "Metal", 수: "Water",
};
function elementEn(el: string | undefined): string {
  if (!el) return "";
  return ELEMENT_EN[el] ?? el;
}

export type AnalyzeResponse = {
  one_line: string;
  personality: string;
  personality_1?: string;
  personality_2?: string;
  personality_3?: string;
  career: string;
  /** Jobs that fit you — Saju logic, ranked by fit, 3-5 items */
  careerJobsSaju?: string[];
  /** Jobs that fit you — Stars logic, ranked by fit, 3-5 items */
  careerJobsZodiac?: string[];
  /** Industries to explore — Saju logic, ranked by fit, 3-5 items */
  careerIndustriesSaju?: string[];
  /** Industries to explore — Stars logic, ranked by fit, 3-5 items */
  careerIndustriesZodiac?: string[];
  love: string;
  /** Love — who you might marry */
  loveSpousePrediction?: string;
  /** Love — what to watch out for */
  loveCaution?: string;
  destiny: string;
  dayStem?: string;
  stemElement?: string;
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
  /** Assumptions / limitations behind this reading */
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

/** Normalizes an LLM response field into a string array even if it wasn't shaped as one (max items capped) */
function normalizeToStringArray(value: unknown, max = 5): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((v) => (typeof v === "string" ? v : normalizeToString(v)).trim())
    .filter(Boolean)
    .slice(0, max);
  return items.length > 0 ? items : undefined;
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
    const locationInput = body.location || "New York";
    const name = body.name || "friend";

    if (ampm === "PM" && hour < 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    const geo = getCoordinates(locationInput);
    // Extract Saju data (zodiac = sun sign)
    const { dayPillarCore, activeShinsal, zodiac, pillars, pillarRelations } = getSaju(year, month, day, hour, minute);
    const moonSign = getMoonSign(year, month, day, hour, minute);
    const risingSign = getRisingSign(hour, minute);
    const sunDesc = SUN_SIGN_DESCRIPTIONS[zodiac] ?? "";
    const moonDesc = MOON_SIGN_DESCRIPTIONS[moonSign] ?? "";
    const risingDesc = RISING_SIGN_DESCRIPTIONS[risingSign] ?? "";

    // Assumption / limitation notes
    const analysisLogs: string[] = [];
    if (!body.location || body.location.trim() === "") {
      analysisLogs.push(
        "Note: no birthplace was entered. Enter one to get coordinates and time-zone-corrected results for that location."
      );
    }
    analysisLogs.push(
      "Note: your Rising Sign is approximated from birth time alone (one sign per ~2 hours). An exact Rising Sign requires your precise birthplace and time."
    );
    analysisLogs.push(
      "Note: your Moon Sign is approximated from date and time; a precise calculation requires full astronomical data."
    );
    if (activeShinsal.length === 0) {
      analysisLogs.push(
        "Note: none of the special \"Shinsal\" stars apply to this chart, so that section was left out of the reading."
      );
    }

    const timeSeed = Number(
      `${year}${pad2(month)}${pad2(day)}${pad2(hour)}${pad2(minute)}`
    );
    const geoSeed = Math.floor((geo.lat + geo.lng) * 1000);
    const finalSeed = timeSeed + geoSeed;

    const stemElEn = elementEn(dayPillarCore.stemElement);
    const branchElEn = elementEn(dayPillarCore.branchElement);

    // 1. System Prompt (base setup & data injection)
    const SYSTEM_PROMPT = `
You are an expert Fortune Teller who integrates Eastern Saju and Western Modern Astrology, writing for a US audience.

Your Goal:
Provide a personalized, insightful, and "bone-hitting" (sharp & accurate) analysis.
The output language must be **natural, conversational American English**.

[Voice - VERY IMPORTANT]
- Address the reader directly as **"you"/"your"** throughout, second person — never third person.
- You may use their name, **"${name}"**, once or twice for warmth (e.g. "${name}, your Day Master suggests..."), but do NOT repeat the name in every sentence, and never attach honorifics to it.
- Write like a sharp, warm American astrology app (think Co-Star or The Pattern), not a formal report.

[Confirmed Analytical Data]
1. Saju: Year=${pillars.year}, Month=${pillars.month}, Day=${pillars.day}, Hour=${pillars.hour}
   - Day Pillar: ${dayPillarCore.dayPillar} — Day Stem element ${stemElEn}, Day Branch element ${branchElEn}, **Ten God (Day Stem vs Day Branch relation): ${dayPillarCore.structuralRelation}**
2. Western Zodiac (Sun=${zodiac}, Moon=${moonSign}, Rising=${risingSign})
   - Sun (identity/goals): ${sunDesc}
   - Moon (emotions/needs): ${moonDesc}
   - Rising (first impression/behavior): ${risingDesc}
3. Active Shinsal (special stars):
${activeShinsal.length ? activeShinsal.map(s => `   - ${s.name}: ${s.description}`).join("\n") : "   (none)"}
4. Combination/Clash/Punishment/Break between the Year/Month/Hour Branch and the Day Branch:
   - ${pillarRelations.year.label}
   - ${pillarRelations.month.label}
   - ${pillarRelations.hour.label}

[Interpretation Logic - use as the ONLY basis; do not invent from keywords]
**Saju (Ten Gods):** ${SIBSEONG_LOGIC}
**Five Elements:** ${OHENG_LOGIC}
**Year/Month/Hour Branch vs Day Branch relations:** ${PILLAR_RELATION_GUIDE}
- Year Pillar = roots/early life, Month Pillar = parents/young adulthood, Day Pillar = self/spouse, Hour Pillar = children/later life. When interpreting personality, career, wealth, or destiny, you MUST reflect the **Combination/Clash/Punishment/Break** relations above wherever they apply.
**Astrology:** Sun = identity/goals, Moon = emotions/needs, Rising = outward behavior/first impression. Use the Sun/Moon/Rising description text above as your **evidence**, and only state the conclusions drawn from it.
**Combining the two systems:** when Saju and Astrology point the same direction, describe it as reinforcing; when they point in different directions, describe it as tension/conflict.

[US market context - VERY IMPORTANT]
- This reader lives in (or identifies with) the US. Every job, industry, and lifestyle example must be **grounded in the US job market and culture** — recognizable US-style roles, industries, and work arrangements (in-house, startup, freelance/self-employed, remote, agency, nonprofit, government, etc.).
- **Never** classify companies or jobs by Korean-style corporate size tiers (e.g. "conglomerate vs. small-and-medium business" / chaebol-style framing) — this distinction doesn't map onto the US job market and must not appear anywhere in the output.

[Rules]
- **Every sentence must be derived from the Analytical Data + Interpretation Logic above.** Do NOT state the obvious; do NOT combine one or two keywords with generic situations to produce plausible-sounding text.
- If you cannot derive a point from the data, omit it or be brief. Prefer precise, logic-based analysis over filler.
- Second person ("you/your") throughout. No "If you...", "In some cases...", no hedging.
- Always call this system **"Saju"** — never write "Four Pillars" or "Bazi" anywhere in your output.
`;

    // 2. Step 1: one-line summary & personality (temperament = Saju-centric, 2 paragraphs; combined = 1 paragraph)
    function promptStep1() {
      return `
OUTPUT FORMAT: JSON with keys "one_line", "personality_1", "personality_2", "personality_3".
Each of personality_1, personality_2, personality_3 must be a single string (one paragraph). No newlines inside each string.

A. one_line
- One-sentence life-direction summary **derived from** the Analytical Data and Interpretation Logic (Ten God + Five Elements + Sun/Moon/Rising). No generic metaphors; tie it to this person's data. Second person.

B. personality_1 (temperament card, paragraph 1)
- **Only from** Saju + Ten God/Five Elements logic. Combine the Year/Month/Day/Hour pillars using the logic (Year=roots, Month=parents, Day=self/Ten God, Hour=later life). Do NOT mention astrology; do NOT list pillar names literally. Second person.

B. personality_2 (temperament card, paragraph 2)
- MUST start with **"In particular,"**. Describe **only from the Day Pillar**: derive it from the Day Stem-Day Branch Ten God (${dayPillarCore.structuralRelation}) and the Five Elements meaning (${stemElEn}/${branchElEn}). No filler. Second person.

B. personality_3 (for the top "Astrology Meets Saju" section)
- **Only from** Saju (Day Pillar Ten God/Five Elements) + Astrology (Sun/Moon/Rising description text). Describe how the two systems combine for this person — where they align or conflict. You may mention the ${dayPillarCore.dayPillar} Day Pillar by its Ten God/Element meaning. Second person.
`;
    }

    // 3. Step 2: career & love (heavier astrology weighting)
    function promptStep2() {
      return `
OUTPUT FORMAT: JSON with keys "career", "love", "careerJobsSaju", "careerJobsZodiac", "careerIndustriesSaju", "careerIndustriesZodiac", "loveSpousePrediction", "loveCaution".

C. career
- **Derive only from** Saju (Ten God: ${dayPillarCore.structuralRelation}, Element: ${stemElEn}) + Astrology (Sun/Moon/Rising description text). Second person. US job market only (see [US market context] above).
- Structure (3 paragraphs): 1) Roles/work that **follow from** the logic (e.g. Wealth -> execution/management, Authority -> discipline/leadership, Expression -> communication/creative work; plus astrological working style). 2) Work style **derived from** the same logic. 3) Manager/coworker synergy **from** Five Elements production/control cycles or astrological compatibility. No generic advice.

C-1. careerJobsSaju
- Array of 3-5 strings. Each item format: "{specific US job title} — {one-line reason drawn from the Ten God/Five Elements logic}".
- Derive **strictly from** the Saju Ten God (${dayPillarCore.structuralRelation}) + Five Elements (${stemElEn}) logic — the SAME logic used in "career" above. Do NOT use astrology here. Job titles must be ones a US reader would recognize.
- Order the array by **fit with the logic, highest first** — the job most directly derivable from this person's Ten God/Five Elements comes first.

C-2. careerJobsZodiac
- Array of 3-5 strings, same "{job title} — {reason}" format, US-recognizable job titles.
- Derive **strictly from** the given Sun/Moon/Rising description text above. Do NOT use Saju here.
- Order by fit with the logic, highest first.

C-3. careerIndustriesSaju
- Array of 3-5 strings, "{industry/sector} — {reason}" format, derived **strictly from** the Saju Ten God/Five Elements logic (same basis as careerJobsSaju, but industries/sectors rather than job titles — e.g. Wealth -> finance, retail, real estate/execution-heavy industries). Use US industry terms.
- Order by fit with the logic, highest first.

C-4. careerIndustriesZodiac
- Array of 3-5 strings, "{industry/sector} — {reason}" format, derived **strictly from** the Sun/Moon/Rising description text. Use US industry terms.
- Order by fit with the logic, highest first.

D. love
- **Derive only from** Astrology (Sun/Moon/Rising = identity/emotion/first impression) + Saju (Day Pillar Ten God/Element). Second person. Use the given Sun/Moon/Rising descriptions as basis; no stereotype phrases.
- Structure (3 paragraphs): 1) Romantic atmosphere & dating style **from** the logic. 2) Bad-fit vs. good-fit types **from** Five Elements production/control cycles or astrological clash/harmony. 3) Long-term partner traits **from** the data. No filler.

D-1. loveSpousePrediction (who you might marry)
- Single string, 2 sentences describing predicted spouse traits. **Derive from** the Wealth Ten God (which represents the spouse) — if the Day Branch is Wealth, use its element/nature; otherwise use how the Day Branch element relates to a spouse — **plus** the Sun/Moon/Rising combination. Second person.

D-2. loveCaution (what to watch out for)
- Single string, 1-2 sentences. A dating pitfall **derived from** a Five Elements control-cycle relationship or an astrological clash (a mismatch between Sun/Moon/Rising) — specific to this person's data, not generic "don't fight." Second person.
`;
    }

    // 4. Step 3: destiny
    function promptStep3() {
      return `
OUTPUT FORMAT: JSON with keys "destiny".

E. destiny
- **Only from** Saju (all four pillars, Day Pillar Ten God/Five Elements) + Astrology (Sun/Moon/Rising description text). Second person. Structure:

1) **Two behavioral tendencies reinforced by your Saju** — explicitly tied to the Ten God/Five Elements and pillars (e.g. "because your Day Master sits on Resource...").

2) **Two behavioral tendencies reinforced by your chart's astrology** — explicitly tied to the given Sun/Moon/Rising description text.

3) **Two places where your Saju and Astrology pull in opposite directions** — derive this from the logic, not from generic situations.

4) **One point where that tension is likely to show up over the next 1-2 years** — derived from the conflict above (e.g. in a specific decision or relationship).

5) **A fix** — a behavior adjustment that follows from the conflict (e.g. which side to consciously balance). Specific, logic-based.
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
      careerJobsSaju: normalizeToStringArray(step2.careerJobsSaju),
      careerJobsZodiac: normalizeToStringArray(step2.careerJobsZodiac),
      careerIndustriesSaju: normalizeToStringArray(step2.careerIndustriesSaju),
      careerIndustriesZodiac: normalizeToStringArray(step2.careerIndustriesZodiac),
      love: normalizeToString(step2.love),
      loveSpousePrediction:
        normalizeToString(step2.loveSpousePrediction).trim() || undefined,
      loveCaution: normalizeToString(step2.loveCaution).trim() || undefined,
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
