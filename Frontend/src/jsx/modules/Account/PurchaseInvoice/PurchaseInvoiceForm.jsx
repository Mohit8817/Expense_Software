import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  createPurchase,
  updatePurchase,
  mapFormToPayload,
  mapCompanyToVendorFields,
  mapCompanyToConsigneeFields,
  mapCompanyToBuyerFields,
} from "../purchaseApi";
import PurchaseBillScanner from "./PurchaseBillScanner";
import { getAllCompanies, getCompanyById } from "../companyApi";
import { getAllProducts } from "../productApi";
import { getUnitSelectOptions } from "../constants/measurementUnits";
import BankAccountSelect from "../BankAccountSelect";
import {
  getCompanyBankAccounts,
  mapBankAccountToFormFields,
  BANK_FIELDS_CLEAR,
} from "../companyBankUtils";

const emptyItem = () => ({
  productId: "",
  itemname: "",
  hsnSac: "",
  quantity: "",
  unit: "nos",
  rate: "",
  amount: "",
});

const emptyGst = () => ({ LedgerName: "", rate: "", amount: "" });

const VENDOR_CLEAR = {
  VendorCompanyId: "",
  VendorName: "",
  VendorAddress: "",
  Vendorgstin: "",
  VendorState: "",
  VendorStateCode: "",
  VendorCIN: "",
  VendorEmail: "",
  ...BANK_FIELDS_CLEAR,
};

const CONSIGNEE_CLEAR = {
  ConsigneeCompanyId: "",
  ConsigneeName: "",
  ConsigneeAddress: "",
  ConsigneeGstin: "",
  ConsigneeState: "",
  ConsigneeStateCode: "",
  ConsigneeEmail: "",
};

const BUYER_CLEAR = {
  BuyerCompanyId: "",
  CompanyName: "",
  CompanyAddress: "",
  CompanyGstin: "",
  CompanyState: "",
  CompanyStateCode: "",
  CompanyPAN: "",
  CompanyEmail: "",
};

const DetailRow = ({ label, value }) => (
  <div className="d-flex gap-2 small mb-1">
    <span className="text-muted flex-shrink-0">{label}</span>
    <span className="fw-medium">{value || "—"}</span>
  </div>
);

const PARTY_FIELD_CONFIG = {
  vendor: [
    { label: "Name", key: "VendorName" },
    { label: "Address", key: "VendorAddress" },
    { label: "GSTIN/UIN", key: "Vendorgstin" },
    { label: "State", key: "VendorState" },
    { label: "State Code", key: "VendorStateCode" },
    { label: "CIN", key: "VendorCIN" },
    { label: "Email", key: "VendorEmail" },
    { label: "Bank Name", key: "BankName" },
    { label: "A/C No", key: "BankAccountNo" },
    { label: "Branch", key: "BankBranch" },
    { label: "IFSC Code", key: "BankIfsc" },
  ],
  consignee: [
    { label: "Name", key: "ConsigneeName" },
    { label: "Address", key: "ConsigneeAddress" },
    { label: "GSTIN/UIN", key: "ConsigneeGstin" },
    { label: "State", key: "ConsigneeState" },
    { label: "State Code", key: "ConsigneeStateCode" },
    { label: "Email", key: "ConsigneeEmail" },
  ],
  buyer: [
    { label: "Name", key: "CompanyName" },
    { label: "Address", key: "CompanyAddress" },
    { label: "GSTIN/UIN", key: "CompanyGstin" },
    { label: "State", key: "CompanyState" },
    { label: "State Code", key: "CompanyStateCode" },
    { label: "PAN", key: "CompanyPAN" },
    { label: "Email", key: "CompanyEmail" },
  ],
};

const PartyInfoCard = ({ hasData, children }) =>
  hasData ? (
    <div className="pi-party-card border rounded account-muted-surface p-3 mt-2">{children}</div>
  ) : (
    <div className="pi-party-empty text-muted small p-3 border rounded account-surface mt-2">
      Select a company to view details
    </div>
  );

const FormSection = ({ title, icon, children }) => (
  <div className="pi-form-section card border-0 shadow-sm mb-3">
    <div className="card-header border-bottom py-3">
      <h6 className="mb-0 fw-bold">
        {icon && <i className={`${icon} me-2 text-primary`}></i>}
        {title}
      </h6>
    </div>
    <div className="card-body">{children}</div>
  </div>
);

const PurchaseInvoiceForm = ({ purchaseId, initialData, onDataChange, onClose, onSaved }) => {
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendorBanks, setVendorBanks] = useState([]);
  const [formData, setFormData] = useState({
    // ---- Invoice Type / e-Invoice ----
    InvoiceType: initialData?.InvoiceType || "Tax Invoice",
    IRN: initialData?.IRN || "",
    AckNo: initialData?.AckNo || "",
    AckDate: initialData?.AckDate || "",

    // ---- Vendor (Seller) Details ----
    VendorCompanyId: initialData?.VendorCompanyId || "",
    VendorName: initialData?.VendorName || "",
    VendorAddress: initialData?.VendorAddress || "",
    Vendorgstin: initialData?.Vendorgstin || "",
    VendorState: initialData?.VendorState || "",
    VendorStateCode: initialData?.VendorStateCode || "",
    VendorCIN: initialData?.VendorCIN || "",
    VendorEmail: initialData?.VendorEmail || "",
    BankAccountId: initialData?.BankAccountId || "",
    BankName: initialData?.BankName || "",
    BankAccountNo: initialData?.BankAccountNo || "",
    BankBranch: initialData?.BankBranch || "",
    BankIfsc: initialData?.BankIfsc || "",

    // ---- Consignee (Ship to) ----
    ConsigneeCompanyId: initialData?.ConsigneeCompanyId || "",
    ConsigneeName: initialData?.ConsigneeName || "",
    ConsigneeAddress: initialData?.ConsigneeAddress || "",
    ConsigneeGstin: initialData?.ConsigneeGstin || "",
    ConsigneeState: initialData?.ConsigneeState || "",
    ConsigneeStateCode: initialData?.ConsigneeStateCode || "",
    ConsigneeEmail: initialData?.ConsigneeEmail || "",

    // ---- Buyer (Company / Bill to) ----
    BuyerCompanyId: initialData?.BuyerCompanyId || "",
    CompanyName: initialData?.CompanyName || "",
    CompanyAddress: initialData?.CompanyAddress || "",
    CompanyGstin: initialData?.CompanyGstin || "",
    CompanyState: initialData?.CompanyState || "",
    CompanyStateCode: initialData?.CompanyStateCode || "",
    CompanyPAN: initialData?.CompanyPAN || "",
    CompanyEmail: initialData?.CompanyEmail || "",

    // ---- Invoice / Dispatch Details ----
    PurchaseNo: initialData?.PurchaseNo || "",
    EWayBillNo: initialData?.EWayBillNo || "",
    PurchaseDate: initialData?.PurchaseDate || "",
    DeliveryNote: initialData?.DeliveryNote || "",
    ModeTermsOfPayment: initialData?.ModeTermsOfPayment || "",
    ReferenceNoDate: initialData?.ReferenceNoDate || "",
    OtherReferences: initialData?.OtherReferences || "",
    PONo: initialData?.PONo || "",
    PODate: initialData?.PODate || "",
    DispatchDocNo: initialData?.DispatchDocNo || "",
    DeliveryNoteDate: initialData?.DeliveryNoteDate || "",
    DispatchedThrough: initialData?.DispatchedThrough || "",
    Destination: initialData?.Destination || "",
    BillOfLadingNo: initialData?.BillOfLadingNo || "",
    MotorVehicleNo: initialData?.MotorVehicleNo || "",
    TermsOfDelivery: initialData?.TermsOfDelivery || "",

    // ---- Amounts ----
    PurchaseAmount: initialData?.PurchaseAmount || "",

    // ---- Footer / Declaration ----
    AmountInWords: initialData?.AmountInWords || "",
    TaxAmountInWords: initialData?.TaxAmountInWords || "",
    Declaration: initialData?.Declaration || "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
    AuthorisedSignatoryName: initialData?.AuthorisedSignatoryName || "",
    AuthorisedSignatoryDesignation: initialData?.AuthorisedSignatoryDesignation || "",
    IssuingSignatoryName: initialData?.IssuingSignatoryName || "",
    IssuingSignatoryDesignation: initialData?.IssuingSignatoryDesignation || "",
    Jurisdiction: initialData?.Jurisdiction || "",
  });

  const [purchaseItems, setPurchaseItems] = useState(
    initialData?.PurchaseItems?.length ? initialData.PurchaseItems : [emptyItem()]
  );
  const [gstDetails, setGstDetails] = useState(
    initialData?.GstDetails?.length ? initialData.GstDetails : [emptyGst()]
  );

  useEffect(() => {
    Promise.all([getAllCompanies(), getAllProducts()])
      .then(([companyList, productList]) => {
        setCompanies(companyList);
        setProducts(productList);
      })
      .catch(() => toast.error("Failed to load master data"));
  }, []);

  useEffect(() => {
    if (!products.length) return;
    setPurchaseItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (item.productId || !item.itemname) return item;
        const match = products.find((p) => p.name === item.itemname);
        if (!match) return item;
        changed = true;
        return {
          ...item,
          productId: String(match.id),
          hsnSac: item.hsnSac || match.hsn_sac || "",
          unit: item.unit || match.units || "nos",
        };
      });
      return changed ? next : prev;
    });
  }, [products]);

  const loadVendorBanks = async (companyId) => {
    if (!companyId) {
      setVendorBanks([]);
      return;
    }
    try {
      const company = await getCompanyById(companyId);
      setVendorBanks(getCompanyBankAccounts(company));
      setCompanies((prev) => {
        const idx = prev.findIndex((c) => String(c.id) === String(companyId));
        if (idx < 0) return prev;
        const next = [...prev];
        next[idx] = company;
        return next;
      });
    } catch {
      const company = companies.find((c) => String(c.id) === String(companyId));
      setVendorBanks(getCompanyBankAccounts(company));
    }
  };

  useEffect(() => {
    if (formData.VendorCompanyId) {
      loadVendorBanks(formData.VendorCompanyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCompanySelect = (type, companyId) => {
    if (!companyId) {
      if (type === "vendor") {
        setFormData((prev) => ({ ...prev, ...VENDOR_CLEAR }));
        setVendorBanks([]);
      } else if (type === "consignee") {
        setFormData((prev) => ({ ...prev, ...CONSIGNEE_CLEAR }));
      } else {
        setFormData((prev) => ({ ...prev, ...BUYER_CLEAR }));
      }
      return;
    }

    const company = companies.find((c) => String(c.id) === String(companyId));
    if (!company) return;

    if (type === "vendor") {
      setFormData((prev) => ({
        ...prev,
        ...mapCompanyToVendorFields(company),
        ...BANK_FIELDS_CLEAR,
      }));
      loadVendorBanks(companyId);
    } else if (type === "consignee") {
      setFormData((prev) => ({ ...prev, ...mapCompanyToConsigneeFields(company) }));
    } else {
      setFormData((prev) => ({ ...prev, ...mapCompanyToBuyerFields(company) }));
    }
  };

  const handleBankAccountSelect = (bankAccountId) => {
    const bank = vendorBanks.find((b) => String(b.id) === String(bankAccountId));
    setFormData((prev) => ({
      ...prev,
      ...(bank ? mapBankAccountToFormFields(bank) : BANK_FIELDS_CLEAR),
    }));
  };

  const renderPartySection = (title, type, companyId, hasData, fieldKeys, bankAccounts = []) => (
    <div className="mb-4">
      <h6 className="text-uppercase small fw-bold mb-2">{title}</h6>
      <select
        className="form-control"
        value={companyId}
        onChange={(e) => handleCompanySelect(type, e.target.value)}
      >
        <option value="">Select Company</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} {c.short_name ? `(${c.short_name})` : ""}
          </option>
        ))}
      </select>
      {type === "vendor" && companyId && (
        <BankAccountSelect
          label="Select Bank Account"
          placeholder="Choose bank account"
          accounts={bankAccounts}
          value={formData.BankAccountId}
          onChange={handleBankAccountSelect}
          required
        />
      )}
      <PartyInfoCard hasData={hasData}>
        {fieldKeys.map(({ label, key }) => (
          <DetailRow key={key} label={label} value={formData[key]} />
        ))}
      </PartyInfoCard>
    </div>
  );

  // ---- Header field handlers ----
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductSelect = (index, productId) => {
    if (!productId) {
      setPurchaseItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], productId: "", itemname: "", hsnSac: "", unit: "nos" };
        return updated;
      });
      return;
    }

    const product = products.find((p) => String(p.id) === String(productId));
    if (!product) return;

    setPurchaseItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        productId: String(productId),
        itemname: product.name,
        hsnSac: product.hsn_sac || "",
        unit: product.units || "nos",
      };
      return updated;
    });
  };

  // ---- Purchase Items handlers ----
  const handleItemChange = (index, field, value) => {
    setPurchaseItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // auto-calc amount = quantity * rate
      if (field === "quantity" || field === "rate") {
        const qty = parseFloat(updated[index].quantity) || 0;
        const rate = parseFloat(updated[index].rate) || 0;
        updated[index].amount = qty * rate;
      }
      return updated;
    });
  };

  const addItemRow = () => setPurchaseItems((prev) => [...prev, emptyItem()]);
  const removeItemRow = (index) =>
    setPurchaseItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  // ---- GST Details handlers ----
  const handleGstChange = (index, field, value) => {
    setGstDetails((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // auto-calc amount = taxable value (items total) * rate% when rate changes
      if (field === "rate") {
        const rate = parseFloat(value) || 0;
        const taxable = purchaseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        updated[index].amount = ((taxable * rate) / 100).toFixed(2);
      }
      return updated;
    });
  };

  const addGstRow = () => setGstDetails((prev) => [...prev, emptyGst()]);
  const removeGstRow = (index) =>
    setGstDetails((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  // ---- Totals ----
  const itemsTotal = purchaseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalQty = purchaseItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
  const gstTotal = gstDetails.reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);
  const grandTotal = itemsTotal + gstTotal;

  // Push the current form state up to the parent on every change so the
  // col-4 preview panel can render totals live, without this component
  // knowing or caring how (or whether) that panel is displayed.
  useEffect(() => {
    if (!onDataChange) return;
    onDataChange({
      ...formData,
      PurchaseAmount: formData.PurchaseAmount || grandTotal,
      GstAmount: gstTotal,
      PurchaseItems: purchaseItems,
      GstDetails: gstDetails,
      status: initialData?.status || "Draft",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, purchaseItems, gstDetails]);

  // ---- Submit ----
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.VendorCompanyId || !formData.PurchaseNo) {
      toast.error("Please select vendor and enter Purchase No");
      return;
    }

    if (vendorBanks.length && !formData.BankAccountId) {
      toast.error("Please select a vendor bank account");
      return;
    }

    if (!purchaseItems.some((item) => item.productId && item.quantity && item.rate)) {
      toast.error("Add at least one product with quantity and rate");
      return;
    }

    try {
      setSubmitting(true);
      const payload = mapFormToPayload(formData, purchaseItems, gstDetails);

      const result = purchaseId
        ? await updatePurchase(purchaseId, payload)
        : await createPurchase(payload);
      toast.success(purchaseId ? "Purchase invoice updated successfully" : "Purchase invoice created successfully");
      if (onSaved) onSaved(purchaseId || result?.data?.id);
    } catch (error) {
      toast.error(error.message || "Failed to save purchase invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyScan = (scanned) => {
    setFormData((prev) => ({ ...prev, ...scanned.formFields }));
    setPurchaseItems(scanned.items);
    setGstDetails(scanned.gstDetails);
    if (scanned.formFields.VendorCompanyId) {
      loadVendorBanks(scanned.formFields.VendorCompanyId);
    }
  };

  const handleReset = () => {
    setFormData({
      InvoiceType: "Tax Invoice",
      IRN: "",
      AckNo: "",
      AckDate: "",
      VendorCompanyId: "",
      VendorName: "",
      VendorAddress: "",
      Vendorgstin: "",
      VendorState: "",
      VendorStateCode: "",
      VendorCIN: "",
      VendorEmail: "",
      ...BANK_FIELDS_CLEAR,
      ConsigneeCompanyId: "",
      ConsigneeName: "",
      ConsigneeAddress: "",
      ConsigneeGstin: "",
      ConsigneeState: "",
      ConsigneeStateCode: "",
      ConsigneeEmail: "",
      BuyerCompanyId: "",
      CompanyName: "",
      CompanyAddress: "",
      CompanyGstin: "",
      CompanyState: "",
      CompanyStateCode: "",
      CompanyPAN: "",
      CompanyEmail: "",
      PurchaseNo: "",
      EWayBillNo: "",
      PurchaseDate: "",
      DeliveryNote: "",
      ModeTermsOfPayment: "",
      ReferenceNoDate: "",
      OtherReferences: "",
      PONo: "",
      PODate: "",
      DispatchDocNo: "",
      DeliveryNoteDate: "",
      DispatchedThrough: "",
      Destination: "",
      BillOfLadingNo: "",
      MotorVehicleNo: "",
      TermsOfDelivery: "",
      PurchaseAmount: "",
      AmountInWords: "",
      TaxAmountInWords: "",
      Declaration:
        "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
      AuthorisedSignatoryName: "",
      AuthorisedSignatoryDesignation: "",
      IssuingSignatoryName: "",
      IssuingSignatoryDesignation: "",
      Jurisdiction: "",
    });
    setPurchaseItems([emptyItem()]);
    setGstDetails([emptyGst()]);
  };

  return (
    <form onSubmit={handleSubmit} className="pi-purchase-form">
      <PurchaseBillScanner
        companies={companies}
        products={products}
        onApply={handleApplyScan}
        disabled={submitting}
      />

      <FormSection title="Invoice Type & e-Invoice" icon="fa fa-file-invoice">
      <div className="row">
        <div className="col-md-3 mb-3">
          <label className="form-label">Invoice Type</label>
          <select
            name="InvoiceType"
            className="form-control"
            value={formData.InvoiceType}
            onChange={handleFieldChange}
          >
            <option value="Tax Invoice">Tax Invoice</option>
            <option value="Purchase">Purchase</option>
            <option value="Bill of Supply">Bill of Supply</option>
          </select>
        </div>
        <div className="col-md-5 mb-3">
          <label className="form-label">IRN</label>
          <input
            type="text"
            name="IRN"
            className="form-control"
            placeholder="Enter IRN"
            value={formData.IRN}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-2 mb-3">
          <label className="form-label">Ack No.</label>
          <input
            type="text"
            name="AckNo"
            className="form-control"
            placeholder="Ack No"
            value={formData.AckNo}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-2 mb-3">
          <label className="form-label">Ack Date</label>
          <input
            type="date"
            name="AckDate"
            className="form-control"
            value={formData.AckDate}
            onChange={handleFieldChange}
          />
        </div>
      </div>
      </FormSection>

      <FormSection title="Party Details" icon="fa fa-building">
      <div className="row mb-0">
        <div className="col-lg-4">
          {renderPartySection(
            "Vendor (Seller)",
            "vendor",
            formData.VendorCompanyId,
            !!formData.VendorCompanyId,
            PARTY_FIELD_CONFIG.vendor,
            vendorBanks
          )}
        </div>
        <div className="col-lg-4">
          {renderPartySection(
            "Consignee (Ship to)",
            "consignee",
            formData.ConsigneeCompanyId,
            !!formData.ConsigneeCompanyId,
            PARTY_FIELD_CONFIG.consignee
          )}
        </div>
        <div className="col-lg-4">
          {renderPartySection(
            "Buyer (Bill to)",
            "buyer",
            formData.BuyerCompanyId,
            !!formData.BuyerCompanyId,
            PARTY_FIELD_CONFIG.buyer
          )}
        </div>
      </div>
      </FormSection>

      <FormSection title="Invoice & Dispatch Details" icon="fa fa-truck">
      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label">Invoice No (Purchase No)</label>
          <input
            type="text"
            name="PurchaseNo"
            className="form-control"
            placeholder="Enter Invoice No"
            value={formData.PurchaseNo}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">e-Way Bill No.</label>
          <input
            type="text"
            name="EWayBillNo"
            className="form-control"
            placeholder="Enter e-Way Bill No"
            value={formData.EWayBillNo}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Invoice Date (Dated)</label>
          <input
            type="date"
            name="PurchaseDate"
            className="form-control"
            value={formData.PurchaseDate}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Delivery Note</label>
          <input
            type="text"
            name="DeliveryNote"
            className="form-control"
            placeholder="Enter Delivery Note"
            value={formData.DeliveryNote}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Mode/Terms of Payment</label>
          <input
            type="text"
            name="ModeTermsOfPayment"
            className="form-control"
            placeholder="Enter Mode/Terms of Payment"
            value={formData.ModeTermsOfPayment}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Reference No. &amp; Date.</label>
          <input
            type="text"
            name="ReferenceNoDate"
            className="form-control"
            placeholder="Enter Reference No & Date"
            value={formData.ReferenceNoDate}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Other References</label>
          <input
            type="text"
            name="OtherReferences"
            className="form-control"
            placeholder="Enter Other References"
            value={formData.OtherReferences}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Buyer's Order No. (PO No)</label>
          <input
            type="text"
            name="PONo"
            className="form-control"
            placeholder="Enter PO No"
            value={formData.PONo}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Dated</label>
          <input
            type="date"
            name="PODate"
            className="form-control"
            value={formData.PODate}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Dispatch Doc No.</label>
          <input
            type="text"
            name="DispatchDocNo"
            className="form-control"
            placeholder="Enter Dispatch Doc No"
            value={formData.DispatchDocNo}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Delivery Note Date</label>
          <input
            type="date"
            name="DeliveryNoteDate"
            className="form-control"
            value={formData.DeliveryNoteDate}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Dispatched through</label>
          <input
            type="text"
            name="DispatchedThrough"
            className="form-control"
            placeholder="Enter Dispatched Through"
            value={formData.DispatchedThrough}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Destination</label>
          <input
            type="text"
            name="Destination"
            className="form-control"
            placeholder="Enter Destination"
            value={formData.Destination}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Bill of Lading/LR-RR No.</label>
          <input
            type="text"
            name="BillOfLadingNo"
            className="form-control"
            placeholder="Enter Bill of Lading/LR-RR No"
            value={formData.BillOfLadingNo}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Motor Vehicle No.</label>
          <input
            type="text"
            name="MotorVehicleNo"
            className="form-control"
            placeholder="Enter Motor Vehicle No"
            value={formData.MotorVehicleNo}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Terms of Delivery</label>
          <input
            type="text"
            name="TermsOfDelivery"
            className="form-control"
            placeholder="Enter Terms of Delivery"
            value={formData.TermsOfDelivery}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Purchase Amount</label>
          <input
            type="number"
            name="PurchaseAmount"
            className="form-control"
            placeholder="Enter Purchase Amount"
            value={formData.PurchaseAmount}
            onChange={handleFieldChange}
          />
        </div>
      </div>
      </FormSection>

      <FormSection title="Description of Goods" icon="fa fa-boxes-stacked">
      <Table bordered responsive className="align-middle mb-0 pi-items-table">
        <thead>
          <tr>
            <th width="5%">Sl No</th>
            <th>Product</th>
            <th width="12%">HSN/SAC</th>
            <th width="10%">Quantity</th>
            <th width="10%">Per</th>
            <th width="12%">Rate</th>
            <th width="14%">Amount</th>
            <th width="5%"></th>
          </tr>
        </thead>
        <tbody>
          {purchaseItems.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                <select
                  className="form-control"
                  value={item.productId || ""}
                  onChange={(e) => handleProductSelect(index, e.target.value)}
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {!item.productId && item.itemname && (
                  <small className="text-muted d-block mt-1">{item.itemname}</small>
                )}
              </td>
              <td className="align-middle">
                <span className="badge bg-light text-dark border fw-normal">
                  {item.hsnSac || "—"}
                </span>
              </td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                />
              </td>
              <td>
                <select
                  className="form-control"
                  value={item.unit || "nos"}
                  onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                >
                  {getUnitSelectOptions(item.unit).map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Rate"
                  value={item.rate}
                  onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                />
              </td>
              <td>
                <input type="number" className="form-control" placeholder="0" value={item.amount} readOnly />
              </td>
              <td className="text-center">
                {purchaseItems.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-light btn-sm text-danger"
                    onClick={() => removeItemRow(index)}
                    title="Remove"
                  >
                    <i className="fa fa-trash"></i>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="3" className="text-end fw-bold">
              Total
            </td>
            <td className="fw-bold">{totalQty}</td>
            <td colSpan="2"></td>
            <td className="fw-bold">{itemsTotal.toFixed(2)}</td>
            <td></td>
          </tr>
        </tfoot>
      </Table>

      <button type="button" className="btn btn-outline-primary btn-sm mt-3" onClick={addItemRow}>
        + Add Item
      </button>
      </FormSection>

      <FormSection title="Tax Details" icon="fa fa-percent">
      <Table bordered responsive className="align-middle mb-0">
        <thead>
          <tr>
            <th width="45%">Ledger Name (Tax Type)</th>
            <th width="20%">Rate (%)</th>
            <th>Amount</th>
            <th width="6%"></th>
          </tr>
        </thead>
        <tbody>
          {gstDetails.map((g, index) => (
            <tr key={index}>
              <td>
                <select
                  className="form-control"
                  value={g.LedgerName}
                  onChange={(e) => handleGstChange(index, "LedgerName", e.target.value)}
                >
                  <option value="">Select Ledger</option>
                  <option value="CGST">CGST</option>
                  <option value="SGST">SGST</option>
                  <option value="IGST">IGST</option>
                </select>
              </td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Rate %"
                  value={g.rate}
                  onChange={(e) => handleGstChange(index, "rate", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Amount"
                  value={g.amount}
                  onChange={(e) => handleGstChange(index, "amount", e.target.value)}
                />
              </td>
              <td className="text-center">
                {gstDetails.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-light btn-sm text-danger"
                    onClick={() => removeGstRow(index)}
                    title="Remove"
                  >
                    <i className="fa fa-trash"></i>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <button type="button" className="btn btn-outline-primary btn-sm mt-3 mb-3" onClick={addGstRow}>
        + Add GST
      </button>

      <div className="pi-totals-box rounded p-3 account-surface border mb-0">
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Taxable Value</span>
          <strong>{itemsTotal.toFixed(2)}</strong>
        </div>
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Total Tax</span>
          <strong>{gstTotal.toFixed(2)}</strong>
        </div>
        <div className="d-flex justify-content-between pt-2 border-top">
          <span className="fw-bold">Grand Total</span>
          <strong className="text-primary fs-5">{grandTotal.toFixed(2)}</strong>
        </div>
      </div>
      </FormSection>

      <FormSection title="Amount in Words & Declaration" icon="fa fa-signature">
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Amount Chargeable (in words)</label>
          <input
            type="text"
            name="AmountInWords"
            className="form-control"
            placeholder="Indian Rupees ... Only"
            value={formData.AmountInWords}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label">Tax Amount (in words)</label>
          <input
            type="text"
            name="TaxAmountInWords"
            className="form-control"
            placeholder="Indian Rupees ... Only"
            value={formData.TaxAmountInWords}
            onChange={handleFieldChange}
          />
        </div>
      </div>

      {/* Declaration / Signatory */}
      <div className="row mt-2">
        <div className="col-md-12 mb-3">
          <label className="form-label">Declaration</label>
          <input
            type="text"
            name="Declaration"
            className="form-control"
            placeholder="Enter Declaration Text"
            value={formData.Declaration}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-3 mb-3">
          <label className="form-label">Authorised Signatory Name</label>
          <input
            type="text"
            name="AuthorisedSignatoryName"
            className="form-control"
            placeholder="Enter Name"
            value={formData.AuthorisedSignatoryName}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-3 mb-3">
          <label className="form-label">Authorised Signatory Designation</label>
          <input
            type="text"
            name="AuthorisedSignatoryDesignation"
            className="form-control"
            placeholder="Enter Designation"
            value={formData.AuthorisedSignatoryDesignation}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-3 mb-3">
          <label className="form-label">Issuing Signatory Name</label>
          <input
            type="text"
            name="IssuingSignatoryName"
            className="form-control"
            placeholder="Enter Name"
            value={formData.IssuingSignatoryName}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-3 mb-3">
          <label className="form-label">Issuing Signatory Designation</label>
          <input
            type="text"
            name="IssuingSignatoryDesignation"
            className="form-control"
            placeholder="Enter Designation"
            value={formData.IssuingSignatoryDesignation}
            onChange={handleFieldChange}
          />
        </div>
      </div>
      </FormSection>

      <div className="pi-form-actions sticky-bottom account-surface border rounded shadow-sm p-3 mt-2">
        <div className="text-end">
        <button type="button" className="btn btn-light me-2" onClick={handleReset}>
          Reset
        </button>
        {onClose && (
          <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary px-4" disabled={submitting}>
          {submitting ? "Saving..." : "Save Purchase Invoice"}
        </button>
        </div>
      </div>
    </form>
  );
};

export default PurchaseInvoiceForm;