// 신살의 성격을 분류하는 타입
export type ShinsalCategory = "personality" | "relationship" | "movement" | "risk" | "focus" | "success";

export type ShinsalDefinition = {
  key: string;
  name: string;
  category: ShinsalCategory;
  description: string;
};

// 12신살 + 주요 길신/흉신 포함
export const SHINSAL_DEFINITIONS: Record<string, ShinsalDefinition> = {
  // 1. 지살 (Ji-sal) - 자발적 이동
  jisal: {
    key: "jisal",
    name: "Wanderer Star",
    category: "movement",
    description: "A pull toward new beginnings — restless energy that shows up as initiative and hard work.",
  },
  // 2. 도화살 (Nyeon-sal) - 매력, 인기 (기존 유지)
  dohwa: {
    key: "dohwa",
    name: "Peach Blossom Star",
    category: "relationship",
    description: "Magnetic charm that draws attention in relationships — a natural pull that turns heads.",
  },
  // 3. 월살 (Wol-sal) - 고독, 달빛
  wolsal: {
    key: "wolsal",
    name: "Moon Star",
    category: "focus",
    description: "A quiet loneliness like moonlight on a dark night, paired with introspection and spiritual depth.",
  },
  // 4. 망신살 (Mangsin-sal) - 노출, 과시
  mangsin: {
    key: "mangsin",
    name: "Exposure Star",
    category: "relationship",
    description: "A drive to be seen and to stand out, which can occasionally invite gossip or embarrassing missteps.",
  },
  // 5. 장성살 (Jangseong-sal) - 리더십, 주도
  jangseong: {
    key: "jangseong",
    name: "General Star",
    category: "personality",
    description: "Commanding leadership and grit that puts you at the center of any group, with a pride that won't compromise.",
  },
  // 6. 반안살 (Banan-sal) - 출세, 안정
  banan: {
    key: "banan",
    name: "Saddle Star",
    category: "success",
    description: "The ease of sitting comfortably in the saddle — steady fortune that brings promotion and success.",
  },
  // 7. 역마살 (Yeokma-sal) - 이동, 변동 (기존 유지)
  yeokma: {
    key: "yeokma",
    name: "Travel Horse Star",
    category: "movement",
    description: "A restless nature that can't sit still — a constant pull toward movement and change.",
  },
  // 8. 육해살 (Yukhae-sal) - 예민, 장애
  yukhae: {
    key: "yukhae",
    name: "Six Harms Star",
    category: "risk",
    description: "Heightened sensitivity and intuition, sometimes paired with minor recurring health issues.",
  },
  // 9. 화개살 (Hwaegae-sal) - 예술, 종교 (기존 유지)
  hwaega: {
    key: "hwaega",
    name: "Canopy Star",
    category: "focus",
    description: "A pull inward beneath the surface glamour — artistic talent paired with a philosophical, spiritual streak.",
  },
  // 10. 겁살 (Geop-sal) - 강탈, 경쟁
  geopsal: {
    key: "geopsal",
    name: "Robbery Star",
    category: "risk",
    description: "Fierce competition and pressure — situations where something is won or lost by force.",
  },
  // 11. 재살 (Jae-sal) - 수옥살, 꾀
  jaesal: {
    key: "jaesal",
    name: "Calamity Star",
    category: "focus",
    description: "A restrictive, boxed-in feeling that sharpens the mind — fast thinking and clever strategy as compensation.",
  },
  // 12. 천살 (Cheon-sal) - 하늘의 벌
  cheonsal: {
    key: "cheonsal",
    name: "Heaven Star",
    category: "risk",
    description: "Forces beyond your control — sudden events or pressure from above that you can't simply will away.",
  },

  // --- [기타 주요 신살] ---

  // 13. 백호살 (Baekho) - 폭발적 에너지 (기존 유지)
  baekho: {
    key: "baekho",
    name: "White Tiger Star",
    category: "risk",
    description: "A fierce, usually dormant intensity that erupts into powerful, high-stakes professional skill.",
  },
  // 14. 괴강살 (Gwoegang) - 강력한 리더십, 극단성
  gwoegang: {
    key: "gwoegang",
    name: "Extreme Leader Star",
    category: "personality",
    description: "A commanding urge to lead from the top — brilliant, but prone to dramatic highs and lows.",
  },
  // 15. 귀문관살 (Gwimun) - 천재성, 신경과민
  gwimun: {
    key: "gwimun",
    name: "Ghost Gate Star",
    category: "focus",
    description: "Uncanny intuition and brilliance bordering on genius, alongside nervous sensitivity or obsessive focus.",
  },
  // lib/shinsal.ts 추가 예시
  hyeonchim: {
    key: "hyeonchim",
    name: "Needle Star",
    category: "risk",
    description: "Sharp, needle-like precision — a natural fit for exacting fields like medicine, IT, or design.",
  },
};
