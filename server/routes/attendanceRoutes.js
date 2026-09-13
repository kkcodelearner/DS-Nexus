import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { clockInOut, getAttendance, getMonthlyAttendance } from "../controllers/attendanceController.js";

const attendanceRouter = Router();

attendanceRouter.post("/", protect, clockInOut);
attendanceRouter.get("/", protect, getAttendance);
attendanceRouter.get("/monthly", protect, getMonthlyAttendance);

export default attendanceRouter;