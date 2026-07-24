import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const salesInclude = { items: true };

const mapItem = (item, index) => ({
  sl_no: item.sl_no ?? index + 1,
  description: item.description,
  hsn_sac: item.hsn_sac,
  quantity: item.quantity,
  unit: item.unit,
  rate: item.rate,
  per: item.per,
  amount: item.amount,
});

const buildSalesData = (body) => {
  const {
    invoice_type,
    irn, ack_no, ack_date,
    invoice_no, invoice_date, eway_bill_no, delivery_note, mode_of_payment,
    reference_no, reference_date, buyers_order_no, other_references,
    dispatch_doc_no, delivery_note_date, dispatched_through, destination,
    bill_of_lading_no, motor_vehicle_no, terms_of_delivery,
    seller_company_id, consignee_company_id, buyer_company_id, seller_bank_account_id,
    seller_name, seller_address, seller_cin, seller_gstin, seller_state, seller_state_code, seller_email,
    consignee_name, consignee_address, consignee_gstin, consignee_state, consignee_state_code, consignee_email,
    buyer_name, buyer_address, buyer_gstin, buyer_state, buyer_state_code, buyer_pan, buyer_email,
    total_quantity, taxable_value,
    igst_rate, igst_amount, cgst_rate, cgst_amount, sgst_rate, sgst_amount,
    total_tax_amount, total_amount,
    amount_in_words, tax_amount_in_words,
    bank_name, bank_account_no, bank_ifsc_branch,
    declaration, authorised_signatory_name, authorised_signatory_designation,
    issuing_signatory_name, issuing_signatory_designation, jurisdiction,
  } = body;

  return {
    invoice_type: invoice_type || null,
    irn: irn || null,
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
    seller_bank_account_id: seller_bank_account_id ? Number(seller_bank_account_id) : null,
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
    igst_rate: igst_rate ?? 0,
    igst_amount: igst_amount ?? 0,
    cgst_rate: cgst_rate ?? 0,
    cgst_amount: cgst_amount ?? 0,
    sgst_rate: sgst_rate ?? 0,
    sgst_amount: sgst_amount ?? 0,
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

export const createSales = async (req, res) => {
  try {
    const { items, ...rest } = req.body;
    const company_id = req.user?.company_id;
    const user_id = req.user?.id;

    if (!company_id || !user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!rest.invoice_no) {
      return res.status(400).json({ message: "invoice_no is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }

    const existingInvoice = await prisma.sales.findUnique({
      where: { invoice_no: rest.invoice_no },
    });
    if (existingInvoice) {
      return res.status(409).json({ message: "A sales invoice with this number already exists" });
    }

    if (rest.irn) {
      const existingIrn = await prisma.sales.findUnique({ where: { irn: rest.irn } });
      if (existingIrn) {
        return res.status(409).json({ message: "A sales invoice with this IRN already exists" });
      }
    }

    const sales = await prisma.sales.create({
      data: {
        ...buildSalesData(rest),
        company_id,
        user_id,
        items: { create: items.map(mapItem) },
      },
      include: salesInclude,
    });

    return res.status(201).json({
      message: "Sales invoice created successfully",
      data: sales,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getAllSales = async (req, res) => {
  try {
    const company_id = req.user?.company_id;

    if (!company_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { approval_status, tally_push_status } = req.query;

    const salesList = await prisma.sales.findMany({
      where: {
        company_id,
        ...(approval_status && { approval_status }),
        ...(tally_push_status && { tally_push_status }),
      },
      include: salesInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.json(salesList);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getSalesById = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;

    const sales = await prisma.sales.findFirst({
      where: { id: Number(id), company_id },
      include: salesInclude,
    });

    if (!sales) {
      return res.status(404).json({ message: "Sales invoice not found" });
    }

    return res.json(sales);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateSales = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;
    const { items, ...rest } = req.body;

    const existing = await prisma.sales.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Sales invoice not found" });
    }

    if (existing.approval_status !== "PENDING") {
      return res.status(400).json({
        message: `Sales invoice cannot be updated once it is ${existing.approval_status}`,
      });
    }

    if (Array.isArray(items)) {
      await prisma.salesItem.deleteMany({ where: { sales_id: Number(id) } });
    }

    const updated = await prisma.sales.update({
      where: { id: Number(id) },
      data: {
        ...buildSalesData(rest),
        ...(Array.isArray(items) && {
          items: { create: items.map(mapItem) },
        }),
      },
      include: salesInclude,
    });

    return res.json({
      message: "Sales invoice updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const deleteSales = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;

    const existing = await prisma.sales.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Sales invoice not found" });
    }

    if (existing.approval_status !== "PENDING") {
      return res.status(400).json({
        message: `Cannot delete a sales invoice that has already been ${existing.approval_status}`,
      });
    }

    await prisma.sales.delete({ where: { id: Number(id) } });

    return res.json({ message: "Sales invoice deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const approveSales = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;
    const { remarks } = req.body;

    const existing = await prisma.sales.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Sales invoice not found" });
    }

    if (existing.approval_status !== "PENDING") {
      return res.status(400).json({ message: `Sales invoice is already ${existing.approval_status}` });
    }

    const approved = await prisma.sales.update({
      where: { id: Number(id) },
      data: {
        approval_status: "APPROVED",
        approval_date: new Date(),
        approval_remarks: remarks || null,
      },
      include: salesInclude,
    });

    return res.json({
      message: "Sales invoice approved successfully",
      data: approved,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const rejectSales = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;
    const { remarks } = req.body;

    if (!remarks) {
      return res.status(400).json({ message: "remarks are required when rejecting a sales invoice" });
    }

    const existing = await prisma.sales.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Sales invoice not found" });
    }

    if (existing.approval_status !== "PENDING") {
      return res.status(400).json({ message: `Sales invoice is already ${existing.approval_status}` });
    }

    const rejected = await prisma.sales.update({
      where: { id: Number(id) },
      data: {
        approval_status: "REJECTED",
        approval_date: new Date(),
        approval_remarks: remarks,
      },
      include: salesInclude,
    });

    return res.json({
      message: "Sales invoice rejected successfully",
      data: rejected,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const pushSalesToTally = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;

    const sales = await prisma.sales.findFirst({
      where: { id: Number(id), company_id },
      include: salesInclude,
    });

    if (!sales) {
      return res.status(404).json({ message: "Sales invoice not found" });
    }

    if (sales.approval_status !== "APPROVED") {
      return res.status(400).json({ message: "Only approved sales invoices can be pushed to Tally" });
    }

    if (sales.tally_push_status === "PUSHED") {
      return res.status(400).json({ message: "Sales invoice has already been pushed to Tally" });
    }

    try {
      await sendToTally(sales);

      const updated = await prisma.sales.update({
        where: { id: Number(id) },
        data: { tally_push_status: "PUSHED" },
        include: salesInclude,
      });

      return res.json({
        message: "Sales invoice pushed to Tally successfully",
        data: updated,
      });
    } catch (tallyError) {
      await prisma.sales.update({
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

export const retrySalesTallyPush = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;

    const sales = await prisma.sales.findFirst({
      where: { id: Number(id), company_id },
      include: salesInclude,
    });

    if (!sales) {
      return res.status(404).json({ message: "Sales invoice not found" });
    }

    if (sales.approval_status !== "APPROVED") {
      return res.status(400).json({ message: "Only approved sales invoices can be pushed to Tally" });
    }

    if (sales.tally_push_status !== "FAILED") {
      return res.status(400).json({
        message: `Retry is only allowed for FAILED pushes. Current status: ${sales.tally_push_status}`,
      });
    }

    try {
      await sendToTally(sales);

      const updated = await prisma.sales.update({
        where: { id: Number(id) },
        data: { tally_push_status: "PUSHED" },
        include: salesInclude,
      });

      return res.json({
        message: "Sales invoice pushed to Tally successfully",
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

async function sendToTally(sales) {
  return true;
}
