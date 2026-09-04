"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCoordinates, getTimezoneOffset } from "@/lib/geocoder";
import { calculateChart } from "@/lib/calculateChart";

// Country + major city data for the birthplace picker (US-first)
const LOCATION_DATA: Record<string, string[]> = {
  "United States": [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
    "San Antonio", "San Diego", "Dallas", "Austin", "San Jose", "San Francisco",
    "Seattle", "Denver", "Boston", "Washington, DC", "Nashville", "Atlanta",
    "Miami", "Las Vegas", "Portland", "Minneapolis", "Detroit", "New Orleans",
    "Charlotte", "Orlando", "Salt Lake City", "Honolulu", "Anchorage",
    "Kansas City", "St. Louis", "Pittsburgh", "Baltimore", "Sacramento",
    "Raleigh", "Columbus", "Indianapolis", "Milwaukee", "Memphis", "Oklahoma City",
  ],
  Canada: ["Toronto", "Vancouver", "Montreal"],
  "United Kingdom": ["London", "Manchester", "Edinburgh"],
  Other: ["Paris", "Tokyo", "Seoul", "Sydney", "Mexico City", "Mumbai", "Manila"],
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

  // Form state
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("1990");
  const [birthMonth, setBirthMonth] = useState("01");
  const [birthDay, setBirthDay] = useState("01");
  const [birthHour, setBirthHour] = useState("12");
  const [birthMinute, setBirthMinute] = useState("00");
  const [birthAmPm, setBirthAmPm] = useState("PM"); // default noon — AM would be sent as hour 0 (midnight)

  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [calendarType, setCalendarType] = useState<"solar" | "lunar" | "">("solar"); // default: solar calendar

  // Birthplace: country + city
  const [birthCountry, setBirthCountry] = useState("United States");
  const [birthCity, setBirthCity] = useState("New York");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const restoredCountryRef = useRef<string | null>(null);

  // On first load, restore birthplace/time etc. from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sajuForm");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, string>;
      if (parsed.birthCountry) restoredCountryRef.current = parsed.birthCountry;
      if (parsed.birthYear) setBirthYear(parsed.birthYear);
      if (parsed.birthMonth) setBirthMonth(parsed.birthMonth);
      if (parsed.birthDay) setBirthDay(parsed.birthDay);
      if (parsed.birthHour) setBirthHour(parsed.birthHour);
      if (parsed.birthMinute) setBirthMinute(parsed.birthMinute);
      if (parsed.birthAmPm) setBirthAmPm(parsed.birthAmPm);
      if (parsed.birthCountry && LOCATION_DATA[parsed.birthCountry]) {
        setBirthCountry(parsed.birthCountry);
        if (parsed.birthCity && LOCATION_DATA[parsed.birthCountry].includes(parsed.birthCity)) {
          setBirthCity(parsed.birthCity);
        } else {
          setBirthCity(LOCATION_DATA[parsed.birthCountry][0]);
        }
      }
      if (parsed.name != null) setName(parsed.name);
      if (parsed.calendarType === "solar" || parsed.calendarType === "lunar") setCalendarType(parsed.calendarType);
      if (parsed.gender === "male" || parsed.gender === "female") setGender(parsed.gender);
    } catch (_) {
      // ignore
    }
  }, []);

  // When the country changes, default to its first city (skip once right after restoring)
  useEffect(() => {
    if (restoredCountryRef.current !== null && restoredCountryRef.current === birthCountry) {
      restoredCountryRef.current = null;
      return;
    }
    if (LOCATION_DATA[birthCountry]) {
      setBirthCity(LOCATION_DATA[birthCountry][0]);
    }
  }, [birthCountry]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    localStorage.setItem("userName", name);
    try {
      localStorage.setItem(
        "sajuForm",
        JSON.stringify({
          name,
          birthYear,
          birthMonth,
          birthDay,
          birthHour,
          birthMinute,
          birthAmPm,
          birthCountry,
          birthCity,
          calendarType,
          gender,
        })
      );
    } catch (_) {}

    // Convert to 24-hour time
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
      gender: gender === "male" ? "male" : gender === "female" ? "female" : "",
      calendar: calendarType === "solar" ? "solar" : calendarType === "lunar" ? "lunar" : "solar",
      ampm: birthAmPm, // sent so the API can correct the hour precisely
      location: birthCity,
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
        throw new Error(apiError || "Your reading couldn't be generated.");
      }

      const data: AnalyzeResult = await res.json();

      // Refine sun/moon/rising signs client-side using exact lat/lng (pure JS, no WASM)
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
        // fall back to the sun/moon/rising the API already returned
      }

      localStorage.setItem("sajuResult", JSON.stringify(data));
      router.push("/result");
    } catch (err: any) {
      setError(
        (err && err.message) ||
          "Something went wrong. Please try again in a moment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-saju-bg text-saju-text flex justify-center px-4">
      <main className="relative w-full max-w-md py-10 pb-16">
        {/* Header */}
        <header className="mb-8 text-center sm:text-left">
          <p className="text-sm font-medium mb-2 flex items-center justify-center sm:justify-start gap-1.5 text-saju-accent">
            Astrology + Saju, blended with precision
            <span aria-hidden>🧪</span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-saju-text">
            Your Destiny Report
          </h1>
        </header>

        <form onSubmit={handleAnalyze} className="space-y-6">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-saju-text mb-2"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text placeholder-saju-muted focus:outline-none focus:ring-2 focus:ring-saju-accent/30 focus:border-saju-accent/50 transition text-[15px]"
              disabled={loading}
            />
          </div>

          {/* Date of birth (US order: Month / Day / Year) */}
          <div>
            <label className="block text-sm font-medium text-saju-text mb-2">
              Date of Birth
            </label>
            <div className="flex gap-2">
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className="w-24 px-3 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text focus:outline-none focus:ring-2 focus:ring-saju-accent/30 text-[15px]"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const val = (i + 1).toString().padStart(2, "0");
                  return <option key={val} value={val}>{i + 1}</option>;
                })}
              </select>
              <select
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                className="w-24 px-3 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text focus:outline-none focus:ring-2 focus:ring-saju-accent/30 text-[15px]"
              >
                {Array.from({ length: 31 }, (_, i) => {
                  const val = (i + 1).toString().padStart(2, "0");
                  return <option key={val} value={val}>{i + 1}</option>;
                })}
              </select>
              <select
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="flex-1 px-3 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text focus:outline-none focus:ring-2 focus:ring-saju-accent/30 text-[15px]"
              >
                {Array.from({ length: 100 }, (_, i) => {
                  const year = 2026 - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          </div>

          {/* Time of birth */}
          <div>
            <label className="block text-sm font-medium text-saju-text mb-2">
              Time of Birth
            </label>
            <div className="flex gap-2">
              <select
                value={birthHour}
                onChange={(e) => setBirthHour(e.target.value)}
                className="flex-1 px-3 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text focus:outline-none focus:ring-2 focus:ring-saju-accent/30 text-[15px]"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const val = (i + 1).toString().padStart(2, "0");
                  return <option key={val} value={val}>{val}</option>;
                })}
              </select>
              <select
                value={birthMinute}
                onChange={(e) => setBirthMinute(e.target.value)}
                className="flex-1 px-3 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text focus:outline-none focus:ring-2 focus:ring-saju-accent/30 text-[15px]"
              >
                {Array.from({ length: 60 }, (_, i) => {
                  const val = i.toString().padStart(2, "0");
                  return <option key={val} value={val}>{val}</option>;
                })}
              </select>
              <select
                value={birthAmPm}
                onChange={(e) => setBirthAmPm(e.target.value)}
                className="w-24 px-3 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text focus:outline-none focus:ring-2 focus:ring-saju-accent/30 text-[15px]"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          {/* Calendar type */}
          <div>
            <span className="block text-sm font-medium text-saju-text mb-1">
              Calendar Type
            </span>
            <p className="text-xs text-saju-muted mb-3">
              Not sure? Almost everyone should pick Solar — the calendar used in the US.
            </p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="calendarType"
                  value="solar"
                  checked={calendarType === "solar"}
                  onChange={() => setCalendarType("solar")}
                  className="w-4 h-4 accent-saju-accent border-saju-border bg-saju-input"
                  disabled={loading}
                />
                <span className="text-saju-text group-hover:text-saju-accent transition">
                  Solar (most common)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="calendarType"
                  value="lunar"
                  checked={calendarType === "lunar"}
                  onChange={() => setCalendarType("lunar")}
                  className="w-4 h-4 accent-saju-accent border-saju-border bg-saju-input"
                  disabled={loading}
                />
                <span className="text-saju-text group-hover:text-saju-accent transition">
                  Lunar
                </span>
              </label>
            </div>
          </div>

          {/* Place of birth — country + city dropdowns */}
          <div>
            <label className="block text-sm font-medium text-saju-text mb-2">
              Where Were You Born?
            </label>
            <div className="flex gap-2">
              {/* Country */}
              <select
                value={birthCountry}
                onChange={(e) => setBirthCountry(e.target.value)}
                className="flex-1 px-3 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text focus:outline-none focus:ring-2 focus:ring-saju-accent/30 text-[15px]"
                disabled={loading}
              >
                {Object.keys(LOCATION_DATA).map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>

              {/* City */}
              <select
                value={birthCity}
                onChange={(e) => setBirthCity(e.target.value)}
                className="flex-[1.5] px-3 py-3 rounded-2xl bg-saju-input border border-saju-border text-saju-text focus:outline-none focus:ring-2 focus:ring-saju-accent/30 text-[15px]"
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

          {/* Submit */}
          <div className="pt-6">
            <button
              type="submit"
              className={`w-full py-4 rounded-2xl bg-saju-accent text-white font-semibold text-lg tracking-wide shadow-md shadow-saju-accent/20 hover:bg-saju-accent-hover active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 ${
                loading ? "opacity-60 pointer-events-none" : ""
              }`}
              disabled={loading}
            >
              {loading && (
                <span className="inline-block animate-spin mr-2" aria-label="Loading">
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
              {loading ? "Reading your chart..." : "Get My Reading — $1.99"}
            </button>
          </div>
        </form>

        <p className="text-center text-saju-muted text-xs mt-8">
          Your info is used only to generate this reading — nothing is stored or shared.
        </p>

        {/* Error message */}
        {error && (
          <section className="mt-6">
            <div className="bg-red-950/40 border border-red-900/60 rounded-2xl p-4 text-sm text-red-400">
              {error}
            </div>
          </section>
        )}
      </main>

      {/* Full-screen loading state — same background as the rest of the app */}
      {loading && (
        <div className="fixed inset-0 z-40 bg-saju-bg flex flex-col items-center justify-center text-saju-text">
          <div className="text-center px-6">
            <p className="text-lg font-semibold mb-2 text-saju-text">
              Blending your birth chart with the stars...
            </p>
            <p className="text-sm text-saju-muted">
              This usually takes about a minute
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
