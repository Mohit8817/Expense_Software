import { PrismaClient } from "@prisma/client";
import { createVoucherHandlers, mapVoucherItem } from "../utils/voucherBase.js";
import { DATA_STATUS_TALLY, resolveDataStatus } from "../constants/dataStatus.js";
import {
  normalizeDeliveryChallanPayload,
  extractTallyDeliveryChallanRecords,
  isTallyDeliveryChallanBatchRequest,
  describeTallyDeliveryChallanBodyIssue,
} from "../utils/tallyPayloadUtils.js";

const prisma = new PrismaClient();

const include = { items: true };

const buildDeliveryChallanData = (body) => ({
  challan_no: body.challan_no,
  challan_date: body.challan_date,
  reference_no: body.reference_no || null,
  reference_date: body.reference_date || null,
  invoice_no: body.invoice_no || null,
  invoice_date: body.invoice_date || null,
  buyers_order_no: body.buyers_order_no || null,
  buyers_order_date: body.buyers_order_date || null,
  dispatch_doc_no: body.dispatch_doc_no || null,
  dispatched_through: body.dispatched_through || null,
  destination: body.destination || null,
  motor_vehicle_no: body.motor_vehicle_no || null,
  bill_of_lading_no: body.bill_of_lading_no || null,
  terms_of_delivery: body.terms_of_delivery || null,
  policy_no: body.policy_no || null,
  place_of_supply: body.place_of_supply || null,
  seller_company_id: body.seller_company_id ? Number(body.seller_company_id) : null,
  buyer_company_id: body.buyer_company_id ? Number(body.buyer_company_id) : null,
  seller_name: body.seller_name,
  seller_address: body.seller_address,
  seller_gstin: body.seller_gstin,
  seller_state: body.seller_state,
  seller_state_code: body.seller_state_code,
  seller_cin: body.seller_cin || null,
  seller_email: body.seller_email || null,
  seller_pan: body.seller_pan || null,
  buyer_name: body.buyer_name,
  buyer_address: body.buyer_address,
  buyer_gstin: body.buyer_gstin,
  buyer_state: body.buyer_state || null,
  buyer_state_code: body.buyer_state_code || null,
  buyer_email: body.buyer_email || null,
  total_quantity: body.total_quantity,
  taxable_value: body.taxable_value,
  igst_rate: body.igst_rate ?? 0,
  igst_amount: body.igst_amount ?? 0,
  cgst_rate: body.cgst_rate ?? 0,
  cgst_amount: body.cgst_amount ?? 0,
  sgst_rate: body.sgst_rate ?? 0,
  sgst_amount: body.sgst_amount ?? 0,
  total_tax_amount: body.total_tax_amount,
  total_amount: body.total_amount,
  amount_in_words: body.amount_in_words || null,
  authorised_signatory_name: body.authorised_signatory_name || null,
  authorised_signatory_designation: body.authorised_signatory_designation || null,
});

async function createDeliveryChallanRecord(req, rawRecord) {
  const company_id = req.user?.company_id;
  const user_id = req.user?.id;
  const fromTally = resolveDataStatus(req) === DATA_STATUS_TALLY;

  const { items, challanitems, Challanitems, GstDetails, gst_details, ...rest } = rawRecord || {};

  const normalized = normalizeDeliveryChallanPayload(
    rest,
    items ?? challanitems ?? Challanitems ?? [],
    gst_details ?? GstDetails ?? [],
    company_id
  );
  const payload = normalized.body;

  if (!payload.challan_no) {
    throw new Error("challan_no / Challanno is required");
  }

  if (!normalized.items.length) {
    throw new Error("At least one item is required in items / challanitems");
  }

  const existing = await prisma.deliveryChallan.findUnique({
    where: { challan_no: payload.challan_no },
  });
  if (existing) {
    const err = new Error("A delivery challan with this number already exists");
    err.status = 409;
    throw err;
  }

  return prisma.deliveryChallan.create({
    data: {
      ...buildDeliveryChallanData(payload),
      company_id,
      user_id,
      data_status: resolveDataStatus(req),
      ...(fromTally && {
        approval_status: "APPROVED",
        approval_date: new Date(),
        tally_push_status: "PUSHED",
      }),
      items: { create: normalized.items.map(mapVoucherItem) },
    },
    include,
  });
}

export const createDeliveryChallan = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const user_id = req.user?.id;

    if (!company_id || !user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const records = extractTallyDeliveryChallanRecords(req.body);
    const isBatch = isTallyDeliveryChallanBatchRequest(req.body);

    if (!records.length) {
      return res.status(400).json({
        message: "No delivery challan records found in request body",
        hint: describeTallyDeliveryChallanBodyIssue(req.body),
        example: {
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
        },
      });
    }

    if (isBatch || records.length > 1) {
      const created = [];
      const errors = [];

      for (const record of records) {
        const challanRef = record.Challanno || record.challan_no || "unknown";
        try {
          const challan = await createDeliveryChallanRecord(req, record);
          created.push(challan);
        } catch (error) {
          errors.push({
            Challanno: challanRef,
            message: error.message,
          });
        }
      }

      if (!created.length) {
        return res.status(400).json({
          message: "No delivery challans were created",
          data: [],
          errors,
        });
      }

      return res.status(201).json({
        message: `${created.length} delivery challan(s) created successfully`,
        data: created,
        ...(errors.length > 0 && { errors }),
      });
    }

    const challan = await createDeliveryChallanRecord(req, records[0]);

    return res.status(201).json({
      message: "Delivery challan created successfully",
      data: challan,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

const handlers = createVoucherHandlers({
  modelName: "deliveryChallan",
  docNoField: "challan_no",
  docLabel: "Delivery challan",
  include,
  buildData: buildDeliveryChallanData,
});

export const {
  getAll: getAllDeliveryChallans,
  getById: getDeliveryChallanById,
  update: updateDeliveryChallan,
  remove: deleteDeliveryChallan,
  approve: approveDeliveryChallan,
  reject: rejectDeliveryChallan,
  pushToTally: pushDeliveryChallanToTally,
  retryTallyPush: retryDeliveryChallanTallyPush,
} = handlers;
