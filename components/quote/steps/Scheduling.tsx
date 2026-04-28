"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, CheckCircle, XCircle } from "lucide-react";

interface SchedulingData {
  preferred_date: string;
  preferred_time: string;
  zip_code: string;
  service_address: string;
}

interface Props {
  data: SchedulingData;
  onChange: (data: SchedulingData) => void;
  onZipValidChange?: (valid: boolean) => void;
}

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function getWeekSunday(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDateRange(start: Date, count: number): string {
  const end = addDays(start, count - 1);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function Scheduling({ data, onChange, onZipValidChange }: Props) {
  const update = (field: keyof SchedulingData, value: string) =>
    onChange({ ...data, [field]: value });

  const [zipStatus, setZipStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");

  useEffect(() => {
    const zip = data.zip_code;
    if (zip.length !== 5) {
      setZipStatus("idle");
      onZipValidChange?.(false);
      return;
    }

    setZipStatus("checking");
    onZipValidChange?.(false);
    const controller = new AbortController();

    fetch(`https://api.zippopotam.us/us/${zip}`, { signal: controller.signal })
      .then((res) => {
        if (res.ok) {
          setZipStatus("valid");
          onZipValidChange?.(true);
        } else {
          setZipStatus("invalid");
          onZipValidChange?.(false);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setZipStatus("invalid");
          onZipValidChange?.(false);
        }
      });

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.zip_code]);

  // Stable today — computed once, never drifts during a session
  const todayRef = useRef<Date>(null as unknown as Date);
  if (!todayRef.current) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    todayRef.current = d;
  }
  const today = todayRef.current;
  // Only strictly past days (before today) are blocked
  const minDate = today;

  // How many days to show — 3 on mobile, 7 on desktop
  const [daysPerView, setDaysPerView] = useState<number>(() =>
    typeof window !== "undefined" && window.innerWidth < 600 ? 3 : 7
  );
  useEffect(() => {
    const onResize = () => setDaysPerView(window.innerWidth < 600 ? 3 : 7);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // View start — Sunday of current week (desktop) or today (mobile)
  const [viewStart, setViewStart] = useState<Date>(() =>
    typeof window !== "undefined" && window.innerWidth < 600
      ? todayRef.current
      : getWeekSunday(todayRef.current)
  );

  // Adjust viewStart when breakpoint changes
  useEffect(() => {
    setViewStart(daysPerView === 7 ? getWeekSunday(today) : today);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysPerView]);

  const visibleDays = Array.from({ length: daysPerView }, (_, i) => addDays(viewStart, i));

  const goBack = () => setViewStart(addDays(viewStart, -daysPerView));
  const goForward = () => setViewStart(addDays(viewStart, daysPerView));
  const canGoBack = viewStart > today;

  // Time windows — same endpoint as admin to guarantee identical order
  const [timeWindows, setTimeWindows] = useState<string[]>([]);
  const [winLoading, setWinLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/time-windows")
      .then((r) => r.json())
      .then((json) => {
        const sorted: string[] = (json.windows || [])
          .filter((w: { is_active: boolean }) => w.is_active)
          .sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)
          .map((w: { label: string }) => w.label);
        setTimeWindows(sorted);
      })
      .catch(() => setTimeWindows([]))
      .finally(() => setWinLoading(false));
  }, []);

  // Available slots — fetch 14 days to cover navigation
  const [availableSet, setAvailableSet] = useState<Set<string>>(new Set());
  const [slotsLoading, setSlotsLoading] = useState(true);

  useEffect(() => {
    setSlotsLoading(true);
    fetch(`/api/availability?week_start=${toDateStr(viewStart)}`)
      .then((r) => r.json())
      .then((json) => {
        const set = new Set<string>(
          (json.slots || []).map(
            (s: { date: string; time_window: string }) => `${s.date}|${s.time_window}`
          )
        );
        setAvailableSet(set);
      })
      .catch(() => setAvailableSet(new Set()))
      .finally(() => setSlotsLoading(false));
  }, [viewStart]);

  const loading = winLoading || slotsLoading;

  const handleSelect = (date: Date, window: string) => {
    onChange({ ...data, preferred_date: toDateStr(date), preferred_time: window });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">
          Appointment Date &amp; Arrival Window
        </h2>
        <p className="text-xs text-[#6FC2E3] font-medium mt-1">
          * When you review your order you can choose to receive a text message alerting you when
          we are on our way.
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Please schedule your appointment below. This is a window of time for our crew to arrive,
          not start-to-finish time.
        </p>
      </div>

      {/* Grid card */}
      <div className="border border-gray-200 rounded overflow-hidden mb-5">

        {/* Navigation header */}
        <div className="flex items-center justify-between bg-white px-2 sm:px-3 py-2.5 border-b border-gray-200">
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className="flex items-center gap-0.5 text-xs sm:text-sm font-semibold text-[#6FC2E3] disabled:text-gray-300 hover:text-[#52b5da] transition-colors whitespace-nowrap"
          >
            <ChevronLeft size={15} />
            {daysPerView === 7 ? "PREV WEEK" : "PREV"}
          </button>

          <span className="text-xs sm:text-sm font-bold text-gray-700 tracking-wide text-center px-1">
            {daysPerView === 7
              ? "SELECT BY CLICKING BELOW"
              : formatDateRange(viewStart, daysPerView)}
          </span>

          <button
            onClick={goForward}
            className="flex items-center gap-0.5 text-xs sm:text-sm font-semibold text-[#6FC2E3] hover:text-[#52b5da] transition-colors whitespace-nowrap"
          >
            {daysPerView === 7 ? "NEXT WEEK" : "NEXT"}
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Table — no horizontal scroll needed since we show 3 cols on mobile */}
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
            <colgroup>
              {/* Label column: wider on desktop, narrower on mobile */}
              <col style={{ width: daysPerView === 3 ? "90px" : "110px" }} />
              {visibleDays.map((_, i) => (
                <col key={i} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="bg-[#1A1A1A] text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-2.5 text-left border-r border-gray-600">
                  ARRIVAL
                  <br />
                  WINDOWS
                </th>
                {visibleDays.map((day, i) => {
                  const isPast = day < minDate;
                  return (
                    <th
                      key={i}
                      className={`text-center py-2.5 px-1 text-[10px] sm:text-xs font-bold border-r border-gray-600 last:border-r-0 ${
                        isPast ? "bg-[#2a2a2a] text-gray-400" : "bg-[#1A1A1A] text-white"
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-bold leading-tight">
                        {formatMonthDay(day)}
                      </div>
                      <div className="text-[9px] sm:text-[10px] tracking-wider mt-0.5">
                        {DAY_LABELS[day.getDay()]}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeWindows.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={visibleDays.length + 1}
                    className="text-center py-8 text-sm text-gray-400"
                  >
                    No time slots available. Please check back later.
                  </td>
                </tr>
              ) : null}

              {timeWindows.map((tw, wi) => (
                <tr key={tw} className={wi % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  {/* Window label — wraps on mobile */}
                  <td className="text-[10px] sm:text-sm font-semibold text-gray-700 px-1.5 sm:px-3 py-2 sm:py-3 border-r border-gray-200 leading-tight">
                    {tw}
                  </td>

                  {visibleDays.map((day, di) => {
                    const dateStr = toDateStr(day);
                    const key = `${dateStr}|${tw}`;
                    const isPast = day < minDate;
                    const isAvailable = !isPast && availableSet.has(key);
                    const isSelected =
                      data.preferred_date === dateStr && data.preferred_time === tw;

                    return (
                      <td
                        key={di}
                        onClick={() => isAvailable && handleSelect(day, tw)}
                        className={`text-center py-2 sm:py-3 px-0 last:border-r-0 transition-colors ${
                          isSelected
                            ? "bg-green-500 border border-green-400 cursor-pointer"
                            : isPast || !isAvailable
                            ? "bg-[#c8c8c8] border border-[#b8b8b8]"
                            : "bg-white border border-gray-200 hover:bg-[#e8f6fc] cursor-pointer"
                        }`}
                      >
                        {loading ? (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-gray-300 mx-auto animate-pulse bg-gray-200" />
                        ) : isPast || !isAvailable ? (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 mx-auto" />
                        ) : (
                          <div
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 mx-auto flex items-center justify-center ${
                              isSelected ? "border-white bg-black" : "border-gray-400 bg-white"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-black" />
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 px-3 sm:px-4 py-2.5 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border border-gray-300 bg-white shrink-0" />
            <span className="text-[10px] sm:text-xs text-gray-600">Available Time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-[#c8c8c8] border border-[#b8b8b8] shrink-0" />
            <span className="text-[10px] sm:text-xs text-gray-600">Not Available Time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-green-500 shrink-0" />
            <span className="text-[10px] sm:text-xs text-gray-600">Selected Time</span>
          </div>
        </div>
      </div>

      {/* Selected slot banner */}
      {data.preferred_date && data.preferred_time && (
        <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded text-sm">
          <span className="font-semibold text-green-800">Selected: </span>
          <span className="text-green-700">
            {new Date(data.preferred_date + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}{" "}
            — {data.preferred_time}
          </span>
        </div>
      )}

      {/* Location fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            <MapPin size={14} className="inline mr-1 text-[#6FC2E3]" />
            Zip Code <span className="text-red-500">*</span>
          </label>
          <div className="relative max-w-xs">
            <input
              type="text"
              value={data.zip_code}
              onChange={(e) => update("zip_code", e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="Enter your zip code"
              maxLength={5}
              className={`w-full border rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 pr-9 ${
                zipStatus === "valid"
                  ? "border-green-400 focus:border-green-400 focus:ring-green-200"
                  : zipStatus === "invalid"
                  ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                  : "border-gray-300 focus:border-[#6FC2E3] focus:ring-[#6FC2E3]"
              }`}
            />
            {zipStatus === "checking" && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#6FC2E3] border-t-transparent rounded-full animate-spin" />
            )}
            {zipStatus === "valid" && (
              <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
            )}
            {zipStatus === "invalid" && (
              <XCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
            )}
          </div>
          {zipStatus === "invalid" && (
            <p className="text-xs text-red-500 mt-1">Please enter a valid US ZIP code.</p>
          )}
          {zipStatus === "valid" && (
            <p className="text-xs text-green-600 mt-1">Valid US ZIP code ✓</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Service Address
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <input
            type="text"
            value={data.service_address}
            onChange={(e) => update("service_address", e.target.value)}
            placeholder="123 Main St, City, State"
            className="w-full max-w-lg border border-gray-300 rounded px-3 py-5 mb-2 text-sm focus:outline-none focus:border-[#6FC2E3] focus:ring-1 focus:ring-[#6FC2E3]"
          />
        </div>
      </div>
    </div>
  );
}
