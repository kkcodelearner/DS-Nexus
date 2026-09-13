import { ArrowRightIcon, CalendarIcon, FileTextIcon, IndianRupee } from "lucide-react";
import { Link } from "react-router-dom";
import AttendanceCalendar from "./attendance/AttendanceCalendar";
import { EmployeePunctualityMeter, type EmployeePunctualityData } from "./PunctualityMeter";

interface EmployeeDashboardProps {
  data: {
    employee: {
      firstName?: string;
      position?: string;
      department?: string;
    };
    currentMonthAttendance: number;
    pendingLeaves: number;
    latestPayslip?: {
      netSalary?: number;
    };
    punctualityMeter?: EmployeePunctualityData;
  };
}

const EmployeeDashboard = ({ data }: EmployeeDashboardProps) => {
  const emp = data.employee;
  const cards = [
    {
      icon: CalendarIcon,
      value: data.currentMonthAttendance,
      title: "Days Present",
      subtitle: "This month"
    },
    {
      icon: FileTextIcon,
      value: data.pendingLeaves,
      title: "Pending Leaves",
      subtitle: "Awaiting approval"
    },
    {
      icon: IndianRupee,
      value: data.latestPayslip ? `₹${data.latestPayslip.netSalary?.toLocaleString()}` : "N/A",
      title: "Latest Payslip",
      subtitle: "Most Recent Payout"
    }
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Welcome, {emp?.firstName}!</h1>
          <p className="page-subtitle">{emp?.position} • {emp?.department || "Not assigned"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/attendance" className="btn-primary text-center inline-flex items-center justify-center gap-2 text-xs sm:text-sm py-2 px-4">
            Mark Attendance <ArrowRightIcon className="w-4 h-4" />
          </Link>
          <Link to="/leave" className="btn-secondary text-center text-xs sm:text-sm py-2 px-4">
            Apply for Leave
          </Link>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {cards.map((card, index) => (
          <div key={index} className="card card-hover p-5 sm:p-6 relative overflow-hidden group flex items-center justify-between">
            <div>
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />
              <p className="text-sm font-medium text-slate-700">{card.title}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
            </div>
            <card.icon className="size-10 p-2.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors duration-200" />
          </div>
        ))}
      </div>

      {/* Personal Employee Punctuality Meter */}
      {data.punctualityMeter && (
        <EmployeePunctualityMeter data={data.punctualityMeter} />
      )}

      {/* Attendance Calendar */}
      <AttendanceCalendar isAdmin={false} />
    </div>
  );
};

export default EmployeeDashboard;