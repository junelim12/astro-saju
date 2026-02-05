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
    name: "지살 (Earth)",
    category: "movement",
    description: "새로운 시작을 위한 자발적 이동과 부지런한 활동성",
  },
  // 2. 도화살 (Nyeon-sal) - 매력, 인기 (기존 유지)
  dohwa: {
    key: "dohwa",
    name: "도화살 (Peach Blossom)",
    category: "relationship",
    description: "대인 관계에서 주목받는 매력과 끼, 타인의 시선을 끄는 힘",
  },
  // 3. 월살 (Wol-sal) - 고독, 달빛
  wolsal: {
    key: "wolsal",
    name: "월살 (Moon)",
    category: "focus",
    description: "어두운 밤 달빛처럼 외롭지만, 내면의 성찰과 종교적 깊이가 있음",
  },
  // 4. 망신살 (Mangsin-sal) - 노출, 과시
  mangsin: {
    key: "mangsin",
    name: "망신살 (Exposure)",
    category: "relationship",
    description: "자신을 드러내고 과시하려는 욕구, 때로는 실수로 인한 구설수",
  },
  // 5. 장성살 (Jangseong-sal) - 리더십, 주도
  jangseong: {
    key: "jangseong",
    name: "장성살 (General)",
    category: "personality",
    description: "집단의 중심이 되는 강력한 리더십과 뚝심, 타협하지 않는 자존심",
  },
  // 6. 반안살 (Banan-sal) - 출세, 안정
  banan: {
    key: "banan",
    name: "반안살 (Saddle)",
    category: "success",
    description: "말 안장에 앉은 듯한 편안함, 승진과 성공이 따르는 안정적 운세",
  },
  // 7. 역마살 (Yeokma-sal) - 이동, 변동 (기존 유지)
  yeokma: {
    key: "yeokma",
    name: "역마살 (Travel Horse)",
    category: "movement",
    description: "한곳에 머물지 못하고 끊임없이 이동하거나 변화를 추구하는 기질",
  },
  // 8. 육해살 (Yukhae-sal) - 예민, 장애
  yukhae: {
    key: "yukhae",
    name: "육해살 (Six Harms)",
    category: "risk",
    description: "여섯 가지 해로움, 예민한 감각과 영감, 또는 건강상의 잔병치레",
  },
  // 9. 화개살 (Hwaegae-sal) - 예술, 종교 (기존 유지)
  hwaega: {
    key: "hwaega",
    name: "화개살 (Art/Covering)",
    category: "focus",
    description: "화려함을 덮고 내면으로 침잠하는 힘, 예술적 재능과 종교적 철학성",
  },
  // 10. 겁살 (Geop-sal) - 강탈, 경쟁
  geopsal: {
    key: "geopsal",
    name: "겁살 (Robbery)",
    category: "risk",
    description: "무언가를 빼앗기거나 빼앗아야 하는 치열한 경쟁 상황과 압박",
  },
  // 11. 재살 (Jae-sal) - 수옥살, 꾀
  jaesal: {
    key: "jaesal",
    name: "재살 (Calamity)",
    category: "focus",
    description: "신체가 갇힌 듯한 답답함, 대신 두뇌 회전과 꾀가 비상하게 발달함",
  },
  // 12. 천살 (Cheon-sal) - 하늘의 벌
  cheonsal: {
    key: "cheonsal",
    name: "천살 (Heaven)",
    category: "risk",
    description: "인력으로 어쩔 수 없는 천재지변이나 감당하기 힘든 상위의 압력",
  },
  
  // --- [기타 주요 신살] ---

  // 13. 백호살 (Baekho) - 폭발적 에너지 (기존 유지)
  baekho: {
    key: "baekho",
    name: "백호살 (White Tiger)",
    category: "risk",
    description: "피를 본다는 강한 살기, 평소에는 잠잠하다가 폭발적인 프로페셔널 능력으로 발현",
  },
  // 14. 괴강살 (Gwoegang) - 강력한 리더십, 극단성
  gwoegang: {
    key: "gwoegang",
    name: "괴강살 (Extreme Leader)",
    category: "personality",
    description: "우두머리가 되어야 하는 강력한 기운, 총명하지만 삶의 기복이 심할 수 있음",
  },
  // 15. 귀문관살 (Gwimun) - 천재성, 신경과민
  gwimun: {
    key: "gwimun",
    name: "귀문관살 (Ghost Gate)",
    category: "focus",
    description: "귀신이 드나드는 문, 남다른 직관력과 천재성 혹은 신경 예민과 집착",
  },
  // lib/shinsal.ts 추가 예시
hyeonchim: { key: "hyeonchim", name: "현침살", category: "risk", description: "바늘처럼 예민하고 날카로운 전문성 (의료, IT, 디자인)" },

};