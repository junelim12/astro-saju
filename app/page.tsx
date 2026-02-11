"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCoordinates, getTimezoneOffset } from "@/lib/geocoder";
import { calculateChart } from "@/lib/calculateChart";

// 1. 국가 및 주요 도시 데이터 정의 (객관식 선택용)
const LOCATION_DATA: Record<string, string[]> = {
  "대한민국": ["서울", "부산", "인천", "대구", "대전", "광주", "울산", "제주", "세종", "수원", "고양", "용인", "성남", "부천", "청주", "천안", "전주", "포항", "창원", "강릉"],
  "미국": ["뉴욕", "로스앤젤레스", "시카고", "샌프란시스코", "시애틀", "워싱턴DC", "보스턴", "하와이"],
  "일본": ["도쿄", "오사카", "교토", "후쿠오카", "삿포로", "나고야", "오키나와"],
  "중국": ["베이징", "상하이", "광저우", "홍콩", "마카오"],
  "유럽": ["런던", "파리", "베를린", "로마", "마드리드", "암스테르담", "프라하"],
  "기타": ["시드니", "토론토", "밴쿠버", "방콕", "싱가포르", "호치민", "두바이"]
};

type AnalyzeResult = {
  one_line: string;
  personality: string;
  career: string;
  love: string;
  investment: string;
  destiny: string;
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
};

export default function SajuLandingPage() {
  const router = useRouter();
  
  // 입력 상태
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("1990");
  const [birthMonth, setBirthMonth] = useState("01");
  const [birthDay, setBirthDay] = useState("01");
  const [birthHour, setBirthHour] = useState("12");
  const [birthMinute, setBirthMinute] = useState("00");
  const [birthAmPm, setBirthAmPm] = useState("AM");
  
  const [gender, setGender] = useState<"male" | "female" | "">(""); // (선택사항이라면 초기값 유지, 필수는 "male" 등으로 설정 추천)
  const [calendarType, setCalendarType] = useState<"solar" | "lunar" | "">("solar"); // 기본값 양력 추천

  // [수정됨] 위치 상태 (국가 + 도시)
  const [birthCountry, setBirthCountry] = useState("대한민국");
  const [birthCity, setBirthCity] = useState("서울");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 국가 변경 시 해당 국가의 첫 번째 도시로 자동 설정
  useEffect(() => {
    if (LOCATION_DATA[birthCountry]) {
      setBirthCity(LOCATION_DATA[birthCountry][0]);
    }
  }, [birthCountry]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    localStorage.setItem("userName", name);

    // 시간 변환 로직
    const hour12 = parseInt(birthHour || "0", 10);
    const minute = parseInt(birthMinute || "0", 10);
    let hour24 = hour12;
    
    if (birthAmPm === "PM" && hour12 < 12) hour24 += 12;
    if (birthAmPm === "AM" && hour12 === 12) hour24 = 0;

    const payload = {
      name,
      year: birthYear,
      month: birthMonth,
      day: birthDay,
      hour: String(hour24).padStart(2, "0"),
      minute: String(minute).padStart(2, "0"),
      gender: gender === "male" ? "남성" : gender === "female" ? "여성" : "",
      calendar: calendarType === "solar" ? "양력" : calendarType === "lunar" ? "음력" : "양력",
      ampm: birthAmPm, // API에서 정확한 시간 보정을 위해 추가 전송
      location: birthCity, // [수정됨] 선택된 도시 이름을 전송
    };

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const { error: apiError } = await res.json();
        throw new Error(apiError || "분석 요청에 실패했습니다.");
      }

      const data: AnalyzeResult = await res.json();

      // 태어난 장소(위·경도) 반영한 별자리 정밀 계산 (클라이언트 WASM)
      try {
        const geo = getCoordinates(birthCity);
        const timezoneOffset = getTimezoneOffset(birthCity);
        const chart = await calculateChart({
          year: parseInt(birthYear, 10),
          month: parseInt(birthMonth, 10),
          day: parseInt(birthDay, 10),
          hour: hour24,
          minute,
          timezoneOffset,
          latitude: geo.lat,
          longitude: geo.lng,
        });
        data.sunSign = chart.sunSign;
        data.moonSign = chart.moonSign;
        data.risingSign = chart.risingSign;
      } catch (_) {
        // WASM 실패 시 API에서 준 sun/moon/rising 유지
      }

      localStorage.setItem("sajuResult", JSON.stringify(data));
      router.push("/result");
    } catch (err: any) {
      setError(
        (err && err.message) ||
          "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-saju-text flex justify-center px-4">
      <main className="relative w-full max-w-md py-10 pb-16">
        {/* 헤더 — 서비스 키 문구 강조(리포트 강조색 #8F35AD) */}
        <header className="mb-8 text-center sm:text-left">
          <p className="text-sm font-medium mb-2 flex items-center justify-center sm:justify-start gap-1.5" style={{ color: "#8F35AD" }}>
            사주와 점성술을 가장 정확한 조합으로 배합한
            <span aria-hidden>🧪</span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
            운명 분석 리포트
          </h1>
        </header>

        <form onSubmit={handleAnalyze} className="space-y-6">
          {/* 이름 */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-neutral-900 mb-2"
            >
              이름
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              className="w-full px-4 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text placeholder-saju-muted focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/10 transition text-[15px]"
              disabled={loading}
            />
          </div>

          {/* 생년월일 */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              생년월일
            </label>
            <div className="flex gap-2">
              <select
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="flex-1 px-3 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text focus:outline-none focus:ring-2 focus:ring-black/10 text-[15px]"
              >
                {Array.from({ length: 100 }, (_, i) => {
                  const year = 2026 - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className="w-24 px-3 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text focus:outline-none focus:ring-2 focus:ring-black/10 text-[15px]"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const val = (i + 1).toString().padStart(2, "0");
                  return <option key={val} value={val}>{i + 1}</option>;
                })}
              </select>
              <select
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                className="w-24 px-3 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text focus:outline-none focus:ring-2 focus:ring-black/10 text-[15px]"
              >
                {Array.from({ length: 31 }, (_, i) => {
                  const val = (i + 1).toString().padStart(2, "0");
                  return <option key={val} value={val}>{i + 1}</option>;
                })}
              </select>
            </div>
          </div>

          {/* 태어난 시간 */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              태어난 시간
            </label>
            <div className="flex gap-2">
              <select
                value={birthHour}
                onChange={(e) => setBirthHour(e.target.value)}
                className="flex-1 px-3 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text focus:outline-none focus:ring-2 focus:ring-black/10 text-[15px]"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const val = (i + 1).toString().padStart(2, "0");
                  return <option key={val} value={val}>{val}</option>;
                })}
              </select>
              <select
                value={birthMinute}
                onChange={(e) => setBirthMinute(e.target.value)}
                className="flex-1 px-3 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text focus:outline-none focus:ring-2 focus:ring-black/10 text-[15px]"
              >
                {Array.from({ length: 60 }, (_, i) => {
                  const val = i.toString().padStart(2, "0");
                  return <option key={val} value={val}>{val}</option>;
                })}
              </select>
              <select
                value={birthAmPm}
                onChange={(e) => setBirthAmPm(e.target.value)}
                className="w-24 px-3 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text focus:outline-none focus:ring-2 focus:ring-black/10 text-[15px]"
              >
                <option value="AM">오전</option>
                <option value="PM">오후</option>
              </select>
            </div>
          </div>

          {/* 양력/음력 */}
          <div>
            <span className="block text-sm font-medium text-neutral-900 mb-3">
              양력/음력
            </span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="calendarType"
                  value="solar"
                  checked={calendarType === "solar"}
                  onChange={() => setCalendarType("solar")}
                  className="w-4 h-4 accent-black border-saju-border bg-saju-input"
                  disabled={loading}
                />
                <span className="text-saju-text group-hover:text-black transition">
                  양력
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="calendarType"
                  value="lunar"
                  checked={calendarType === "lunar"}
                  onChange={() => setCalendarType("lunar")}
                  className="w-4 h-4 accent-black border-saju-border bg-saju-input"
                  disabled={loading}
                />
                <span className="text-saju-text group-hover:text-black transition">
                  음력
                </span>
              </label>
            </div>
          </div>

          {/* 태어난 장소 — 피그마: 국가 + 도시 드롭다운 */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              태어난 장소
            </label>
            <div className="flex gap-2">
              {/* 국가 선택 */}
              <select
                value={birthCountry}
                onChange={(e) => setBirthCountry(e.target.value)}
                className="flex-1 px-3 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text focus:outline-none focus:ring-2 focus:ring-black/10 text-[15px]"
                disabled={loading}
              >
                {Object.keys(LOCATION_DATA).map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>

              {/* 도시 선택 */}
              <select
                value={birthCity}
                onChange={(e) => setBirthCity(e.target.value)}
                className="flex-[1.5] px-3 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text focus:outline-none focus:ring-2 focus:ring-black/10 text-[15px]"
                disabled={loading}
              >
                {LOCATION_DATA[birthCountry]?.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="pt-6">
            <button
              type="submit"
              className={`w-full py-4 rounded-2xl bg-black text-white font-semibold text-lg tracking-wide shadow-md hover:bg-black/90 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 ${
                loading ? "opacity-60 pointer-events-none" : ""
              }`}
              disabled={loading}
            >
              {loading && (
                <span className="inline-block animate-spin mr-2" aria-label="로딩중">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-30"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-70"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                </span>
              )}
              {loading ? "분석 중..." : "1,900원으로 확인하기"}
            </button>
          </div>
        </form>

        <p className="text-center text-saju-muted text-xs mt-8">
          입력하신 정보는 분석 목적으로만 사용됩니다
        </p>

        {/* 에러 표시 */}
        {error && (
          <section className="mt-6">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">
              {error}
            </div>
          </section>
        )}
      </main>

      {/* 로딩 전체 화면 — 배경 첫/결과와 동일(흰색) */}
      {loading && (
        <div className="fixed inset-0 z-40 bg-[#ffffff] flex flex-col items-center justify-center text-black">
          <div className="text-center px-6">
            <p className="text-lg font-semibold mb-2 text-black">
              사주와 점성술을 결합하는 중...
            </p>
            <p className="text-sm text-saju-muted">
              최대 1분 정도 소요됩니다
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
