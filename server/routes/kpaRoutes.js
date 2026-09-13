import express from "express";
import { protect, protectAdmin } from "../middleware/auth.js";
import {
    getActiveAppraisalCycle,
    updateAppraisalCycle,
    getTemplates,
    createOrUpdateTemplate,
    createAdminDeduction,
    getEmployeeDeductions,
    reverseAdminDeduction,
    submitEvaluation,
    getAllEvaluations,
    getEmployeeEvaluation,
    getMyScorecard,
    approveAppraisal
} from "../controllers/kpaController.js";

const router = express.Router();

// Public/Employee & Manager authenticated routes
router.get("/cycle/active", protect, getActiveAppraisalCycle);
router.get("/templates", protect, getTemplates);
router.get("/my-scorecard", protect, getMyScorecard);
router.get("/deductions/:employeeId", protect, getEmployeeDeductions);
router.get("/evaluations/employee/:employeeId", protect, getEmployeeEvaluation);
router.post("/evaluations", protect, submitEvaluation);

// Admin-only management routes
router.put("/cycle/:id", protect, protectAdmin, updateAppraisalCycle);
router.post("/templates", protect, protectAdmin, createOrUpdateTemplate);
router.post("/deductions", protect, protectAdmin, createAdminDeduction);
router.put("/deductions/:id/reverse", protect, protectAdmin, reverseAdminDeduction);
router.get("/evaluations", protect, protectAdmin, getAllEvaluations);
router.post("/evaluations/:id/approve", protect, protectAdmin, approveAppraisal);

export default router;
