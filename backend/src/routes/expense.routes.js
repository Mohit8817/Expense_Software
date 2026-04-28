import { Router } from "express";
import upload from "../middlewares/uploads.js";
import { checkPermission } from "../middlewares/checkPermission.js";
import { createExpense, getExpenseFormData, getMyCreatedExpenses, getManagerExpenses, getReviewers, assignReviewer, getReviewerExpenses, reviewerApprove, managerApproveExpense, getAccountsExpenses , processPayment, getPaymentHistory, paymentReceipt,deleteExpense } from "../controllers/expense.controller.js";

const router = Router();

router.get("/add-expense",checkPermission("create_expense"), getExpenseFormData)
router.post("/create",checkPermission("create_expense"), upload.single("document"), createExpense);
router.get("/view-my-expense", checkPermission("view_expense"),  getMyCreatedExpenses);
router.get("/manager-expenses", checkPermission("manager_expense"), getManagerExpenses);
router.get("/reviewers", checkPermission("create_expense"), getReviewers);
router.patch("/assign-reviewer/:id", checkPermission("create_expense"), assignReviewer);
router.get("/review-expenses", checkPermission("reviewer_expense"), getReviewerExpenses);
router.patch("/reviewer-approval/:id", checkPermission("approve_expense_reviewer"), reviewerApprove);
router.patch("/manager-approve/:id", checkPermission("approve_expense_manager"), managerApproveExpense);
router.get("/accounts-expenses", checkPermission("account_expense"), getAccountsExpenses);
router.post("/process-payment/:id", checkPermission("account_expense"), processPayment);
router.get("/payment-history/:id", getPaymentHistory);
router.get("/payment-receipt/:id", checkPermission("account_expense"),  paymentReceipt);

router.delete("/delete-expense/:id", deleteExpense);
export default router;