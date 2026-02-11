/**
 * 태양별자리, 달별자리, 상승궁 계산 (위도·경도 반영)
 * 순수 JS로 동작하여 별도 WASM 패키지 없이 사용할 수 있습니다.
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

function signIndexToKorean(index: number): string {
  return ZODIAC_SIGNS_BY_INDEX[index];
}

/** Gregorian → Julian Day (UT 12시 기준이 아닌, 주어진 UTC 시각) */
function julday(year: number, month: number, day: number, utcHour: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    B -
    1524.5;
  return jd + (utcHour - 12) / 24;
}

/** Greenwich Mean Sidereal Time (시간, 0–24) — 단순 근사 */
function sidtime(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  const gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  const hours = ((gmst % 360) + 360) % 360 / 15;
  return hours >= 24 ? hours - 24 : hours < 0 ? hours + 24 : hours;
}

/** 태양 황경 근사 (도) — 연초 기준 평균 이동 */
function sunLongitudeApprox(jd: number): number {
  const n = jd - 2451545.0;
  const L = 280.466 + 0.9856474 * n;
  const g = 357.528 + 0.9856003 * n;
  const deg = (x: number) => ((x % 360) + 360) % 360;
  const rad = (x: number) => (x * Math.PI) / 180;
  const lambda = L + 1.915 * Math.sin(rad(g)) + 0.02 * Math.sin(rad(2 * g));
  return deg(lambda);
}

/** 달 황경 근사 (도) — 평균 이동 약 13.1764°/일 */
function moonLongitudeApprox(jd: number): number {
  const daysSinceEpoch = jd - 2451550.1;
  const longitude = (daysSinceEpoch / 27.321582) * 360;
  return ((longitude % 360) + 360) % 360;
}

/**
 * 상승궁(ASC) 계산: Local Sidereal Time + 위도로 동쪽 지평선과 황도의 교점
 */
function calcAscendant(
  jdUt: number,
  latitudeDeg: number,
  longitudeDeg: number
): number {
  const OBLIQUITY_DEG = 23.439279;
  const deg2rad = Math.PI / 180;
  const rad2deg = 180 / Math.PI;

  const sidtimeHours = sidtime(jdUt);
  const lstHours = sidtimeHours + longitudeDeg / 15;
  const armcDeg = (lstHours * 15) % 360;
  const armc = (((armcDeg + 360) % 360) * deg2rad);
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

/** 현지시간 → UTC 날짜/시간 정규화 */
function toUtc(
  year: number,
  month: number,
  day: number,
  localHour: number,
  timezoneOffset: number
): { year: number; month: number; day: number; utcHour: number } {
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
  return { year: utcYear, month: utcMonth, day: utcDay, utcHour };
}

/**
 * 출생 정보와 위도·경도를 받아 태양별자리, 달별자리, 상승궁을 계산합니다.
 * 순수 JavaScript로 계산하며, 위도·경도를 반영한 상승궁을 사용합니다.
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

  const localHour = hour + minute / 60;
  const { year: y, month: m, day: d, utcHour } = toUtc(
    year,
    month,
    day,
    localHour,
    timezoneOffset
  );

  const jdUt = julday(y, m, d, utcHour);

  const sunLongitude = sunLongitudeApprox(jdUt);
  const moonLongitude = moonLongitudeApprox(jdUt);
  const ascendantLongitude = calcAscendant(jdUt, latitude, longitude);

  return {
    sunSign: signIndexToKorean(longitudeToSignIndex(sunLongitude)),
    moonSign: signIndexToKorean(longitudeToSignIndex(moonLongitude)),
    risingSign: signIndexToKorean(longitudeToSignIndex(ascendantLongitude)),
  };
}
