import React from "react";
import VoucherPreview from "../vouchers/shared/VoucherPreview";

const DebitNotePreview = (props) => (
  <VoucherPreview
    {...props}
    docNoLabel="Debit Note No"
    docNoKey="DebitNoteNo"
    dateKey="DebitNoteDate"
    partyLabel="Vendor"
    partyKey="SellerName"
    icon="fa-file-invoice"
    emptyMessage="Start filling the form — the debit note preview will appear here."
  />
);

export default DebitNotePreview;
