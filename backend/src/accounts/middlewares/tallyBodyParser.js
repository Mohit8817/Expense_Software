import express from "express";

function tallyDocLabelFromPath(path = "") {
  if (path.includes("/debit-notes")) return "debit note";
  if (path.includes("/credit-notes")) return "credit note";
  if (path.includes("/sales")) return "sales invoice";
  if (path.includes("/purchases")) return "purchase";
  if (path.includes("/delivery-challans")) return "delivery challan";
  if (path.includes("/expenses")) return "expense";
  if (path.includes("/payments")) return "payment";
  if (path.includes("/companies")) return "company";
  return "record";
}

function exampleForPath(path = "") {
  if (path.includes("/debit-notes")) {
    return {
      data: [
        {
          company_id: "KLKURJA",
          DebitNoteNo: "Pur0991",
          DebitNoteDate: "02/Jul/2026",
          PurchaseNo: "PO908",
          VendorName: "XYZ Pvt Ltd",
          DebitNoteAmount: 120000,
          PurchaseItems: [{ itemname: "Item A", quantity: 1, rate: 100, amount: 100 }],
        },
      ],
    };
  }
  if (path.includes("/credit-notes")) {
    return {
      data: [
        {
          company_id: "KLKURJA",
          CreditNoteNo: "Inv0991",
          CreditNoteDate: "02/Jul/2026",
          InvoiceNo: "DL0991",
          CustomerName: "ABC Pvt Ltd",
          BillAmount: 120000,
          BillItems: [{ itemname: "Item A", quantity: 1, rate: 100, amount: 100 }],
        },
      ],
    };
  }
  if (path.includes("/sales")) {
    return {
      data: [
        {
          InvoiceNo: "Inv0991",
          InvoiceDate: "02/Jul/2026",
          CustomerName: "ABC Pvt Ltd",
          BillAmount: 120000,
          BillItems: [{ itemname: "Item A", quantity: 1, rate: 100, amount: 100 }],
        },
      ],
    };
  }
  if (path.includes("/payments") || path.includes("/expenses")) {
    return {
      data: [
        {
          company_id: "KLKURJA",
          VoucherNo: "0089",
          VoucherDate: "02/Jul/2026",
          Narration: "paid to XYZ and ABC",
          DebitLedgers: [{ LedgerName: "XYZ Imprest A/c", Amount: 13000 }],
          CreditLedgers: [{ LedgerName: "HDFC Bank", Amount: 13000 }],
        },
      ],
    };
  }
  if (path.includes("/companies")) {
    return {
      data: [
        {
          company_id: "KLKURJA",
          CompanyName: "ABC Company",
          LedgerName: "Customer 1",
          LedgerCode: "Cust 001",
          AddLine1: "wfdwqwd",
          LedgerPIN: "110001",
          LedState: "Delhi",
        },
      ],
    };
  }
  if (path.includes("/delivery-challans")) {
    return {
      data: [
        {
          company_id: "KLKURJA",
          Challanno: "DC0991",
          Challandate: "02/Jul/2026",
          CustomerName: "ABC Pvt Ltd",
          Challanamount: 120000,
          challanitems: [{ itemname: "Item A", quantity: 1, rate: 100, amount: 100 }],
        },
      ],
    };
  }
  return {
    data: [
      {
        PurchaseNo: "Pur0991",
        PurchaseDate: "02/Jul/2026",
        VendorName: "XYZ Pvt Ltd",
        PurchaseAmount: 120000,
        PurchaseItems: [{ itemname: "Item A", quantity: 1, rate: 100, amount: 100 }],
      },
    ],
  };
}

function describeJsonParseError(error, raw = "") {
  const message = error?.message || "Invalid JSON";

  if (/Bad control character|string literal/i.test(message)) {
    return 'JSON string is not closed. Example: "company_id": "KLKURJA", — every value needs opening and closing quotes.';
  }
  if (/Unexpected token|Expected/i.test(message)) {
    return "JSON syntax error — check commas, quotes, and brackets.";
  }
  if (!raw.trim()) {
    return "Request body is empty. Send JSON with Content-Type: application/json.";
  }
  return "Send valid JSON as application/json with { \"data\": [ {...} ] }.";
}

export function tallyJsonParseErrorResponse(req, parseError, raw = "") {
  const docLabel = tallyDocLabelFromPath(req.path);
  return {
    message: `Invalid JSON body. POST ${docLabel}s as application/json with { "data": [ {...} ] }.`,
    error: parseError?.message || "Invalid JSON",
    hint: describeJsonParseError(parseError, raw),
    example: exampleForPath(req.path),
  };
}

/**
 * Parse JSON body for Tally routes when the global parser skipped it
 * (missing/wrong Content-Type) or when the body is sent as raw text.
 */
export function parseTallyJsonBody(req, res, next) {
  if (req.body !== undefined && req.body !== null) {
    return next();
  }

  if (req.method === "GET" || req.method === "HEAD") {
    req.body = {};
    return next();
  }

  express.text({ type: "*/*", limit: "10mb" })(req, res, (err) => {
    if (err) return next(err);

    const raw = typeof req.body === "string" ? req.body.trim() : "";
    if (!raw) {
      req.body = {};
      return next();
    }

    try {
      req.body = JSON.parse(raw);
    } catch (parseError) {
      return res.status(400).json(tallyJsonParseErrorResponse(req, parseError, raw));
    }

    next();
  });
}
