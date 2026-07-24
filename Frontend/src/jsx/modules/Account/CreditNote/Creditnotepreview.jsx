import React from "react";
import VoucherPreview from "../vouchers/shared/VoucherPreview";

const CreditNotePreview = (props) => (
  <VoucherPreview
    {...props}
    docNoLabel="Credit Note No"
    docNoKey="CreditNoteNo"
    dateKey="CreditNoteDate"
    partyLabel="Buyer"
    partyKey="BuyerName"
    icon="fa-file-invoice"
    emptyMessage="Start filling the form — the credit note preview will appear here."
  />
);

export default CreditNotePreview;
