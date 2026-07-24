import React from "react";
import AiDocumentScanner from "../vouchers/shared/AiDocumentScanner";
import { scanPurchaseBill, mapScannedBillToPurchaseForm } from "../purchaseApi";

const PurchaseBillScanner = ({ companies, products, onApply, disabled = false }) => (
  <AiDocumentScanner
    title="AI Bill Scan"
    badge="Auto-fill from photo or PDF"
    description="Upload a purchase bill, take a photo, or scan — AI reads the bill and fills invoice fields, parties, items, and GST."
    scanFile={async (file) => {
      const extracted = await scanPurchaseBill(file);
      return mapScannedBillToPurchaseForm(extracted, companies, products);
    }}
    onApply={onApply}
    disabled={disabled}
    renderPreview={(preview) => (
      <>
        <div className="row g-2 small">
          <div className="col-md-3">
            <span className="text-muted">Invoice No</span>
            <div className="fw-medium">{preview.summary?.invoiceNo || "—"}</div>
          </div>
          <div className="col-md-3">
            <span className="text-muted">Vendor</span>
            <div className="fw-medium text-truncate">{preview.summary?.vendorName || "—"}</div>
          </div>
          <div className="col-md-3">
            <span className="text-muted">Buyer</span>
            <div className="fw-medium text-truncate">{preview.summary?.buyerName || "—"}</div>
          </div>
          <div className="col-md-3">
            <span className="text-muted">Line Items</span>
            <div className="fw-medium">{preview.summary?.itemCount || 0}</div>
          </div>
          <div className="col-md-3">
            <span className="text-muted">GST Rows</span>
            <div className="fw-medium">{preview.summary?.gstCount || 0}</div>
          </div>
          <div className="col-md-3">
            <span className="text-muted">Total</span>
            <div className="fw-medium">
              {preview.summary?.totalAmount != null
                ? `\u20b9${Number(preview.summary.totalAmount).toLocaleString("en-IN")}`
                : "—"}
            </div>
          </div>
        </div>
        <p className="small text-muted mt-2 mb-0">
          Review all sections after applying — dispatch, bank, signatory, and item details are filled when found on the bill.
        </p>
      </>
    )}
  />
);

export default PurchaseBillScanner;
