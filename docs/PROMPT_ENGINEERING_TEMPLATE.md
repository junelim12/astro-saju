# Result 화면 필드 명칭 & 프롬프트 엔지니어링 템플릿

Result 화면에 표시되는 섹션/필드와 API(LLM) 출력 키를 매핑한 문서입니다.  
프롬프트 작성 시 **출력 키 이름**과 **화면에 보이는 문구**를 맞추기 위해 참고하세요.

---

## 1. Result 화면 섹션 ↔ API 필드 매핑

| Result 화면 (사용자에게 보이는 문구) | API 응답 필드 키 | 비고 |
|--------------------------------------|------------------|------|
| **(한줄요약)** — 현재 Result 상단에는 미노출 | `one_line` | 한 문장 요약 (선택 활용) |
| **사주가 이야기하는 {이름}님의 기질** | `personality` | 본문 전체 |
| ↳ 서브타이틀: 흙의 사주가 만드는 단단한 중심 | (고정 문구) | |
| **별자리가 말하는 {이름}님** | `sunSign`, `moonSign`, `risingSign` | 카드 3개 |
| ↳ 서브타이틀: 태양·달·상승궁으로 읽는 당신 | (고정 문구) | |
| ↳ Sun Sign (태양별자리) 카드 | `sunSign` | 외부에 드러나는 에너지, 본질적 성향 |
| ↳ Moon Sign (달별자리) 카드 | `moonSign` | 내면의 감정과 욕구, 숨겨진 나 |
| ↳ 상승궁 (Rising) 카드 | `risingSign` | 첫인상과 사회적 가면 |
| **직업과 진로** | `career` | 본문 전체 (업무 스타일·소통 방식 카드) |
| ↳ 서브타이틀: 어울리는 직업 / 추천 산업 / {이름}님의 업무 스타일... | (일부 고정) | |
| **{이름}님의 로맨스** | `love` | 본문 전체 |
| ↳ 서브타이틀: 끌리는 상대 특징 | (고정 문구) | |
| **재물과 투자** | `investment` 또는 아래 3개 | 통째로 쓰거나 3개로 분리 |
| ↳ {이름}님의 전반적인 재물운 | `investmentWealth` | (선택) 없으면 `investment` 전체 사용 |
| ↳ {이름}님의 투자성향 | `investmentStyle` | (선택) |
| ↳ 주의해야 할 점 | `investmentCaution` | (선택) |
| **{이름}님의 운명을 바라보는 별과 사주의 속삭임** | `destiny` | 본문 전체 |

---

## 2. LLM 출력 JSON 키 정리 (복사용)

```
one_line
personality
sunSign
moonSign
risingSign
career
love
investment
investmentWealth
investmentStyle
investmentCaution
destiny
```

---

## 3. 프롬프트에 넣을 때 참고 문구 (복사용)

아래 문구를 그대로 시스템/유저 프롬프트에 넣어서 **어떤 키에 어떤 내용**을 쓸지 LLM에게 알려줄 수 있습니다.

```
[출력 키와 용도]
- one_line: 한 문장으로 인생 방향을 시적으로 요약. 반드시 "{이름}님" 포함.
- personality: 사주(일주) 기질 + 서양 별자리 성향을 비교한 통합 성격 분석. 3단락 권장.
- sunSign: 태양별자리 해석 — 외부에 드러나는 에너지, 본질적 성향 (2~3문장).
- moonSign: 달별자리 해석 — 내면의 감정과 욕구, 숨겨진 나 (2~3문장).
- risingSign: 상승궁 해석 — 첫인상과 사회적 가면, 세상에 보이는 모습 (2~3문장).
- career: 직업·진로. 추천 산업/역할, 업무 스타일, 동료/상사와의 궁합. 3단락 권장.
- love: 연애·로맨스. 이상형, 끌리는 상대, 피해야 할 타입, 결혼 조언. 3단락 권장.
- investment: 재물·투자. (통째로 쓸 때) 재물운 + 투자성향 + 주의점을 묶어서.
- investmentWealth: 재물과 투자 — "전반적인 재물운" 카드용 문단.
- investmentStyle: 재물과 투자 — "투자성향" 카드용 문단.
- investmentCaution: 재물과 투자 — "주의해야 할 점" 카드용 문단.
- destiny: 신살·운명. 신살이 삶에 미치는 영향, 향후 5년 빅웨이브, 구체적 조언. 3단락 권장.

모든 문단은 "{이름}님"을 주어로 사용하고, 한국어 존댓말로 작성.
```

---

## 4. 현재 API 실제 반환 필드 (참고)

`app/api/analyze/route.ts` 기준으로 **현재 실제로 반환하는 키**는 아래 6개입니다.

- `one_line`
- `personality`
- `career`
- `love`
- `investment`
- `destiny`

`sunSign`, `moonSign`, `risingSign`, `investmentWealth`, `investmentStyle`, `investmentCaution`은  
Result 화면 타입에는 있으나 **API에서 아직 생성·반환하지 않으면** 해당 카드는 "(추후 채워넣을 영역)"으로 표시됩니다.  
프롬프트와 API 응답 구조를 확장할 때 위 키 이름을 그대로 쓰면 Result와 자동으로 연결됩니다.
