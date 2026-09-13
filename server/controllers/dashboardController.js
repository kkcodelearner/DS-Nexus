import { DEPARTMENTS } from "../constants/departments.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Payslip from "../models/Payslip.js";
import KpaEvaluation from "../models/KpaEvaluation.js";
import AdminDeduction from "../models/AdminDeduction.js";

// Helper to format average check-in time
const formatAvgTime = (records) => {
    const validCheckIns = records.filter(r => r.checkIn).map(r => new Date(r.checkIn));
    if (validCheckIns.length === 0) return "09:30 AM";
    const totalMinutes = validCheckIns.reduce((sum, d) => sum + (d.getHours() * 60 + d.getMinutes()), 0);
    const avgMinutes = Math.round(totalMinutes / validCheckIns.length);
    const hours = Math.floor(avgMinutes / 60);
    const minutes = avgMinutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
};

// Helper to determine status tier
const getTier = (score) => {
    if (score >= 95) return { label: "Exemplary", code: "EXEMPLARY", color: "emerald" };
    if (score >= 85) return { label: "Consistent & On-Track", code: "ON_TRACK", color: "indigo" };
    if (score >= 70) return { label: "Needs Calibration", code: "CALIBRATION", color: "amber" };
    return { label: "Critical SLA Risk", code: "CRITICAL", color: "rose" };
};

// GET dashboard for employee and admin
// GET /api/dashboard
export const getDashboard = async (req, res) => {
    try {
        const session = req.session;
        if (!session) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        if (session.role === "ADMIN") {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const [
                totalEmployeesCount,
                employeesList,
                todayAttendanceCount,
                pendingLeavesCount,
                allMonthAttendance,
                allEvaluations,
                allDeductions
            ] = await Promise.all([
                Employee.countDocuments({ isDeleted: { $ne: true } }),
                Employee.find({ isDeleted: { $ne: true } }).select("_id firstName lastName department position").lean(),
                Attendance.countDocuments({
                    date: { $gte: todayStart, $lte: todayEnd }
                }),
                LeaveApplication.countDocuments({ status: "PENDING" }),
                Attendance.find({
                    date: { $gte: monthStart, $lte: monthEnd }
                }).lean(),
                KpaEvaluation.find().lean(),
                AdminDeduction.find({ status: "ACTIVE" }).lean()
            ]);

            // Calculate Employee-Based Punctuality Metrics
            const employeePunctualityList = employeesList.map(emp => {
                const empPunches = allMonthAttendance.filter(r => r.employeeId?.toString() === emp._id.toString());
                const empOnTime = empPunches.filter(r => r.status === "PRESENT").length;
                const empLate = empPunches.filter(r => r.status === "LATE").length;
                const empHalfDay = empPunches.filter(r => r.dayType === "Half Day" || r.dayType === "Short Day").length;

                const empEval = allEvaluations.find(ev => ev.employeeId?.toString() === emp._id.toString());
                const empDeductions = allDeductions.filter(d => d.employeeId?.toString() === emp._id.toString());
                const deductionSum = empDeductions.reduce((s, d) => s + (d.deductionScore || 0), 0);

                // 60% Attendance punch score
                const punchScore = empPunches.length > 0
                    ? Math.min(100, Math.max(0, ((empOnTime * 1.0 + empLate * 0.5 + empHalfDay * 0.5) / empPunches.length) * 100))
                    : 95;

                // 40% KPA SLA score
                let kpaScore = 90;
                if (empEval) {
                    const tatRating = empEval.ratings?.find(r => 
                        r.metricId?.toLowerCase().includes("tat") || 
                        r.title?.toLowerCase().includes("tat") ||
                        r.title?.toLowerCase().includes("turnaround") ||
                        r.title?.toLowerCase().includes("speed")
                    );
                    const rawTat = tatRating ? tatRating.score : (empEval.rawWeightedScore || 4.2);
                    const netTat = Math.max(0, rawTat - deductionSum);
                    kpaScore = Math.min(100, Math.max(0, (netTat / 5.0) * 100));
                } else if (deductionSum > 0) {
                    kpaScore = Math.max(0, ((4.0 - deductionSum) / 5.0) * 100);
                }

                const compositeScore = Number((0.60 * punchScore + 0.40 * kpaScore).toFixed(1));
                const onTimeRate = empPunches.length > 0
                    ? Number(((empOnTime / empPunches.length) * 100).toFixed(1))
                    : 100;

                return {
                    id: emp._id.toString(),
                    name: `${emp.firstName} ${emp.lastName || ""}`.trim(),
                    firstName: emp.firstName,
                    department: emp.department,
                    position: emp.position,
                    score: compositeScore,
                    onTimeRate,
                    onTimeDays: empOnTime,
                    lateDays: empLate,
                    totalPunches: empPunches.length,
                    avgCheckInTime: formatAvgTime(empPunches),
                    deductions: deductionSum,
                    tier: getTier(compositeScore)
                };
            });

            // Overall Org Average Score
            const overallScore = employeePunctualityList.length > 0
                ? Number((employeePunctualityList.reduce((s, e) => s + e.score, 0) / employeePunctualityList.length).toFixed(1))
                : 95.0;

            const totalPunches = allMonthAttendance.length;
            const totalLatePunches = allMonthAttendance.filter(r => r.status === "LATE").length;

            return res.json({
                role: "ADMIN",
                totalEmployees: totalEmployeesCount,
                totalDepartments: DEPARTMENTS.length,
                todayAttendance: todayAttendanceCount,
                pendingLeaves: pendingLeavesCount,
                punctualityMeter: {
                    overallScore,
                    totalPunches,
                    totalLatePunches,
                    avgCheckInTime: formatAvgTime(allMonthAttendance),
                    tier: getTier(overallScore),
                    employees: employeePunctualityList
                }
            });
        } else {
            // EMPLOYEE DASHBOARD
            const employee = await Employee.findOne({ userId: session.userId }).lean();
            if (!employee) {
                return res.json({
                    role: "EMPLOYEE",
                    employee: { firstName: session.email?.split("@")[0] || "Employee" },
                    currentMonthAttendance: 0,
                    pendingLeaves: 0,
                    latestPayslip: null,
                    punctualityMeter: {
                        score: 95.0,
                        onTimeRate: 100,
                        onTimeDays: 0,
                        lateDays: 0,
                        totalPunches: 0,
                        avgCheckInTime: "09:15 AM",
                        kpaTatScore: 4.5,
                        deductionsApplied: 0,
                        tier: getTier(95.0)
                    }
                });
            }

            const [
                monthAttendance,
                pendingLeaves,
                latestPayslip,
                latestEvaluation,
                activeDeductions
            ] = await Promise.all([
                Attendance.find({
                    employeeId: employee._id,
                    date: { $gte: monthStart, $lte: monthEnd }
                }).lean(),
                LeaveApplication.countDocuments({
                    employeeId: employee._id,
                    status: "PENDING",
                }),
                Payslip.findOne({ employeeId: employee._id }).sort({ createdAt: -1 }).lean(),
                KpaEvaluation.findOne({ employeeId: employee._id }).sort({ createdAt: -1 }).lean(),
                AdminDeduction.find({ employeeId: employee._id, status: "ACTIVE" }).lean()
            ]);

            const totalPunches = monthAttendance.length;
            const onTimeDays = monthAttendance.filter(r => r.status === "PRESENT").length;
            const lateDays = monthAttendance.filter(r => r.status === "LATE").length;
            const halfDays = monthAttendance.filter(r => r.dayType === "Half Day" || r.dayType === "Short Day").length;

            const punchScore = totalPunches > 0
                ? Math.min(100, Math.max(0, ((onTimeDays * 1.0 + lateDays * 0.5 + halfDays * 0.5) / totalPunches) * 100))
                : 96;

            const onTimeRate = totalPunches > 0
                ? Number(((onTimeDays / totalPunches) * 100).toFixed(1))
                : 100;

            // KPA TAT rating
            let kpaTatScore = 4.5;
            if (latestEvaluation && Array.isArray(latestEvaluation.ratings) && latestEvaluation.ratings.length > 0) {
                const tatRating = latestEvaluation.ratings.find(r => 
                    r.metricId?.toLowerCase().includes("tat") || 
                    r.title?.toLowerCase().includes("tat") ||
                    r.title?.toLowerCase().includes("turnaround") ||
                    r.title?.toLowerCase().includes("speed")
                );
                if (tatRating) {
                    kpaTatScore = tatRating.score;
                } else if (latestEvaluation.rawWeightedScore) {
                    kpaTatScore = latestEvaluation.rawWeightedScore;
                }
            }

            const totalDeductions = activeDeductions.reduce((sum, d) => sum + (d.deductionScore || 0), 0);
            const netKpaScore = Math.max(0, kpaTatScore - totalDeductions);
            const kpaScorePct = Math.min(100, Math.max(0, (netKpaScore / 5.0) * 100));

            const finalPunctualityScore = Number((0.60 * punchScore + 0.40 * kpaScorePct).toFixed(1));

            return res.json({
                role: "EMPLOYEE",
                employee: { ...employee, id: employee._id.toString() },
                currentMonthAttendance: totalPunches,
                pendingLeaves,
                latestPayslip: latestPayslip ? { ...latestPayslip, id: latestPayslip._id.toString() } : null,
                punctualityMeter: {
                    score: finalPunctualityScore,
                    onTimeRate,
                    onTimeDays,
                    lateDays,
                    totalPunches,
                    avgCheckInTime: formatAvgTime(monthAttendance),
                    kpaTatScore,
                    deductionsApplied: totalDeductions,
                    tier: getTier(finalPunctualityScore)
                }
            });
        }
    } catch (error) {
        console.error("Dashboard error: ", error);
        return res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
};