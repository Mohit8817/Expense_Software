import express from "express";
import { requireTallyCompanyId } from "../middlewares/tallyCompanyId.js";
import { parseTallyJsonBody } from "../middlewares/tallyBodyParser.js";
import { tallyContext } from "../middlewares/tallyContext.js";
import {
  getCreditNotesForTally,
  getCreditNoteForTally,
  markCreditNotePushed,
  getDebitNotesForTally,
  getDebitNoteForTally,
  markDebitNotePushed,
  getDeliveryChallansForTally,
  getDeliveryChallanForTally,
  markDeliveryChallanPushed,
  getExpensesForTally,
  getExpenseForTally,
  markExpensePushed,
  getPaymentsForTally,
  getPaymentForTally,
  markPaymentPushed,
  getPurchasesForTally,
  getPurchaseForTally,
  markPurchasePushed,
  getSalesForTally,
  getSalesForTallyById,
  markSalesPushed,
  getCompaniesForTally,
  getCompanyForTally,
  markCompanyPushed,
} from "../controllers/tally.controller.js";
import {
  createCompany,
  updateCompany,
  deleteCompany,
} from "../controllers/companydetail.controller.js";
import {
  createCreditNote,
  updateCreditNote,
  deleteCreditNote,
} from "../controllers/creditnote.controller.js";
import {
  createDebitNote,
  updateDebitNote,
  deleteDebitNote,
} from "../controllers/debitnote.controller.js";
import {
  createDeliveryChallan,
  updateDeliveryChallan,
  deleteDeliveryChallan,
} from "../controllers/deliverychallan.controller.js";
import {
  createJournalVoucher,
  updateJournalVoucher,
  deleteJournalVoucher,
} from "../controllers/journalvoucher.controller.js";
import {
  createPaymentVoucher,
  updatePaymentVoucher,
  deletePaymentVoucher,
} from "../controllers/paymentvoucher.controller.js";
import {
  createPurchase,
  updatePurchase,
  deletePurchase,
} from "../controllers/purchase.controller.js";
import {
  createSales,
  updateSales,
  deleteSales,
} from "../controllers/sales.controller.js";

const router = express.Router();

router.use(parseTallyJsonBody);
router.use(requireTallyCompanyId);

// Credit Note — GET (Tally export) + CRUD
router.get("/credit-notes", getCreditNotesForTally);
router.get("/credit-notes/:id", getCreditNoteForTally);
router.post("/credit-notes", tallyContext, createCreditNote);
router.put("/credit-notes/:id", tallyContext, updateCreditNote);
router.delete("/credit-notes/:id", tallyContext, deleteCreditNote);
router.patch("/credit-notes/:id/pushed", markCreditNotePushed);

// Debit Note
router.get("/debit-notes", getDebitNotesForTally);
router.get("/debit-notes/:id", getDebitNoteForTally);
router.post("/debit-notes", tallyContext, createDebitNote);
router.put("/debit-notes/:id", tallyContext, updateDebitNote);
router.delete("/debit-notes/:id", tallyContext, deleteDebitNote);
router.patch("/debit-notes/:id/pushed", markDebitNotePushed);

// Delivery Challan
router.get("/delivery-challans", getDeliveryChallansForTally);
router.get("/delivery-challans/:id", getDeliveryChallanForTally);
router.post("/delivery-challans", tallyContext, createDeliveryChallan);
router.put("/delivery-challans/:id", tallyContext, updateDeliveryChallan);
router.delete("/delivery-challans/:id", tallyContext, deleteDeliveryChallan);
router.patch("/delivery-challans/:id/pushed", markDeliveryChallanPushed);

// Expense (Journal Voucher)
router.get("/expenses", getExpensesForTally);
router.get("/expenses/:id", getExpenseForTally);
router.post("/expenses", tallyContext, createJournalVoucher);
router.put("/expenses/:id", tallyContext, updateJournalVoucher);
router.delete("/expenses/:id", tallyContext, deleteJournalVoucher);
router.patch("/expenses/:id/pushed", markExpensePushed);

// Payment
router.get("/payments", getPaymentsForTally);
router.get("/payments/:id", getPaymentForTally);
router.post("/payments", tallyContext, createPaymentVoucher);
router.put("/payments/:id", tallyContext, updatePaymentVoucher);
router.delete("/payments/:id", tallyContext, deletePaymentVoucher);
router.patch("/payments/:id/pushed", markPaymentPushed);

// Purchase
router.get("/purchases", getPurchasesForTally);
router.get("/purchases/:id", getPurchaseForTally);
router.post("/purchases", tallyContext, createPurchase);
router.put("/purchases/:id", tallyContext, updatePurchase);
router.delete("/purchases/:id", tallyContext, deletePurchase);
router.patch("/purchases/:id/pushed", markPurchasePushed);

// Sales
router.get("/sales", getSalesForTally);
router.get("/sales/:id", getSalesForTallyById);
router.post("/sales", tallyContext, createSales);
router.put("/sales/:id", tallyContext, updateSales);
router.delete("/sales/:id", tallyContext, deleteSales);
router.patch("/sales/:id/pushed", markSalesPushed);

// Company Master
router.get("/companies", getCompaniesForTally);
router.get("/companies/:id", getCompanyForTally);
router.post("/companies", tallyContext, createCompany);
router.put("/companies/:id", tallyContext, updateCompany);
router.delete("/companies/:id", tallyContext, deleteCompany);
router.patch("/companies/:id/pushed", markCompanyPushed);

export default router;
