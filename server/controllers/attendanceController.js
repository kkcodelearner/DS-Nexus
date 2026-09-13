import { inngest } from "../ingest/index.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

// Clock in/out for employee
// POST /api/attendance
export const clockInOut = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({ userId: session.userId });
        if (!employee) return res.status(404).json({ error: "Employee not found" });
        if (employee.isDeleted) return res.status(403).json({ error: "Your account is deactivated. You cannot clock in/out." });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await Attendance.findOne({ employeeId: employee._id, date: today });
        const now = new Date();
        if (!existing) {
            const isLate = now.getHours() >= 9 && now.getMinutes() > 0;
            const attendance = await Attendance.create({
                employeeId: employee._id,
                date: today,
                checkIn: now,
                status: isLate ? "LATE" : "PRESENT"
            })
            await inngest.send({
                name: "employee/check-out",
                data: {
                    employeeId: employee._id,
                    attendanceId: attendance._id,
                }
            })
            return res.json({ success: true, type: "CHECK_IN", data: attendance });
        } else if (!existing.checkOut) {
            const checkInTime = new Date(existing.checkIn).getTime();
            const diffMs = now.getTime() - checkInTime;
            const diffHours = diffMs / (1000 * 60 * 60)
            existing.checkOut = now;
            // Computer working hours and day type
            const workingHours = parseFloat(diffHours.toFixed(2));
            let dayType = "Half Day";
            if (workingHours >= 8) dayType = "Full Day";
            else if (workingHours >= 6) dayType = "Three Quarter Day";
            else if (workingHours >= 4) dayType = "Half Day";
            else dayType = "Short Day";
            existing.workingHours = workingHours;
            existing.dayType = dayType;
            await existing.save();
            return res.json({ success: true, type: "CHECK_OUT", data: existing });
        } else {
            return res.json({ success: true, type: "CHECK_OUT", data: existing });
        }
    } catch (error) {
        console.error("Attendance Error", error);
        return res.status(500).json({ error: "Operation failed" });
    }
}

// GET attendance for employee
// GET /api/attendance
export const getAttendance = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({ userId: session.userId });
        if (!employee) return res.status(404).json({ error: "Employee not found" });
        const limit = parseInt(req.query.limit || 30);
        const history = await Attendance.find({ employeeId: employee._id }).sort({ date: -1 }).limit(limit);
        return res.json({ data: history, employee: { isDeleted: employee.isDeleted } });
    } catch (error) {
        console.error("Get Attendance error: ", error);
        return res.status(500).json({ error: "Failed to fetch attendance history" });
    }
};

// GET monthly attendance
// GET /api/attendance/monthly
export const getMonthlyAttendance = async (req, res) => {
    try {
        const session = req.session;
        const now = new Date();
        const year = parseInt(req.query.year) || now.getFullYear();
        const month = parseInt(req.query.month) || (now.getMonth() + 1);

        const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        let targetEmployeeId = req.query.employeeId;

        if (session.role === "ADMIN") {
            if (!targetEmployeeId) {
                const firstEmp = await Employee.findOne({ isDeleted: { $ne: true } }).sort({ firstName: 1 });
                if (firstEmp) {
                    targetEmployeeId = firstEmp._id.toString();
                }
            }
        } else {
            const employee = await Employee.findOne({ userId: session.userId });
            if (!employee) return res.status(404).json({ error: "Employee not found" });
            targetEmployeeId = employee._id.toString();
        }

        if (!targetEmployeeId) {
            return res.json({ data: [], year, month, selectedEmployeeId: null });
        }

        const attendanceRecords = await Attendance.find({
            employeeId: targetEmployeeId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 }).lean();

        return res.json({
            data: attendanceRecords,
            year,
            month,
            selectedEmployeeId: targetEmployeeId
        });
    } catch (error) {
        console.error("Fetch Monthly Attendance error: ", error);
        return res.status(500).json({ error: "Failed to fetch monthly attendance" });
    }
};