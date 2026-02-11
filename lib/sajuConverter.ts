import { Solar } from "lunar-javascript";
import { SHINSAL_DEFINITIONS } from "./shinsal";
import { ZODIAC_SIGNS_BY_INDEX } from "./zodiacDescriptions";

// 1. 데이터 타입 정의
export type DayPillarCore = {
  dayPillar: string; // 예: "갑자"
  dayStem: string; // 예: "갑"
  dayBranch: string; // 예: "자"
  stemElement: string; // 예: "목"
  branchElement: string; // 예: "수"
  hiddenStems: string[]; // 예: ["임", "계"]
  structuralRelation: string; // 예: "인성 위에 일간" (십성 관계)
  coreKeywords: string[]; // 오행 기반 키워드
};

/** 연·월·시 지지와 일지(日支) 간의 합·충·형·파 관계 */
export type PillarRelation = "합" | "충" | "형" | "파" | null;
export type PillarRelations = {
  year: { relation: PillarRelation; label: string };  // 연지-일지
  month: { relation: PillarRelation; label: string };  // 월지-일지
  hour: { relation: PillarRelation; label: string };   // 시지-일지
};

// 2. 기초 데이터 매핑 (한자 -> 한글)
const HANJA_TO_KOR: Record<string, string> = {
  甲: "갑",
  乙: "을",
  丙: "병",
  丁: "정",
  戊: "무",
  己: "기",
  庚: "경",
  辛: "신",
  壬: "임",
  癸: "계",
  子: "자",
  丑: "축",
  寅: "인",
  卯: "묘",
  辰: "진",
  巳: "사",
  午: "오",
  未: "미",
  申: "신",
  酉: "유",
  戌: "술",
  亥: "해",
};

// 3. 오행 매핑
const ELEMENT_MAP: Record<string, string> = {
  갑: "목",
  을: "목",
  인: "목",
  묘: "목",
  병: "화",
  정: "화",
  사: "화",
  오: "화",
  무: "토",
  기: "토",
  진: "토",
  술: "토",
  축: "토",
  미: "토",
  경: "금",
  신: "금",
  유: "금",
  임: "수",
  계: "수",
  해: "수",
  자: "수",
};

// 4. 지장간(Hidden Stems) 데이터
const HIDDEN_STEMS: Record<string, string[]> = {
  자: ["임", "계"],
  축: ["계", "신", "기"],
  인: ["무", "병", "갑"],
  묘: ["갑", "을"],
  진: ["을", "계", "무"],
  사: ["무", "경", "병"],
  오: ["병", "기", "정"],
  미: ["정", "을", "기"],
  신: ["무", "임", "경"],
  유: ["경", "신"],
  술: ["신", "정", "무"],
  해: ["무", "갑", "임"],
};

// 5. 12신살 그룹 (연지 기준 -> 일지 대조)
const SHINSAL_12_GROUPS: Record<string, string[]> = {
  // 인오술(화) -> 해자축인묘진사오미신유술
  인: [
    "겁살",
    "재살",
    "천살",
    "지살",
    "도화",
    "월살",
    "망신",
    "장성",
    "반안",
    "역마",
    "육해",
    "화개",
  ],
  오: [
    "겁살",
    "재살",
    "천살",
    "지살",
    "도화",
    "월살",
    "망신",
    "장성",
    "반안",
    "역마",
    "육해",
    "화개",
  ],
  술: [
    "겁살",
    "재살",
    "천살",
    "지살",
    "도화",
    "월살",
    "망신",
    "장성",
    "반안",
    "역마",
    "육해",
    "화개",
  ],
  // 신자진(수) -> 사오미신유술해자축인묘진
  신: [
    "겁살",
    "재살",
    "천살",
    "지살",
    "도화",
    "월살",
    "망신",
    "장성",
    "반안",
    "역마",
    "육해",
    "화개",
  ],
  자: [
    "겁살",
    "재살",
    "천살",
    "지살",
    "도화",
    "월살",
    "망신",
    "장성",
    "반안",
    "역마",
    "육해",
    "화개",
  ],
  진: [
    "겁살",
    "재살",
    "천살",
    "지살",
    "도화",
    "월살",
    "망신",
    "장성",
    "반안",
    "역마",
    "육해",
    "화개",
  ],
  // 사유축(금) -> 인묘진사오미신유술해자축
  사: [
    "겁살",
    "재살",
    "천살",
    "지살",
    "도화",
    "월살",
    "망신",
    "장성",
    "반안",
    "역마",
    "육해",
    "화개",
  ],
  유: [
    "겁살",
    "재살",
    "천살",
    "지살",
    "도화",
    "월살",
    "망신",
    "장성",
    "반안",
    "역마",
    "육해",
    "화개",
  ],
  축: [
    "겁살",
    "재살",
    "천살",
    "지살",
    "도화",
    "월살",
    "망신",
    "장성",
    "반안",
    "역마",
    "육해",
    "화개",
  ],
  // 해묘미(목) -> 신유술해자축인묘진사오미
  해: [
    "겁살",
    "재살",
    "천살",
    "지살",
    "도화",
    "월살",
    "망신",
    "장성",
    "반안",
    "역마",
    "육해",
    "화개",
  ],
  묘: [
    "겁살",
    "재살",
    "천살",
    "지살",
    "도화",
    "월살",
    "망신",
    "장성",
    "반안",
    "역마",
    "육해",
    "화개",
  ],
  미: [
    "겁살",
    "재살",
    "천살",
    "지살",
    "도화",
    "월살",
    "망신",
    "장성",
    "반안",
    "역마",
    "육해",
    "화개",
  ],
};

const ZODIAC_ORDER = ["해", "자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술"];

// 5-2. 지지(地支) 합·충·형·파 — 일지와 연·월·시지 관계
const JIJI_HAP: [string, string][] = [["자", "축"], ["인", "해"], ["묘", "술"], ["진", "유"], ["사", "신"], ["오", "미"]]; // 육합
const JIJI_CHUNG: [string, string][] = [["자", "오"], ["축", "미"], ["인", "신"], ["묘", "유"], ["진", "술"], ["사", "해"]]; // 육충
const JIJI_HYUNG: [string, string][] = [["인", "사"], ["사", "신"], ["신", "인"], ["축", "술"], ["술", "미"], ["미", "축"], ["자", "묘"], ["묘", "자"]]; // 삼형+자묘형
const JIJI_SELF_HYUNG = ["진", "오", "유", "해"]; // 자형(같은 지지 두 개 있을 때)
const JIJI_HAE: [string, string][] = [["자", "미"], ["축", "오"], ["인", "사"], ["묘", "진"], ["신", "해"], ["유", "술"]]; // 육해(害, 파에 해당)

function normalizePair(a: string, b: string): string {
  return [a, b].sort().join("");
}
function hasPair(pairs: [string, string][], branch1: string, branch2: string): boolean {
  const n = normalizePair(branch1, branch2);
  return pairs.some(([x, y]) => normalizePair(x, y) === n);
}

/** 일지(dayBranch)와 다른 한 지지(otherBranch)의 관계 반환 */
function getJijiRelation(dayBranch: string, otherBranch: string): PillarRelation {
  if (dayBranch === otherBranch) {
    return JIJI_SELF_HYUNG.includes(dayBranch) ? "형" : null; // 자형
  }
  if (hasPair(JIJI_HAP, dayBranch, otherBranch)) return "합";
  if (hasPair(JIJI_CHUNG, dayBranch, otherBranch)) return "충";
  if (hasPair(JIJI_HYUNG, dayBranch, otherBranch)) return "형";
  if (hasPair(JIJI_HAE, dayBranch, otherBranch)) return "파";
  return null;
}

function pillarRelationLabel(pillar: "year" | "month" | "hour", relation: PillarRelation, otherBranch: string): string {
  const names = { year: "연지", month: "월지", hour: "시지" };
  const pillarName = names[pillar];
  if (!relation) return `${pillarName}-일지: 없음`;
  return `${pillarName}(${otherBranch})-일지: ${relation}`;
}

// 6. 특수 신살 규칙 (일주 기준)
const SPECIAL_SHINSAL_RULES = {
  baekho: ["갑진", "을미", "병술", "정축", "무진", "임술", "계축"],
  gwoegang: ["경진", "경술", "임진", "임술", "무술"],
  yangin: ["병오", "무오", "임자", "기사", "정사", "계해"], // 양인살 범위 확대
};

// 신살 한글명 -> 키 매핑
const SHINSAL_NAME_TO_KEY: Record<string, string> = {
  도화: "dohwa",
  역마: "yeokma",
  화개: "hwaega",
  지살: "jisal",
  월살: "wolsal",
  망신: "mangsin",
  장성: "jangseong",
  반안: "banan",
  육해: "yukhae",
  겁살: "geopsal",
  재살: "jaesal",
  천살: "cheonsal",
};

// [보완] 현침살 글자들 (찌르는 기운 - 의료, IT, 미용)
const HYEONCHIM_CHARS = ["갑", "신", "묘", "오"]; // 신(辛), 신(申) 주의. 지지 '신'은 branchKor === "신"으로 별도 체크.

// [보완] 귀문관살 조합 (일지 - 시지/연지/월지 관계)
// 자유, 축오, 인미, 묘신, 진해, 사술
const GWIMUN_PAIRS: [string, string][] = [
  ["자", "유"],
  ["축", "오"],
  ["인", "미"],
  ["묘", "신"],
  ["진", "해"],
  ["사", "술"],
];

// 서양 별자리 데이터
const WESTERN_ZODIAC = [
  { name: "염소자리", from: [12, 22], to: [1, 19] },
  { name: "물병자리", from: [1, 20], to: [2, 18] },
  { name: "물고기자리", from: [2, 19], to: [3, 20] },
  { name: "양자리", from: [3, 21], to: [4, 19] },
  { name: "황소자리", from: [4, 20], to: [5, 20] },
  { name: "쌍둥이자리", from: [5, 21], to: [6, 21] },
  { name: "게자리", from: [6, 22], to: [7, 22] },
  { name: "사자자리", from: [7, 23], to: [8, 22] },
  { name: "처녀자리", from: [8, 23], to: [9, 22] },
  { name: "천칭자리", from: [9, 23], to: [10, 23] },
  { name: "전갈자리", from: [10, 24], to: [11, 22] },
  { name: "사수자리", from: [11, 23], to: [12, 21] },
];

function getWesternZodiac(month: number, day: number): string {
  for (const sign of WESTERN_ZODIAC) {
    const [fromMonth, fromDay] = sign.from;
    const [toMonth, toDay] = sign.to;
    if (
      (month === fromMonth && day >= fromDay) ||
      (month === toMonth && day <= toDay) ||
      (fromMonth > toMonth &&
        ((month === fromMonth && day >= fromDay) ||
          (month === toMonth && day <= toDay)))
    ) {
      return sign.name;
    }
  }
  return "";
}

/** Julian Day (UT noon) — Gregorian */
function julianDay(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    B -
    1524.5
  );
}

/**
 * 달별자리( Moon Sign ) 근사 — 생일·생시 기준
 * 달의 평균 황경을 이용한 단순 근사 (tropical)
 */
export function getMoonSign(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): string {
  const jd = julianDay(year, month, day);
  const dayFraction = hour / 24 + minute / 1440;
  // 달의 평균 이동 ~13.1764°/일, 0.549°/시간
  const daysSinceEpoch = jd - 2451550.1 + dayFraction;
  const longitude = (daysSinceEpoch / 27.321582) * 360;
  const normalized = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normalized / 30) % 12;
  return ZODIAC_SIGNS_BY_INDEX[index];
}

/**
 * 상승궁( Rising Sign ) 근사 — 생시 기준 (지역 무관 단순 근사)
 * 약 2시간에 한 번꼴로 상승궁이 바는다고 가정
 */
export function getRisingSign(hour: number, minute: number): string {
  const totalHours = hour + minute / 60;
  const index = Math.floor(totalHours / 2) % 12;
  return ZODIAC_SIGNS_BY_INDEX[index];
}

// 헬퍼: 오행 가져오기 (신(申) 처리 포함)
function getElement(char: string): string {
  if (char === "신") {
    // 십간의 신(辛)인지 십이지의 신(申)인지 구분 필요하지만
    // 로직상 모두 금(金)으로 처리
    return "금";
  }
  return ELEMENT_MAP[char] || "";
}

// 헬퍼: 십성 관계 계산 (일간 vs 일지)
function getRelation(stemEl: string, branchEl: string): string {
  if (stemEl === branchEl) return "비겁(나와 같은 기운)";

  // 목 -> 화 -> 토 -> 금 -> 수 -> 목 (상생)
  const production = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
  // 목 -> 토 -> 수 -> 화 -> 금 -> 목 (상극)
  const control = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };

  if (production[stemEl as keyof typeof production] === branchEl)
    return "식상(내가 생하는 기운)";
  if (control[stemEl as keyof typeof control] === branchEl)
    return "재성(내가 극하는 기운)";
  if (production[branchEl as keyof typeof production] === stemEl)
    return "인성(나를 생하는 기운)";
  if (control[branchEl as keyof typeof control] === stemEl)
    return "관성(나를 극하는 기운)";

  return "알 수 없음";
}

// 한자 기둥 -> 한글 변환 헬퍼
function convertPillar(hanja: string): string {
  return (
    (HANJA_TO_KOR[hanja[0]] || hanja[0]) +
    (HANJA_TO_KOR[hanja[1]] || hanja[1])
  );
}

// 메인 사주 계산 함수
export function getSaju(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
) {
  // 1. 만세력 변환
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();

  // 2. 사주 팔자 추출 (한자)
  const rawYear = lunar.getYearInGanZhi();
  const rawMonth = lunar.getMonthInGanZhi();
  const rawDay = lunar.getDayInGanZhi();
  const rawHour = lunar.getTimeInGanZhi();

  // 3. 한글 변환
  const stemHanja = rawDay.charAt(0);
  const branchHanja = rawDay.charAt(1);
  const stemKor = HANJA_TO_KOR[stemHanja]; // 예: 갑
  const branchKor = HANJA_TO_KOR[branchHanja]; // 예: 자
  const dayPillarKor = stemKor + branchKor; // 예: 갑자

  const yearBranchKor = HANJA_TO_KOR[rawYear.charAt(1)]; // 띠
  const monthBranchKor = HANJA_TO_KOR[rawMonth.charAt(1)];
  const hourBranchKor = HANJA_TO_KOR[rawHour.charAt(1)];

  // 4. DayPillarCore 동적 생성
  const stemEl = getElement(stemKor);
  const branchEl = getElement(branchKor);
  const relation = getRelation(stemEl, branchEl);
  const hStems = HIDDEN_STEMS[branchKor] || [];

  const dayPillarCore: DayPillarCore = {
    dayPillar: dayPillarKor,
    dayStem: stemKor,
    dayBranch: branchKor,
    stemElement: stemEl,
    branchElement: branchEl,
    hiddenStems: hStems,
    structuralRelation: relation,
    coreKeywords: [`${stemEl}의 기운`, relation, `${branchKor}의 특성`],
  };

  // 5. 신살 동적 계산
  const activeShinsalKeys: string[] = [];

  // (1) 12신살 (연지 기준 -> 일지)
  const shinsalList = SHINSAL_12_GROUPS[yearBranchKor];
  if (shinsalList) {
    const idx = ZODIAC_ORDER.indexOf(branchKor);
    if (idx !== -1) {
      const name = shinsalList[idx];
      const key = SHINSAL_NAME_TO_KEY[name];
      if (key) activeShinsalKeys.push(key);
    }
  }

  // (2) 특수 신살 (일주 기준)
  if (SPECIAL_SHINSAL_RULES.baekho.includes(dayPillarKor)) {
    activeShinsalKeys.push("baekho");
  }
  if (SPECIAL_SHINSAL_RULES.gwoegang.includes(dayPillarKor)) {
    activeShinsalKeys.push("gwoegang");
  }
  if (SPECIAL_SHINSAL_RULES.yangin.includes(dayPillarKor)) {
    activeShinsalKeys.push("yangin");
  }

  // (3) 현침살 (일간/일지에 글자가 있는지)
  if (
    HYEONCHIM_CHARS.includes(stemKor) ||
    HYEONCHIM_CHARS.includes(branchKor) ||
    (branchKor === "신" && stemKor !== "신")
  ) {
    activeShinsalKeys.push("hyeonchim");
  }

  // (4) 귀문관살 (일지 vs 다른 지지)
  const otherBranches = [yearBranchKor, monthBranchKor, hourBranchKor];
  const hasGwimun = GWIMUN_PAIRS.some(
    ([a, b]) =>
      (branchKor === a && otherBranches.includes(b)) ||
      (branchKor === b && otherBranches.includes(a))
  );
  if (hasGwimun) {
    activeShinsalKeys.push("gwimun");
  }

  // (5) 결과 매핑
  const activeShinsal = activeShinsalKeys
    .map((key) => SHINSAL_DEFINITIONS[key])
    .filter((def) => Boolean(def));

  // 6. 연·월·시 지지와 일지 간 합·충·형·파
  const dayBranch = branchKor;
  const pillarRelations: PillarRelations = {
    year: {
      relation: getJijiRelation(dayBranch, yearBranchKor),
      label: pillarRelationLabel("year", getJijiRelation(dayBranch, yearBranchKor), yearBranchKor),
    },
    month: {
      relation: getJijiRelation(dayBranch, monthBranchKor),
      label: pillarRelationLabel("month", getJijiRelation(dayBranch, monthBranchKor), monthBranchKor),
    },
    hour: {
      relation: getJijiRelation(dayBranch, hourBranchKor),
      label: pillarRelationLabel("hour", getJijiRelation(dayBranch, hourBranchKor), hourBranchKor),
    },
  };

  // 7. 서양 별자리
  const zodiac = getWesternZodiac(month, day);

  // 8. 결과 반환 (API에서 사용하기 쉽도록 필요한 정보들 정리)
  return {
    dayPillarCore,
    activeShinsal,
    shinsalNames: activeShinsal.map((s) => s.name).join(", "),
    activeShinsalKeys,
    pillars: {
      year: convertPillar(rawYear),
      month: convertPillar(rawMonth),
      day: dayPillarKor,
      hour: convertPillar(rawHour),
    },
    pillarRelations, // 연월시지-일지 합·충·형·파
    dayMaster: stemKor,
    zodiac,
  };
}