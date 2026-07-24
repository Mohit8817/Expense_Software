import React from "react";
import VoucherPreview from "../vouchers/shared/VoucherPreview";

const DeliveryChallanPreview = (props) => (
  <VoucherPreview
    {...props}
    docNoLabel="Challan No"
    docNoKey="ChallanNo"
    dateKey="ChallanDate"
    partyLabel="Buyer"
    partyKey="BuyerName"
    icon="fa-truck-fast"
    emptyMessage="Start filling the form — the delivery challan preview will appear here."
  />
);

export default DeliveryChallanPreview;
