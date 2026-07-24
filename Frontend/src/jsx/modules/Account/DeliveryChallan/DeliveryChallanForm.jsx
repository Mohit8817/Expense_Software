import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  createDeliveryChallan,
  updateDeliveryChallan,
  mapFormToPayload,
} from "../deliveryChallanApi";
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
  BUYER_FIELD_CONFIG,
  emptyItem,
} from "../vouchers/shared/voucherMapperUtils";
import InvoiceReferencePicker from "../vouchers/shared/InvoiceReferencePicker";
import { mapSalesToDeliveryChallanLink } from "../accountDocumentLinks";

const DeliveryChallanForm = ({ documentId, initialData, onDataChange, onClose, onSaved }) => {
  const editId = documentId;
  const [submitting, setSubmitting] = useState(false);

  const vm = useVoucherForm({ initialData, onDataChange, itemsKey: "Items", includeConsignee: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vm.formData.ChallanNo) {
      toast.error("Challan No is required");
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
      const payload = mapFormToPayload(vm.formData, vm.items, vm.gstDetails);
      const result = editId
        ? await updateDeliveryChallan(editId, payload)
        : await createDeliveryChallan(payload);
      toast.success(editId ? "Delivery challan updated successfully" : "Delivery challan created successfully");
      if (onSaved) onSaved(editId || result?.data?.id);
    } catch (error) {
      toast.error(error.message || "Failed to save delivery challan");
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
          const linked = mapSalesToDeliveryChallanLink(sales);
          vm.setFormData((prev) => ({ ...prev, ...linked.formPatch }));
          vm.setItems(linked.items?.length ? linked.items : [emptyItem()]);
          vm.setGstDetails(linked.gstDetails);
        }}
      />
      <FormSection title="Challan Details" icon="fa fa-truck-fast">
        <div className="row">
          <TextField label="Challan No" name="ChallanNo" value={vm.formData.ChallanNo} onChange={vm.handleFieldChange} />
          <TextField label="Challan Date" name="ChallanDate" type="date" value={vm.formData.ChallanDate} onChange={vm.handleFieldChange} />
          <TextField label="Reference No" name="ReferenceNo" value={vm.formData.ReferenceNo} onChange={vm.handleFieldChange} />
          <TextField label="Reference Date" name="ReferenceDate" type="date" value={vm.formData.ReferenceDate} onChange={vm.handleFieldChange} />
          <TextField label="Invoice No" name="InvoiceNo" value={vm.formData.InvoiceNo} onChange={vm.handleFieldChange} />
          <TextField label="Invoice Date" name="InvoiceDate" type="date" value={vm.formData.InvoiceDate} onChange={vm.handleFieldChange} />
          <TextField label="Buyer's Order No" name="BuyersOrderNo" value={vm.formData.BuyersOrderNo} onChange={vm.handleFieldChange} />
          <TextField label="Buyer's Order Date" name="BuyersOrderDate" type="date" value={vm.formData.BuyersOrderDate} onChange={vm.handleFieldChange} />
          <TextField label="Place of Supply" name="PlaceOfSupply" value={vm.formData.PlaceOfSupply} onChange={vm.handleFieldChange} />
        </div>
      </FormSection>

      <FormSection title="Transport Details" icon="fa fa-truck">
        <div className="row">
          <TextField label="Dispatch Doc No" name="DispatchDocNo" value={vm.formData.DispatchDocNo} onChange={vm.handleFieldChange} />
          <TextField label="Dispatched Through" name="DispatchedThrough" value={vm.formData.DispatchedThrough} onChange={vm.handleFieldChange} />
          <TextField label="Destination" name="Destination" value={vm.formData.Destination} onChange={vm.handleFieldChange} />
          <TextField label="Motor Vehicle No" name="MotorVehicleNo" value={vm.formData.MotorVehicleNo} onChange={vm.handleFieldChange} />
          <TextField label="Bill of Lading No" name="BillOfLadingNo" value={vm.formData.BillOfLadingNo} onChange={vm.handleFieldChange} />
          <TextField label="Terms of Delivery" name="TermsOfDelivery" value={vm.formData.TermsOfDelivery} onChange={vm.handleFieldChange} />
          <TextField label="Policy No" name="PolicyNo" value={vm.formData.PolicyNo} onChange={vm.handleFieldChange} />
        </div>
      </FormSection>

      <FormSection title="Party Details" icon="fa fa-building">
        <div className="row">
          <div className="col-md-6">
            <PartySection title="Seller (Company)" companyId={vm.formData.SellerCompanyId} companies={vm.companies} fieldConfig={SELLER_FIELD_CONFIG} formData={vm.formData} onCompanyChange={(id) => vm.handleCompanySelect("seller", id)} />
          </div>
          <div className="col-md-6">
            <PartySection title="Buyer (Customer)" companyId={vm.formData.BuyerCompanyId} companies={vm.companies} fieldConfig={BUYER_FIELD_CONFIG} formData={vm.formData} onCompanyChange={(id) => vm.handleCompanySelect("buyer", id)} />
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
      <FormActions submitting={submitting} editId={editId} saveLabel="Delivery Challan" onClose={onClose} />
    </form>
  );
};

export default DeliveryChallanForm;
