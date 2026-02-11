// lib/geocoder.ts

type GeoData = {
    lat: number;
    lng: number;
    name: string;
  };
  
  // 주요 도시 좌표 데이터베이스 (필요하면 더 추가하면 됩니다)
  const CITY_DB: Record<string, GeoData> = {
    // 한국
    "서울": { lat: 37.5665, lng: 126.9780, name: "Seoul" },
    "부산": { lat: 35.1796, lng: 129.0756, name: "Busan" },
    "인천": { lat: 37.4563, lng: 126.7052, name: "Incheon" },
    "대구": { lat: 35.8714, lng: 128.6014, name: "Daegu" },
    "대전": { lat: 36.3504, lng: 127.3845, name: "Daejeon" },
    "광주": { lat: 35.1595, lng: 126.8526, name: "Gwangju" },
    "제주": { lat: 33.4996, lng: 126.5312, name: "Jeju" },
    "강릉": { lat: 37.7519, lng: 128.8760, name: "Gangneung" },
    
    // 해외 (영어/한글 병기)
    "뉴욕": { lat: 40.7128, lng: -74.0060, name: "New York" },
    "new york": { lat: 40.7128, lng: -74.0060, name: "New York" },
    "런던": { lat: 51.5074, lng: -0.1278, name: "London" },
    "london": { lat: 51.5074, lng: -0.1278, name: "London" },
    "도쿄": { lat: 35.6762, lng: 139.6503, name: "Tokyo" },
    "tokyo": { lat: 35.6762, lng: 139.6503, name: "Tokyo" },
    "파리": { lat: 48.8566, lng: 2.3522, name: "Paris" },
    "paris": { lat: 48.8566, lng: 2.3522, name: "Paris" },
  };
  
  export function getCoordinates(input: string): GeoData {
    // 1. 입력값 정리 (공백 제거, 소문자 변환 등)
    const key = input.trim().replace("시", "").replace("특별시", "").replace("광역시", "").toLowerCase();
    
    // 2. DB에서 찾기
    if (CITY_DB[key]) {
      return CITY_DB[key];
    }
  
    // 3. 없으면? (기본값으로 서울을 주되, 이름은 그대로 반환해서 AI가 알아서 처리하게 함)
    // 점성술에서는 위도가 중요하므로, 한국이라 가정하고 서울 위도를 default로 씁니다.
    return { lat: 37.5665, lng: 126.9780, name: input }; 
  }

  /** 도시별 UTC 시차(시간). 별자리 차트 계산용 */
  const CITY_TIMEZONE: Record<string, number> = {
    "서울": 9, "부산": 9, "인천": 9, "대구": 9, "대전": 9, "광주": 9, "울산": 9,
    "제주": 9, "세종": 9, "수원": 9, "고양": 9, "용인": 9, "성남": 9, "부천": 9,
    "청주": 9, "천안": 9, "전주": 9, "포항": 9, "창원": 9, "강릉": 9,
    "뉴욕": -5, "new york": -5, "로스앤젤레스": -8, "시카고": -6, "샌프란시스코": -8,
    "시애틀": -8, "워싱턴dc": -5, "보스턴": -5, "하와이": -10,
    "런던": 0, "london": 0, "도쿄": 9, "tokyo": 9, "오사카": 9, "교토": 9,
    "후쿠오카": 9, "삿포로": 9, "나고야": 9, "오키나와": 9,
    "파리": 1, "paris": 1, "베를린": 1, "로마": 1, "마드리드": 1, "암스테르담": 1, "프라하": 1,
    "베이징": 8, "상하이": 8, "광저우": 8, "홍콩": 8, "마카오": 8,
    "시드니": 11, "토론토": -5, "밴쿠버": -8, "방콕": 7, "싱가포르": 8, "호치민": 7, "두바이": 4,
  };

  export function getTimezoneOffset(cityInput: string): number {
    const key = cityInput.trim().replace("시", "").replace("특별시", "").replace("광역시", "").toLowerCase();
    return CITY_TIMEZONE[key] ?? 9;
  }