import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getSaju } from "@/lib/sajuConverter";
import { getCoordinates } from "@/lib/geocoder";

export const maxDuration = 60;

export type AnalyzeResponse = {
  one_line: string;
  personality: string;
  career: string;
  love: string;
  investment: string;
  destiny: string;
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
    
    // Saju 데이터 추출
    const { dayPillarCore, activeShinsal, zodiac } = getSaju(year, month, day, hour, minute);
    
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
1. Day Pillar (Self): ${dayPillarCore.dayPillar} (${dayPillarCore.dayStem}/${dayPillarCore.stemElement})
   - Keywords: ${dayPillarCore.coreKeywords.join(", ")}
   - Relation: ${dayPillarCore.structuralRelation}
2. Western Zodiac: ${zodiac}
3. Active Shinsal (Divine Spirits):
${activeShinsal.map(s => `   - ${s.name}: ${s.description}`).join("\n")}

[General Rules]
- Treat these traits as **observed facts**.
- Do NOT use conditional phrases like "If you..." or "In some cases...".
`;

    // 2. Step 1: 한줄요약 & 성격
    function promptStep1() {
      return `
OUTPUT FORMAT: JSON with keys "one_line", "personality".

A. one_line
- Write a poetic, impactful one-sentence summary of the user's life direction.
- Include the user's name ("${name}님").

B. personality
- Compare the "Day Master" (Inner Self) and "Zodiac/Ascendant" (Social Mask).
- Structure (3 paragraphs):
  1. The innate temperament based on Day Pillar (Day Stem). (Subject: ${name}님)
  2. The social persona/style based on Western Zodiac. (Subject: ${name}님)
  3. Integrated analysis: How these two mix in real life. (Subject: ${name}님)
`;
    }

// 3. Step 2: 직업 & 연애 (별자리 반영 강화)
function promptStep2() {
    return `
OUTPUT FORMAT: JSON with keys "career", "love".

C. career
- **Core Logic:** Combine "Five Elements" (Saju) AND "Western Zodiac" traits.
- **Instruction:** 1. Use Saju Element (${dayPillarCore.stemElement}) for the fundamental energy (e.g., Wood=Growth, Fire=Expression).
2. Use **Western Zodiac (${zodiac})** for the *Professional Style* (e.g., Virgo=Detail, Leo=Leadership, Aquarius=Innovation).
3. Synthesize these two. (Example: If Fire Element + Virgo -> "Detailed expression" -> Data Analyst or Editor).
4. Also apply "Active Shinsal" if available for specific skills.
- Structure (3 paragraphs):
1. Recommended industries & roles (Merging Saju + Zodiac).
2. Work style & Professional strengths/weaknesses.
3. Best & Worst synergy with bosses/coworkers.
*Subject: "${name}님"*

D. love
- **Core Logic:** 1. Use **"Western Zodiac"** to describe the *Romantic Atmosphere* and *Emotional Needs*.
  2. Use "Saju" to determine compatibility (matching/clashing).
- **Instruction:**
  - Do NOT mention specific Zodiac stereotypes (like "passionate Leo"). 
  - Instead, interpret the energy of the user's specific Zodiac (${zodiac}) combined with their Saju.
- Structure (3 paragraphs):
  1. Ideal romantic atmosphere & Dating style.
  2. The "Bad Type" ${name}님 is attracted to vs. The "Good Type" (Noble person) they actually need.
  3. Marriage advice: Characteristics of a long-term partner (Financial/Job stability).
`;
    }

    // 4. Step 3: 재물 & 운명
    function promptStep3() {
      return `
OUTPUT FORMAT: JSON with keys "investment", "destiny".

E. investment
- **Core Logic:** Analyze the element the Day Master controls (Wealth Element).
- Structure (3 paragraphs):
  1. Innate wealth vessel size & Attitude towards money.
  2. Wealth-building habits (How to earn).
  3. Consumption leaks (How to lose) & Practical solutions.
  *Remember: Subject is always "${name}님".*

F. destiny
- **Core Logic:** Synthesize the "Active Shinsal" impacts on the life path.
- **Instruction:** - Interpret the provided Shinsal (${activeShinsal.map(s => s.name).join(", ")}) as **life events or opportunities**.
  - Predict the "Big Wave" coming in the next 5 years based on these energies.
- Structure (3 paragraphs):
  1. How the Shinsal influence the overall life trajectory.
  2. The astrological direction of energy.
  3. Concrete advice for the next 5 years (The biggest opportunity to seize).
  *Remember: Subject is always "${name}님".*
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

    const result: AnalyzeResponse = {
      one_line: normalizeToString(step1.one_line),
      personality: normalizeToString(step1.personality),
      career: normalizeToString(step2.career),
      love: normalizeToString(step2.love),
      investment: normalizeToString(step3.investment),
      destiny: normalizeToString(step3.destiny),
    };

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}