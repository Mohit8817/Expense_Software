import React from "react";
import VoucherDocumentPage from "../VoucherDocumentPage";
import DeliveryChallanForm from "./DeliveryChallanForm";
import DeliveryChallanPreview from "./Deliverychallanpreview";
import { ATTACHMENT_DOCUMENT_TYPES } from "../documentAttachmentApi";
import {
  getAllDeliveryChallans,
  getDeliveryChallanById,
  deleteDeliveryChallan,
  approveDeliveryChallan,
  pushDeliveryChallanToTally,
  retryDeliveryChallanTallyPush,
  mapDeliveryChallanToList,
  mapDeliveryChallanToForm,
} from "../deliveryChallanApi";

const formatMoney = (n) =>
  `\u20b9${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const challanApi = {
  getAll: getAllDeliveryChallans,
  getById: getDeliveryChallanById,
  remove: deleteDeliveryChallan,
  approve: approveDeliveryChallan,
  pushToTally: pushDeliveryChallanToTally,
  retryTallyPush: retryDeliveryChallanTallyPush,
};

const DeliveryChallan = () => (
  <VoucherDocumentPage
    title="Delivery Challan"
    listTitle="Delivery Challan List"
    newButtonLabel="New Challan"
    exportFileName="Delivery_Challan_List"
    searchPlaceholder="Search challans..."
    searchKeys={[
      "Challanno",
      "CustomerName",
      "seller_name",
      "invoice_no",
      "customergstin",
      "status",
      "tallyLabel",
    ]}
    exportColumns={[
      { label: "Challan No", key: "Challanno" },
      { label: "Date", key: "Challandate" },
      { label: "Customer", key: "CustomerName" },
      { label: "Seller", key: "seller_name" },
      { label: "Invoice No", key: "invoice_no" },
      { label: "Items", key: "ItemCount" },
      { label: "Amount", key: "Challanamount" },
      { label: "Status", key: "status" },
      { label: "Tally", key: "tallyLabel" },
    ]}
    tableConfig={{
      docNoLabel: "Challan No",
      docNoKey: "Challanno",
      dateKey: "Challandate",
      partyLabel: "Customer",
      partyKey: "CustomerName",
      partyGstinKey: "customergstin",
      secondaryPartyKey: "seller_name",
      secondaryPartyLabel: "Seller",
      refKey: "invoice_no",
      refLabel: "Invoice No",
      amountKey: "Challanamount",
    }}
    viewConfig={{
      docNoKey: "ChallanNo",
      dateKey: "ChallanDate",
      approveLabel: "Approve Delivery Challan",
      getSummaryTiles: (data) => [
        { label: "Seller", value: data?.SellerName, sub: data?.SellerGstin ? `GSTIN: ${data.SellerGstin}` : "" },
        { label: "Buyer", value: data?.BuyerName, sub: data?.BuyerGstin ? `GSTIN: ${data.BuyerGstin}` : "" },
        {
          label: "Grand Total",
          value: formatMoney(data?.TotalAmount),
          sub: data?.InvoiceNo ? `Invoice: ${data.InvoiceNo}` : "",
        },
        { label: "Place of Supply", value: data?.PlaceOfSupply },
      ],
    }}
    FormComponent={DeliveryChallanForm}
    PreviewComponent={DeliveryChallanPreview}
    api={challanApi}
    mapToList={mapDeliveryChallanToList}
    mapToForm={mapDeliveryChallanToForm}
    attachmentDocumentType={ATTACHMENT_DOCUMENT_TYPES.DELIVERY_CHALLAN}
  />
);

export default DeliveryChallan;
