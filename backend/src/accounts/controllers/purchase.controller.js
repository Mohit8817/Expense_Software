import { PrismaClient } from "@prisma/client";

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
    irn, ack_no, ack_date,
    invoice_no, invoice_date, eway_bill_no, delivery_note, mode_of_payment,
    reference_no, reference_date, buyers_order_no, other_references,
    dispatch_doc_no, delivery_note_date, dispatched_through, destination,
    bill_of_lading_no, motor_vehicle_no, terms_of_delivery,
    seller_company_id, consignee_company_id, buyer_company_id, vendor_bank_account_id,
    seller_name, seller_address, seller_cin, seller_gstin, seller_state, seller_state_code, seller_email,
    consignee_name, consignee_address, consignee_gstin, consignee_state, consignee_state_code, consignee_email,
    buyer_name, buyer_address, buyer_gstin, buyer_state, buyer_state_code, buyer_pan, buyer_email,
    total_quantity, taxable_value, igst_rate, igst_amount, total_tax_amount, total_amount,
    amount_in_words, tax_amount_in_words,
    bank_name, bank_account_no, bank_ifsc_branch,
    declaration, authorised_signatory_name, authorised_signatory_designation,
    issuing_signatory_name, issuing_signatory_designation, jurisdiction,
  } = body;

  return {
    invoice_type: invoice_type || null,
    irn, ack_no, ack_date,
    invoice_no, invoice_date, eway_bill_no, delivery_note, mode_of_payment,
    reference_no, reference_date, buyers_order_no, other_references,
    dispatch_doc_no, delivery_note_date, dispatched_through, destination,
    bill_of_lading_no, motor_vehicle_no, terms_of_delivery,
    seller_company_id: seller_company_id ? Number(seller_company_id) : null,
    consignee_company_id: consignee_company_id ? Number(consignee_company_id) : null,
    buyer_company_id: buyer_company_id ? Number(buyer_company_id) : null,
    vendor_bank_account_id: vendor_bank_account_id ? Number(vendor_bank_account_id) : null,
    seller_name, seller_address, seller_cin: seller_cin || null, seller_gstin, seller_state, seller_state_code, seller_email,
    consignee_name, consignee_address, consignee_gstin, consignee_state, consignee_state_code, consignee_email,
    buyer_name, buyer_address, buyer_gstin, buyer_state, buyer_state_code, buyer_pan, buyer_email,
    total_quantity, taxable_value, igst_rate, igst_amount, total_tax_amount, total_amount,
    amount_in_words, tax_amount_in_words,
    bank_name, bank_account_no, bank_ifsc_branch,
    declaration, authorised_signatory_name, authorised_signatory_designation,
    issuing_signatory_name, issuing_signatory_designation, jurisdiction,
  };
};

export const createPurchase = async (req, res) => {
  try {
    const { items, gst_details, ...rest } = req.body;
    const company_id = req.user?.company_id;
    const user_id = req.user?.id;

    if (!company_id || !user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!rest.irn) {
      return res.status(400).json({ message: "irn is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }

    const existing = await prisma.purchase.findUnique({ where: { irn: rest.irn } });
    if (existing) {
      return res.status(409).json({ message: "A purchase with this IRN already exists" });
    }

    const purchase = await prisma.purchase.create({
      data: {
        ...buildPurchaseData(rest),
        company_id,
        user_id,
        items: { create: items.map(mapItem) },
        ...(Array.isArray(gst_details) && gst_details.length > 0 && {
          gst_details: { create: gst_details.map(mapGstDetail) },
        }),
      },
      include: purchaseInclude,
    });

    return res.status(201).json({
      message: "Purchase created successfully",
      data: purchase,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
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

    if (existing.approval_status !== "PENDING") {
      return res.status(400).json({
        message: `Purchase cannot be updated once it is ${existing.approval_status}`,
      });
    }

    const purchaseData = buildPurchaseData(rest);

    if (Array.isArray(items)) {
      await prisma.purchaseItem.deleteMany({ where: { purchase_id: Number(id) } });
    }

    if (Array.isArray(gst_details)) {
      await prisma.purchaseGstDetail.deleteMany({ where: { purchase_id: Number(id) } });
    }

    const updated = await prisma.purchase.update({
      where: { id: Number(id) },
      data: {
        ...purchaseData,
        ...(Array.isArray(items) && {
          items: { create: items.map(mapItem) },
        }),
        ...(Array.isArray(gst_details) && gst_details.length > 0 && {
          gst_details: { create: gst_details.map(mapGstDetail) },
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

    if (existing.approval_status !== "PENDING") {
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
