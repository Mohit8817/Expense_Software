import { PrismaClient } from "@prisma/client";
import { DATA_STATUS_TALLY, resolveDataStatus } from "../constants/dataStatus.js";
import {
  normalizePurchasePayload,
  extractTallyPurchaseRecords,
  isTallyPurchaseBatchRequest,
  describeTallyBodyIssue,
} from "../utils/tallyPayloadUtils.js";

const prisma = new PrismaClient();

const purchaseInclude = { items: true, gst_details: true };

const mapItem = (item) => ({
  description: item.description,
  hsn_sac: item.hsn_sac,
  quantity: item.quantity,
  unit: item.unit,
  rate: item.rate,
  per: item.per,
  amount: item.amount,
});

const mapGstDetail = (gst) => ({
  ledger_name: gst.ledger_name,
  rate: gst.rate,
  amount: gst.amount,
});

const buildPurchaseData = (body) => {
  const {
    invoice_type,
    irn,
    ack_no,
    ack_date,
    invoice_no,
    invoice_date,
    eway_bill_no,
    delivery_note,
    mode_of_payment,
    reference_no,
    reference_date,
    buyers_order_no,
    other_references,
    dispatch_doc_no,
    delivery_note_date,
    dispatched_through,
    destination,
    bill_of_lading_no,
    motor_vehicle_no,
    terms_of_delivery,
    seller_company_id,
    consignee_company_id,
    buyer_company_id,
    vendor_bank_account_id,
    seller_name,
    seller_address,
    seller_cin,
    seller_gstin,
    seller_state,
    seller_state_code,
    seller_email,
    consignee_name,
    consignee_address,
    consignee_gstin,
    consignee_state,
    consignee_state_code,
    consignee_email,
    buyer_name,
    buyer_address,
    buyer_gstin,
    buyer_state,
    buyer_state_code,
    buyer_pan,
    buyer_email,
    total_quantity,
    taxable_value,
    igst_rate,
    igst_amount,
    total_tax_amount,
    total_amount,
    amount_in_words,
    tax_amount_in_words,
    bank_name,
    bank_account_no,
    bank_ifsc_branch,
    declaration,
    authorised_signatory_name,
    authorised_signatory_designation,
    issuing_signatory_name,
    issuing_signatory_designation,
    jurisdiction,
  } = body;

  return {
    invoice_type: invoice_type || null,
    irn,
    ack_no: ack_no || null,
    ack_date: ack_date || null,
    invoice_no,
    invoice_date,
    eway_bill_no: eway_bill_no || null,
    delivery_note: delivery_note || null,
    mode_of_payment: mode_of_payment || null,
    reference_no: reference_no || null,
    reference_date: reference_date || null,
    buyers_order_no: buyers_order_no || null,
    other_references: other_references || null,
    dispatch_doc_no: dispatch_doc_no || null,
    delivery_note_date: delivery_note_date || null,
    dispatched_through: dispatched_through || null,
    destination: destination || null,
    bill_of_lading_no: bill_of_lading_no || null,
    motor_vehicle_no: motor_vehicle_no || null,
    terms_of_delivery: terms_of_delivery || null,
    seller_company_id: seller_company_id ? Number(seller_company_id) : null,
    consignee_company_id: consignee_company_id ? Number(consignee_company_id) : null,
    buyer_company_id: buyer_company_id ? Number(buyer_company_id) : null,
    vendor_bank_account_id: vendor_bank_account_id ? Number(vendor_bank_account_id) : null,
    seller_name,
    seller_address,
    seller_cin: seller_cin || null,
    seller_gstin,
    seller_state,
    seller_state_code,
    seller_email: seller_email || null,
    consignee_name: consignee_name || null,
    consignee_address: consignee_address || null,
    consignee_gstin: consignee_gstin || null,
    consignee_state: consignee_state || null,
    consignee_state_code: consignee_state_code || null,
    consignee_email: consignee_email || null,
    buyer_name,
    buyer_address,
    buyer_gstin,
    buyer_state,
    buyer_state_code,
    buyer_pan: buyer_pan || null,
    buyer_email: buyer_email || null,
    total_quantity,
    taxable_value,
    igst_rate,
    igst_amount,
    total_tax_amount,
    total_amount,
    amount_in_words: amount_in_words || null,
    tax_amount_in_words: tax_amount_in_words || null,
    bank_name: bank_name || null,
    bank_account_no: bank_account_no || null,
    bank_ifsc_branch: bank_ifsc_branch || null,
    declaration: declaration || null,
    authorised_signatory_name: authorised_signatory_name || null,
    authorised_signatory_designation: authorised_signatory_designation || null,
    issuing_signatory_name: issuing_signatory_name || null,
    issuing_signatory_designation: issuing_signatory_designation || null,
    jurisdiction: jurisdiction || null,
  };
};

async function createPurchaseRecord(req, rawRecord) {
  const company_id = req.user?.company_id;
  const user_id = req.user?.id;
  const fromTally = resolveDataStatus(req) === DATA_STATUS_TALLY;

  const { items, gst_details, PurchaseItems, GstDetails, ...rest } = rawRecord || {};

  const normalized = normalizePurchasePayload(
    rest,
    items ?? PurchaseItems ?? [],
    gst_details ?? GstDetails ?? [],
    company_id
  );
  const payload = normalized.body;

  if (!payload.irn) {
    throw new Error("irn is required (or send PurchaseNo for auto-generation)");
  }

  if (!payload.invoice_no) {
    throw new Error("invoice_no / PurchaseNo is required");
  }

  if (!normalized.items.length) {
    throw new Error("At least one item is required in items / PurchaseItems");
  }

  const existing = await prisma.purchase.findUnique({ where: { irn: payload.irn } });
  if (existing) {
    const err = new Error("A purchase with this IRN already exists");
    err.status = 409;
    throw err;
  }

  return prisma.purchase.create({
    data: {
      ...buildPurchaseData(payload),
      company_id,
      user_id,
      data_status: resolveDataStatus(req),
      ...(fromTally && {
        approval_status: "APPROVED",
        approval_date: new Date(),
        tally_push_status: "PUSHED",
      }),
      items: { create: normalized.items.map(mapItem) },
      ...(normalized.gst_details.length > 0 && {
        gst_details: { create: normalized.gst_details.map(mapGstDetail) },
      }),
    },
    include: purchaseInclude,
  });
}

export const createPurchase = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const user_id = req.user?.id;

    if (!company_id || !user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const records = extractTallyPurchaseRecords(req.body);
    const isBatch = isTallyPurchaseBatchRequest(req.body);

    if (!records.length) {
      return res.status(400).json({
        message: "No purchase records found in request body",
        hint: describeTallyBodyIssue(req.body),
        example: {
          data: [
            {
              PurchaseNo: "Pur0991",
              PurchaseDate: "02/Jul/2026",
              VendorName: "XYZ Pvt Ltd",
              PurchaseAmount: 120000,
              PurchaseItems: [{ itemname: "Item A", quantity: 1, rate: 100, amount: 100 }],
            },
          ],
        },
      });
    }

    if (isBatch || records.length > 1) {
      const created = [];
      const errors = [];

      for (const record of records) {
        const invoiceRef = record.PurchaseNo || record.invoice_no || "unknown";
        try {
          const purchase = await createPurchaseRecord(req, record);
          created.push(purchase);
        } catch (error) {
          errors.push({
            PurchaseNo: invoiceRef,
            message: error.message,
          });
        }
      }

      if (!created.length) {
        return res.status(400).json({
          message: "No purchases were created",
          data: [],
          errors,
        });
      }

      return res.status(201).json({
        message: `${created.length} purchase(s) created successfully`,
        data: created,
        ...(errors.length > 0 && { errors }),
      });
    }

    const purchase = await createPurchaseRecord(req, records[0]);

    return res.status(201).json({
      message: "Purchase created successfully",
      data: purchase,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

export const getAllPurchases = async (req, res) => {
  try {
    const company_id = req.user?.company_id;

    if (!company_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { approval_status, tally_push_status } = req.query;

    const purchases = await prisma.purchase.findMany({
      where: {
        company_id,
        ...(approval_status && { approval_status }),
        ...(tally_push_status && { tally_push_status }),
      },
      include: purchaseInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.json(purchases);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;

    const purchase = await prisma.purchase.findFirst({
      where: { id: Number(id), company_id },
      include: purchaseInclude,
    });

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    return res.json(purchase);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;
    const { items, gst_details, ...rest } = req.body;

    const existing = await prisma.purchase.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    if (existing.approval_status !== "PENDING" && resolveDataStatus(req) !== DATA_STATUS_TALLY) {
      return res.status(400).json({
        message: `Purchase cannot be updated once it is ${existing.approval_status}`,
      });
    }

    const normalized = normalizePurchasePayload(
      rest,
      items,
      gst_details,
      company_id
    );
    const purchaseData = buildPurchaseData(normalized.body);

    if (Array.isArray(items) || Array.isArray(rest.items) || Array.isArray(rest.PurchaseItems)) {
      await prisma.purchaseItem.deleteMany({ where: { purchase_id: Number(id) } });
    }

    if (
      Array.isArray(gst_details) ||
      Array.isArray(rest.gst_details) ||
      Array.isArray(rest.GstDetails)
    ) {
      await prisma.purchaseGstDetail.deleteMany({ where: { purchase_id: Number(id) } });
    }

    const updated = await prisma.purchase.update({
      where: { id: Number(id) },
      data: {
        ...purchaseData,
        ...(normalized.items.length > 0 && {
          items: { create: normalized.items.map(mapItem) },
        }),
        ...(normalized.gst_details.length > 0 && {
          gst_details: { create: normalized.gst_details.map(mapGstDetail) },
        }),
      },
      include: purchaseInclude,
    });

    return res.json({
      message: "Purchase updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;

    const existing = await prisma.purchase.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    if (existing.approval_status !== "PENDING" && resolveDataStatus(req) !== DATA_STATUS_TALLY) {
      return res.status(400).json({
        message: `Cannot delete a purchase that has already been ${existing.approval_status}`,
      });
    }

    await prisma.purchase.delete({ where: { id: Number(id) } });

    return res.json({ message: "Purchase deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const approvePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;
    const { remarks } = req.body;

    const existing = await prisma.purchase.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    if (existing.approval_status !== "PENDING") {
      return res.status(400).json({ message: `Purchase is already ${existing.approval_status}` });
    }

    const approved = await prisma.purchase.update({
      where: { id: Number(id) },
      data: {
        approval_status: "APPROVED",
        approval_date: new Date(),
        approval_remarks: remarks || null,
      },
      include: purchaseInclude,
    });

    return res.json({
      message: "Purchase approved successfully",
      data: approved,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const rejectPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;
    const { remarks } = req.body;

    if (!remarks) {
      return res.status(400).json({ message: "remarks are required when rejecting a purchase" });
    }

    const existing = await prisma.purchase.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    if (existing.approval_status !== "PENDING") {
      return res.status(400).json({ message: `Purchase is already ${existing.approval_status}` });
    }

    const rejected = await prisma.purchase.update({
      where: { id: Number(id) },
      data: {
        approval_status: "REJECTED",
        approval_date: new Date(),
        approval_remarks: remarks,
      },
      include: purchaseInclude,
    });

    return res.json({
      message: "Purchase rejected successfully",
      data: rejected,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const pushPurchaseToTally = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;

    const purchase = await prisma.purchase.findFirst({
      where: { id: Number(id), company_id },
      include: purchaseInclude,
    });

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    if (purchase.approval_status !== "APPROVED") {
      return res.status(400).json({ message: "Only approved purchases can be pushed to Tally" });
    }

    if (purchase.tally_push_status === "PUSHED") {
      return res.status(400).json({ message: "Purchase has already been pushed to Tally" });
    }

    try {
      await sendToTally(purchase);

      const updated = await prisma.purchase.update({
        where: { id: Number(id) },
        data: { tally_push_status: "PUSHED" },
        include: purchaseInclude,
      });

      return res.json({
        message: "Purchase pushed to Tally successfully",
        data: updated,
      });
    } catch (tallyError) {
      await prisma.purchase.update({
        where: { id: Number(id) },
        data: { tally_push_status: "FAILED" },
      });

      return res.status(502).json({ message: "Tally push failed", error: tallyError.message });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const retryTallyPush = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;

    const purchase = await prisma.purchase.findFirst({
      where: { id: Number(id), company_id },
      include: purchaseInclude,
    });

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    if (purchase.approval_status !== "APPROVED") {
      return res.status(400).json({ message: "Only approved purchases can be pushed to Tally" });
    }

    if (purchase.tally_push_status !== "FAILED") {
      return res.status(400).json({
        message: `Retry is only allowed for FAILED pushes. Current status: ${purchase.tally_push_status}`,
      });
    }

    try {
      await sendToTally(purchase);

      const updated = await prisma.purchase.update({
        where: { id: Number(id) },
        data: { tally_push_status: "PUSHED" },
        include: purchaseInclude,
      });

      return res.json({
        message: "Purchase pushed to Tally successfully",
        data: updated,
      });
    } catch (tallyError) {
      return res.status(502).json({ message: "Tally retry push failed", error: tallyError.message });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

async function sendToTally(purchase) {
  return true;
}
