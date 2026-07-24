import fs from "fs";
import { extractDocumentFromFile } from "../utils/aiDocumentScan.js";

export const createDocumentScanHandler = (documentType, label = "Document") => {
  return async (req, res) => {
    let filePath = null;

    try {
      const company_id = req.user?.company_id;
      if (!company_id) return res.status(401).json({ message: "Unauthorized" });

      if (!req.file) {
        return res.status(400).json({ message: "File is required" });
      }

      filePath = req.file.path;
      const extracted = await extractDocumentFromFile(filePath, req.file.mimetype, documentType);

      return res.json({
        message: `${label} scanned successfully`,
        data: extracted,
      });
    } catch (error) {
      console.error(`scan ${documentType}:`, error);
      return res.status(error.message?.includes("not configured") ? 503 : 400).json({
        message: error.message || `Failed to scan ${label.toLowerCase()}`,
      });
    } finally {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  };
};

export const scanPurchaseBill = createDocumentScanHandler("purchase", "Bill");
export const scanSalesBill = createDocumentScanHandler("sales", "Sales invoice");
export const scanPaymentReceipt = createDocumentScanHandler("payment_receipt", "Payment receipt");
export const scanExpenseReceipt = createDocumentScanHandler("expense_receipt", "Expense receipt");
export const scanCompanyDocument = createDocumentScanHandler("company_party", "Company document");
