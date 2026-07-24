import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  createCreditNote,
  updateCreditNote,
  mapFormToPayload,
} from "../creditNoteApi";
import { calcItemAmount } from "../vouchers/shared/numberInputUtils";
import { useVoucherForm } from "../vouchers/shared/useVoucherForm";
import {
  FormSection,
  PartySection,
  LineItemsTable,
  GstDetailsTable,
  TaxBreakupTable,
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
import { mapSalesToCreditNoteLink } from "../accountDocumentLinks";

const CreditNoteForm = ({ documentId, initialData, onDataChange, onClose, onSaved }) => {
  const editId = documentId;
  const [submitting, setSubmitting] = useState(false);

  const vm = useVoucherForm({
    initialData,
    onDataChange,
    itemsKey: "Items",
    includeTaxBreakup: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vm.formData.CreditNoteNo) {
      toast.error("Credit Note No is required");
      return;
    }
    if (!vm.formData.SellerCompanyId || !vm.formData.BuyerCompanyId) {
      toast.error("Select seller and buyer companies");
      return;
    }
    if (!vm.items.some((item) => item.itemname && calcItemAmount(item.quantity, item.rate) > 0)) {
      toast.error("Add at least one item with quantity and rate greater than 0");
      return;
    }

    try {
      setSubmitting(true);
      const payload = mapFormToPayload(vm.formData, vm.items, vm.gstDetails, vm.taxBreakup);
      const result = editId
        ? await updateCreditNote(editId, payload)
        : await createCreditNote(payload);
      toast.success(editId ? "Credit note updated successfully" : "Credit note created successfully");
      if (onSaved) onSaved(editId || result?.data?.id);
    } catch (error) {
      toast.error(error.message || "Failed to save credit note");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InvoiceReferencePicker
        type="sales"
        label="Link from Sales Invoice"
        onApply={(sales) => {
          const linked = mapSalesToCreditNoteLink(sales);
          vm.setFormData((prev) => ({ ...prev, ...linked.formPatch }));
          vm.setItems(linked.items?.length ? linked.items : [emptyItem()]);
          vm.setGstDetails(linked.gstDetails);
        }}
      />
      <FormSection title="e-Invoice & Credit Note Details" icon="fa fa-file-invoice">
        <div className="row">
          <div className="col-md-3 mb-3">
            <label className="form-label">Invoice Type</label>
            <select name="InvoiceType" className="form-control" value={vm.formData.InvoiceType || "Credit Note"} onChange={vm.handleFieldChange}>
              <option value="Credit Note">Credit Note</option>
            </select>
          </div>
          <TextField label="IRN" name="IRN" value={vm.formData.IRN} onChange={vm.handleFieldChange} />
          <TextField label="Ack No" name="AckNo" value={vm.formData.AckNo} onChange={vm.handleFieldChange} />
          <TextField label="Ack Date" name="AckDate" type="date" value={vm.formData.AckDate} onChange={vm.handleFieldChange} />
          <TextField label="Credit Note No" name="CreditNoteNo" value={vm.formData.CreditNoteNo} onChange={vm.handleFieldChange} />
          <TextField label="Credit Note Date" name="CreditNoteDate" type="date" value={vm.formData.CreditNoteDate} onChange={vm.handleFieldChange} />
          <TextField label="E-Way Bill No" name="EWayBillNo" value={vm.formData.EWayBillNo} onChange={vm.handleFieldChange} />
        </div>
      </FormSection>

      <FormSection title="Reference & Dispatch" icon="fa fa-truck">
        <div className="row">
          <TextField label="Original Invoice No" name="OriginalInvoiceNo" value={vm.formData.OriginalInvoiceNo} onChange={vm.handleFieldChange} />
          <TextField label="Original Invoice Date" name="OriginalInvoiceDate" type="date" value={vm.formData.OriginalInvoiceDate} onChange={vm.handleFieldChange} />
          <TextField label="Buyer's Order No" name="BuyersOrderNo" value={vm.formData.BuyersOrderNo} onChange={vm.handleFieldChange} />
          <TextField label="Other References" name="OtherReferences" value={vm.formData.OtherReferences} onChange={vm.handleFieldChange} />
          <TextField label="Dispatch Doc No" name="DispatchDocNo" value={vm.formData.DispatchDocNo} onChange={vm.handleFieldChange} />
          <TextField label="Dispatched Through" name="DispatchedThrough" value={vm.formData.DispatchedThrough} onChange={vm.handleFieldChange} />
          <TextField label="Destination" name="Destination" value={vm.formData.Destination} onChange={vm.handleFieldChange} />
          <TextField label="Terms of Delivery" name="TermsOfDelivery" value={vm.formData.TermsOfDelivery} onChange={vm.handleFieldChange} />
        </div>
      </FormSection>

      <FormSection title="Party Details" icon="fa fa-building">
        <div className="row">
          <div className="col-md-4">
            <PartySection title="Seller (Company)" companyId={vm.formData.SellerCompanyId} companies={vm.companies} fieldConfig={SELLER_FIELD_CONFIG} formData={vm.formData} onCompanyChange={(id) => vm.handleCompanySelect("seller", id)} />
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

      <FormSection title="HSN-wise Tax Breakup" icon="fa fa-table">
        <TaxBreakupTable
          rows={vm.taxBreakup}
          onChange={vm.handleTaxBreakupChange}
          onBlur={vm.handleTaxBreakupBlur}
          onAdd={vm.addTaxBreakup}
          onRemove={vm.removeTaxBreakup}
        />
      </FormSection>

      <FormSection title="Declaration & Signatory" icon="fa fa-signature">
        <DeclarationSection formData={vm.formData} onFieldChange={vm.handleFieldChange} />
      </FormSection>

      <TotalsBar itemsTotal={vm.itemsTotal} gstTotal={vm.gstTotal} grandTotal={vm.grandTotal} />
      <FormActions submitting={submitting} editId={editId} saveLabel="Credit Note" onClose={onClose} />
    </form>
  );
};

export default CreditNoteForm;
