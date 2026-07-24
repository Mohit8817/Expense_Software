import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  createDebitNote,
  updateDebitNote,
  mapFormToPayload,
} from "../debitNoteApi";
import { calcItemAmount } from "../vouchers/shared/numberInputUtils";
import { useVoucherForm } from "../vouchers/shared/useVoucherForm";
import {
  FormSection,
  PartySection,
  LineItemsTable,
  GstDetailsTable,
  DeclarationSection,
  TotalsBar,
  FormActions,
  TextField,
} from "../vouchers/shared/voucherFormUi";
import {
  SELLER_FIELD_CONFIG,
  CONSIGNEE_FIELD_CONFIG,
  BUYER_FIELD_CONFIG,
  emptyItem,
} from "../vouchers/shared/voucherMapperUtils";
import InvoiceReferencePicker from "../vouchers/shared/InvoiceReferencePicker";
import { mapPurchaseToDebitNoteLink } from "../accountDocumentLinks";

const DebitNoteForm = ({ documentId, initialData, onDataChange, onClose, onSaved }) => {
  const editId = documentId;
  const [submitting, setSubmitting] = useState(false);

  const vm = useVoucherForm({ initialData, onDataChange, itemsKey: "Items" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vm.formData.DebitNoteNo) {
      toast.error("Debit Note No is required");
      return;
    }
    if (!vm.formData.SellerCompanyId || !vm.formData.BuyerCompanyId) {
      toast.error("Select vendor (seller) and buyer companies");
      return;
    }
    if (!vm.items.some((item) => item.itemname && calcItemAmount(item.quantity, item.rate) > 0)) {
      toast.error("Add at least one item with quantity and rate greater than 0");
      return;
    }

    try {
      setSubmitting(true);
      const payload = mapFormToPayload(vm.formData, vm.items, vm.gstDetails);
      const result = editId
        ? await updateDebitNote(editId, payload)
        : await createDebitNote(payload);
      toast.success(editId ? "Debit note updated successfully" : "Debit note created successfully");
      if (onSaved) onSaved(editId || result?.data?.id);
    } catch (error) {
      toast.error(error.message || "Failed to save debit note");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InvoiceReferencePicker
        type="purchase"
        label="Link from Purchase Invoice"
        onApply={(purchase) => {
          const linked = mapPurchaseToDebitNoteLink(purchase);
          vm.setFormData((prev) => ({ ...prev, ...linked.formPatch }));
          vm.setItems(linked.items?.length ? linked.items : [emptyItem()]);
          vm.setGstDetails(linked.gstDetails);
        }}
      />
      <FormSection title="Debit Note Details" icon="fa fa-file-invoice">
        <div className="row">
          <TextField label="Debit Note No" name="DebitNoteNo" value={vm.formData.DebitNoteNo} onChange={vm.handleFieldChange} />
          <TextField label="Debit Note Date" name="DebitNoteDate" type="date" value={vm.formData.DebitNoteDate} onChange={vm.handleFieldChange} />
          <TextField label="Original Invoice / Purchase No" name="OriginalInvoiceNo" value={vm.formData.OriginalInvoiceNo} onChange={vm.handleFieldChange} />
          <TextField label="Original Invoice Date" name="OriginalInvoiceDate" type="date" value={vm.formData.OriginalInvoiceDate} onChange={vm.handleFieldChange} />
          <TextField label="Other References" name="OtherReferences" value={vm.formData.OtherReferences} onChange={vm.handleFieldChange} />
        </div>
      </FormSection>

      <FormSection title="Party Details" icon="fa fa-building">
        <div className="row">
          <div className="col-md-4">
            <PartySection title="Vendor (Seller)" companyId={vm.formData.SellerCompanyId} companies={vm.companies} fieldConfig={SELLER_FIELD_CONFIG} formData={vm.formData} onCompanyChange={(id) => vm.handleCompanySelect("seller", id)} />
          </div>
          <div className="col-md-4">
            <PartySection title="Consignee (Ship To)" companyId={vm.formData.ConsigneeCompanyId} companies={vm.companies} fieldConfig={CONSIGNEE_FIELD_CONFIG} formData={vm.formData} onCompanyChange={(id) => vm.handleCompanySelect("consignee", id)} />
          </div>
          <div className="col-md-4">
            <PartySection title="Buyer (Bill To)" companyId={vm.formData.BuyerCompanyId} companies={vm.companies} fieldConfig={BUYER_FIELD_CONFIG} formData={vm.formData} onCompanyChange={(id) => vm.handleCompanySelect("buyer", id)} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Description of Goods" icon="fa fa-boxes-stacked">
        <LineItemsTable
          items={vm.items}
          products={vm.products}
          onProductSelect={vm.handleProductSelect}
          onItemChange={vm.handleItemChange}
          onItemBlur={vm.handleItemBlur}
          onAdd={vm.addItem}
          onRemove={vm.removeItem}
        />
      </FormSection>

      <FormSection title="GST Details" icon="fa fa-percent">
        <GstDetailsTable
          gstDetails={vm.gstDetails}
          itemsTotal={vm.itemsTotal}
          onChange={(i, f, v) => vm.handleGstChange(i, f, v, vm.itemsTotal)}
          onBlur={(i, f) => vm.handleGstBlur(i, f, vm.itemsTotal)}
          onAdd={vm.addGst}
          onRemove={vm.removeGst}
        />
      </FormSection>

      <FormSection title="Declaration & Signatory" icon="fa fa-signature">
        <DeclarationSection formData={vm.formData} onFieldChange={vm.handleFieldChange} />
      </FormSection>

      <TotalsBar itemsTotal={vm.itemsTotal} gstTotal={vm.gstTotal} grandTotal={vm.grandTotal} />
      <FormActions submitting={submitting} editId={editId} saveLabel="Debit Note" onClose={onClose} />
    </form>
  );
};

export default DebitNoteForm;
