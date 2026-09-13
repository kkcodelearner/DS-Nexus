import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Info, CheckCircle2, AlertTriangle, XCircle, Coffee } from "lucide-react";
import api from "../../api/axios";

interface AttendanceRecord {
  _id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut?: string | null;
  status: "PRESENT" | "ABSENT" | "LATE";
  workingHours?: number | null;
  dayType?: "Full Day" | "Three Quarter Day" | "Half Day" | "Short Day" | null;
}

interface EmployeeItem {
  id: string;
  _id: string;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
}

interface AttendanceCalendarProps {
  isAdmin?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const AttendanceCalendar = ({ isAdmin = false }: AttendanceCalendarProps) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // 1-12
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDateDetail, setSelectedDateDetail] = useState<{
    dateStr: string;
    dayName: string;
    isWeekend: boolean;
    record: AttendanceRecord | null;
  } | null>(null);

  // Fetch employee list if Admin
  useEffect(() => {
    if (isAdmin) {
      api.get("/employees")
        .then((res) => {
          const list = res.data || [];
          setEmployees(list);
          if (list.length > 0 && !selectedEmpId) {
            setSelectedEmpId(list[0].id || list[0]._id);
          }
        })
        .catch((err) => console.error("Failed to fetch employees for calendar", err));
    }
  }, [isAdmin]);

  // Fetch monthly attendance data
  const fetchMonthlyData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        year: selectedYear,
        month: selectedMonth,
      };
      if (isAdmin && selectedEmpId) {
        params.employeeId = selectedEmpId;
      }
      const res = await api.get("/attendance/monthly", { params });
      setRecords(res.data?.data || []);
      if (isAdmin && res.data?.selectedEmployeeId && !selectedEmpId) {
        setSelectedEmpId(res.data.selectedEmployeeId);
      }
    } catch (err) {
      console.error("Error fetching monthly attendance", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedEmpId, isAdmin]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  // Navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleToday = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth() + 1);
  };

  // Format helpers
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const formatHours = (hours?: number | null) => {
    if (hours === undefined || hours === null) return "-";
    const hrs = Math.floor(hours);
    const mins = Math.round((hours - hrs) * 60);
    if (hrs === 0 && mins === 0) return "0 hrs";
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  // Calendar logic calculation
  const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  // Generate grid items
  const gridCells = [];
  
  // Previous month padding cells
  for (let i = 0; i < startingDayOfWeek; i++) {
    gridCells.push({ isPadding: true, key: `pad-prev-${i}` });
  }

  // Map of date string -> record (YYYY-MM-DD)
  const recordsByDateMap = new Map<string, AttendanceRecord>();
  records.forEach((rec) => {
    const d = new Date(rec.date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    recordsByDateMap.set(dateStr, rec);
  });

  // Current month day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDateObj = new Date(selectedYear, selectedMonth - 1, day);
    const dayOfWeek = currentDateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record = recordsByDateMap.get(dateStr) || null;
    const isToday =
      day === today.getDate() &&
      selectedMonth === today.getMonth() + 1 &&
      selectedYear === today.getFullYear();
    const isPastDay = currentDateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());

    gridCells.push({
      isPadding: false,
      day,
      dateObj: currentDateObj,
      dateStr,
      isWeekend,
      record,
      isToday,
      isPastDay,
      dayName: currentDateObj.toLocaleDateString("en-US", { weekday: "short" }),
      key: `day-${day}`,
    });
  }

  // Next month padding cells to complete 35 or 42 grid slots
  const remainingSlots = (7 - (gridCells.length % 7)) % 7;
  for (let i = 0; i < remainingSlots; i++) {
    gridCells.push({ isPadding: true, key: `pad-next-${i}` });
  }

  const yearOptions = [];
  const currentYr = today.getFullYear();
  for (let y = currentYr - 3; y <= currentYr + 1; y++) {
    yearOptions.push(y);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden mt-8">
      {/* Calendar Header & Filters Bar */}
      <div className="p-5 bg-slate-50/60 border-b border-slate-200/80 flex flex-col gap-4">
        {/* Title & Description Row */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Attendance Calendar</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Monthly overview of daily check-in, check-out, and working hours
            </p>
          </div>
        </div>

        {/* Filters & Navigation Controls (1 Horizontal Line shifted to Right) */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-200/60">
          {/* Admin Employee Selector */}
          {isAdmin && employees.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs shrink-0">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="!w-auto !py-1 bg-transparent border-none focus:outline-none font-medium text-slate-800 cursor-pointer pr-1"
              >
                {employees.map((emp) => (
                  <option key={emp.id || emp._id} value={emp.id || emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.department || "Employee"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="!w-auto bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-2xs shrink-0"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="!w-auto bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-2xs shrink-0"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Today Button */}
          <button
            onClick={handleToday}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer shrink-0"
          >
            Today
          </button>

          {/* Prev/Next Month Arrow Buttons */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs shrink-0">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="p-4 sm:p-6 overflow-x-auto">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium text-slate-500 mt-2">Loading attendance calendar...</p>
          </div>
        ) : (
          <div className="min-w-[700px]">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                <div
                  key={day}
                  className={`py-2 text-center text-xs font-bold uppercase tracking-wider ${
                    idx === 0 || idx === 6 ? "text-rose-500/80" : "text-slate-500"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Cells */}
            <div className="grid grid-cols-7 gap-2">
              {gridCells.map((cell) => {
                if (cell.isPadding) {
                  return (
                    <div
                      key={cell.key}
                      className="min-h-[115px] bg-slate-50/40 rounded-xl border border-slate-100/60 p-2 opacity-30"
                    />
                  );
                }

                const rec = cell.record;
                let statusBadge = null;

                if (rec) {
                  if (rec.status === "PRESENT") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Present
                      </span>
                    );
                  } else if (rec.status === "LATE") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                        <AlertTriangle className="w-2.5 h-2.5" /> Late
                      </span>
                    );
                  } else if (rec.status === "ABSENT") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                        <XCircle className="w-2.5 h-2.5" /> Absent
                      </span>
                    );
                  }
                } else if (cell.isWeekend) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200/60">
                      <Coffee className="w-2.5 h-2.5" /> Weekend
                    </span>
                  );
                } else if (cell.isPastDay) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200/50">
                      No Record
                    </span>
                  );
                }

                return (
                  <div
                    key={cell.key}
                    onClick={() =>
                      setSelectedDateDetail({
                        dateStr: cell.dateStr,
                        dayName: cell.dayName,
                        isWeekend: cell.isWeekend,
                        record: cell.record,
                      })
                    }
                    className={`min-h-[115px] p-2.5 rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:shadow-md ${
                      cell.isToday
                        ? "bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-500/20"
                        : cell.isWeekend
                        ? "bg-slate-50/70 border-slate-200/70"
                        : rec
                        ? "bg-white border-slate-200 hover:border-indigo-200"
                        : "bg-white border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    {/* Top Row: Date Number & Status Badge */}
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={`text-xs font-bold flex items-center justify-center w-6 h-6 rounded-lg ${
                          cell.isToday
                            ? "bg-indigo-600 text-white shadow-xs"
                            : cell.isWeekend
                            ? "text-slate-400"
                            : "text-slate-800 group-hover:text-indigo-600"
                        }`}
                      >
                        {cell.day}
                      </span>
                      {statusBadge}
                    </div>

                    {/* Middle Details: In / Out Times & Working Hours */}
                    {rec ? (
                      <div className="mt-2 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-[10px] font-medium text-slate-400">In:</span>
                          <span className="font-semibold text-slate-700">{formatTime(rec.checkIn)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-[10px] font-medium text-slate-400">Out:</span>
                          <span className="font-semibold text-slate-700">{formatTime(rec.checkOut)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-slate-600">
                          <span className="text-[10px] font-medium text-slate-400">Hours:</span>
                          <span className="font-bold text-indigo-600">{formatHours(rec.workingHours)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex-1 flex flex-col justify-end">
                        <p className="text-[10px] text-slate-400 italic">
                          {cell.isWeekend ? "Off Day" : cell.isPastDay ? "No Log" : "Upcoming"}
                        </p>
                      </div>
                    )}

                    {/* Bottom Row: Day Type Pill if present */}
                    {rec?.dayType && (
                      <div className="mt-1.5">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[9px] truncate max-w-full">
                          {rec.dayType}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal on Day Click */}
      {selectedDateDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedDateDetail(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {new Date(selectedDateDetail.dateStr).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <p className="text-xs text-slate-500">Attendance Details</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDateDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3">
              {selectedDateDetail.record ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">Status</span>
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white border shadow-2xs">
                      {selectedDateDetail.record.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">In Time</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">
                        {formatTime(selectedDateDetail.record.checkIn)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Out Time</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">
                        {formatTime(selectedDateDetail.record.checkOut)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Working Hours</span>
                      <span className="text-sm font-bold text-indigo-600 mt-1 block">
                        {formatHours(selectedDateDetail.record.workingHours)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Day Type</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">
                        {selectedDateDetail.record.dayType || "Standard"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-slate-500 space-y-2">
                  <Info className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-medium">
                    {selectedDateDetail.isWeekend
                      ? "Weekend / Non-working day"
                      : "No check-in record found for this date."}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDateDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;
