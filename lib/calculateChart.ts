/**
 * 태양별자리, 달별자리, 상승궁 정밀 계산 (Swiss Ephemeris WASM)
 * 태어난 장소(위도, 경도)를 반영하여 상승궁을 계산합니다.
 * 브라우저에서만 동작하므로 dynamic import로 사용하세요.
 */

import { ZODIAC_SIGNS_BY_INDEX } from "./zodiacDescriptions";

export type ChartInput = {
  /** 출생 연도 */
  year: number;
  /** 출생 월 (1–12) */
  month: number;
  /** 출생 일 */
  day: number;
  /** 출생 시 (0–23, 현지시간) */
  hour: number;
  /** 출생 분 (0–59) */
  minute: number;
  /** 출생지 UTC 시차 (시간 단위, 예: 한국 +9, 뉴욕 -5) */
  timezoneOffset: number;
  /** 출생지 위도 (도) */
  latitude: number;
  /** 출생지 경도 (도, 동경 양수) */
  longitude: number;
};

export type ChartResult = {
  sunSign: string;
  moonSign: string;
  risingSign: string;
};

/** 황경(0–360)을 별자리 인덱스(0–11)로 변환 */
function longitudeToSignIndex(longitude: number): number {
  const normalized = ((longitude % 360) + 360) % 360;
  return Math.floor(normalized / 30) % 12;
}

/** 별자리 인덱스를 한글 별자리명으로 */
function signIndexToKorean(index: number): string {
  return ZODIAC_SIGNS_BY_INDEX[index];
}

/**
 * 상승궁(ASC) 계산: Local Sidereal Time + 위도로 동쪽 지평선과 황도의 교점을 구함
 * obliquity of ecliptic ≈ 23.439279° (J2000)
 */
function calcAscendant(
  jdUt: number,
  latitudeDeg: number,
  longitudeDeg: number,
  sidtimeFn: (jd: number) => number
): number {
  const OBLIQUITY_DEG = 23.439279;
  const deg2rad = Math.PI / 180;
  const rad2deg = 180 / Math.PI;

  // Local Sidereal Time (시간) → ARMC (도)
  const sidtimeHours = sidtimeFn(jdUt);
  const lstHours = sidtimeHours + longitudeDeg / 15;
  const armcDeg = (lstHours * 15) % 360;
  const armc = (armcDeg + 360) % 360 * deg2rad;
  const latRad = latitudeDeg * deg2rad;
  const epsRad = OBLIQUITY_DEG * deg2rad;

  const y = Math.sin(armc);
  const x =
    Math.cos(armc) * Math.cos(epsRad) -
    Math.tan(latRad) * Math.sin(epsRad);
  let ascRad = Math.atan2(y, x);
  if (ascRad < 0) ascRad += 2 * Math.PI;
  const ascDeg = ascRad * rad2deg;
  return (ascDeg + 360) % 360;
}

/**
 * 출생 정보와 위도·경도를 받아 태양별자리, 달별자리, 상승궁을 계산합니다.
 * swisseph-wasm을 사용하므로 브라우저(또는 WASM 지원 환경)에서만 호출하세요.
 */
export async function calculateChart(input: ChartInput): Promise<ChartResult> {
  const {
    year,
    month,
    day,
    hour,
    minute,
    timezoneOffset,
    latitude,
    longitude,
  } = input;

  const SwissEph = (await import("swisseph-wasm")).default;
  const swe = new SwissEph();
  await swe.initSwissEph();

  try {
    // 현지시간 → UTC (시간으로 변환)
    const localHour = hour + minute / 60;
    let utcHour = localHour - timezoneOffset;
    let utcDay = day;
    let utcMonth = month;
    let utcYear = year;
    if (utcHour < 0) {
      utcHour += 24;
      utcDay -= 1;
      if (utcDay < 1) {
        utcMonth -= 1;
        if (utcMonth < 1) {
          utcMonth = 12;
          utcYear -= 1;
        }
        utcDay = new Date(utcYear, utcMonth, 0).getDate();
      }
    } else if (utcHour >= 24) {
      utcHour -= 24;
      utcDay += 1;
      const daysInMonth = new Date(utcYear, utcMonth, 0).getDate();
      if (utcDay > daysInMonth) {
        utcDay = 1;
        utcMonth += 1;
        if (utcMonth > 12) {
          utcMonth = 1;
          utcYear += 1;
        }
      }
    }
    const jdUt = swe.julday(utcYear, utcMonth, utcDay, utcHour);

    const sunPos = swe.calc_ut(jdUt, swe.SE_SUN, swe.SEFLG_SWIEPH);
    const moonPos = swe.calc_ut(jdUt, swe.SE_MOON, swe.SEFLG_SWIEPH);

    const sunLongitude = sunPos[0];
    const moonLongitude = moonPos[0];

    const ascendantLongitude = calcAscendant(
      jdUt,
      latitude,
      longitude,
      (jd: number) => swe.sidtime(jd)
    );

    return {
      sunSign: signIndexToKorean(longitudeToSignIndex(sunLongitude)),
      moonSign: signIndexToKorean(longitudeToSignIndex(moonLongitude)),
      risingSign: signIndexToKorean(longitudeToSignIndex(ascendantLongitude)),
    };
  } finally {
    swe.close();
  }
}
