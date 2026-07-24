import express from "express";
import {
  getCreditNotesForTally,
  getCreditNoteForTally,
  getDebitNotesForTally,
  getDebitNoteForTally,
  getDeliveryChallansForTally,
  getDeliveryChallanForTally,
  getExpensesForTally,
  getExpenseForTally,
  getPaymentsForTally,
  getPaymentForTally,
  getPurchasesForTally,
  getPurchaseForTally,
  getSalesForTally,
  getSalesForTallyById,
} from "../controllers/tally.controller.js";

const router = express.Router();

router.get("/credit-notes", getCreditNotesForTally);
router.get("/credit-notes/:id", getCreditNoteForTally);
router.get("/debit-notes", getDebitNotesForTally);
router.get("/debit-notes/:id", getDebitNoteForTally);
router.get("/delivery-challans", getDeliveryChallansForTally);
router.get("/delivery-challans/:id", getDeliveryChallanForTally);
router.get("/expenses", getExpensesForTally);
router.get("/expenses/:id", getExpenseForTally);
router.get("/payments", getPaymentsForTally);
router.get("/payments/:id", getPaymentForTally);
router.get("/purchases", getPurchasesForTally);
router.get("/purchases/:id", getPurchaseForTally);
router.get("/sales", getSalesForTally);
router.get("/sales/:id", getSalesForTallyById);

export default router;
