import React, { useState } from "react";
import { Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { createCompany, updateCompany, scanAndMapCompanyDocument } from "../companyApi";
import AiDocumentScanner from "../vouchers/shared/AiDocumentScanner";

const emptyForm = () => ({
  name: "",
  short_name: "",
  gst: "",
  pan: "",
  tan: "",
  cin: "",
  email: "",
  state_code: "",
  address: "",
  city: "",
  state: "",
  zipcode: "",
  code: "",
  status: "1",
});

const emptyBankAccount = () => ({
  bank_name: "",
  ac_no: "",
  branch_name: "",
  ifsc_code: "",
  is_primary: false,
});

const CompanyDetailForm = ({ companyId, initialData, onClose, onSaved }) => {
  const [formData, setFormData] = useState(initialData || emptyForm());
  const [bankAccounts, setBankAccounts] = useState(
    initialData?.bank_accounts?.length
      ? initialData.bank_accounts.map((b) => ({
          bank_name: b.bank_name || "",
          ac_no: b.ac_no || "",
          branch_name: b.branch_name || "",
          ifsc_code: b.ifsc_code || "",
          is_primary: !!b.is_primary,
        }))
      : [emptyBankAccount()]
  );
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (index, field, value) => {
    setBankAccounts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "is_primary" && value) {
        return updated.map((row, i) => ({ ...row, is_primary: i === index }));
      }
      return updated;
    });
  };

  const addBankRow = () => setBankAccounts((prev) => [...prev, emptyBankAccount()]);

  const removeBankRow = (index) =>
    setBankAccounts((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.short_name || !formData.address || !formData.city || !formData.state || !formData.zipcode || !formData.code) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        short_name: formData.short_name,
        gst: formData.gst,
        pan: formData.pan,
        tan: formData.tan,
        cin: formData.cin,
        email: formData.email,
        state_code: formData.state_code,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipcode: formData.zipcode,
        code: formData.code,
        status: Number(formData.status),
        bank_accounts: bankAccounts.filter((b) => b.bank_name || b.ac_no),
      };

      const result = companyId
        ? await updateCompany(companyId, payload)
        : await createCompany(payload);

      if (onSaved) onSaved(companyId || result?.data?.id);
    } catch (error) {
      toast.error(error.message || "Failed to save company");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyScan = (scanned) => {
    setFormData((prev) => ({ ...prev, ...scanned.formData }));
    if (scanned.bankAccounts?.length) {
      setBankAccounts(scanned.bankAccounts);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <AiDocumentScanner
        title="AI Company Document Scan"
        badge="GST cert / letterhead / invoice"
        description="Upload a GST certificate, letterhead, or invoice party block — AI fills company name, GSTIN, address, and bank details."
        scanFile={scanAndMapCompanyDocument}
        onApply={handleApplyScan}
        disabled={submitting}
        renderPreview={(preview) => (
          <div className="row g-2 small">
            <div className="col-md-4">
              <span className="text-muted">Company</span>
              <div className="fw-medium text-truncate">{preview.summary?.name || "—"}</div>
            </div>
            <div className="col-md-4">
              <span className="text-muted">GSTIN</span>
              <div className="fw-medium">{preview.summary?.gstin || "—"}</div>
            </div>
            <div className="col-md-4">
              <span className="text-muted">Bank Accounts</span>
              <div className="fw-medium">{preview.summary?.bankCount || 0}</div>
            </div>
          </div>
        )}
      />
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Company Name *</label>
          <input type="text" name="name" className="form-control" placeholder="Enter company name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label">Short Name *</label>
          <input type="text" name="short_name" className="form-control" placeholder="Enter short name" value={formData.short_name} onChange={handleChange} required />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Company Code *</label>
          <input type="text" name="code" className="form-control" placeholder="Enter code" value={formData.code} onChange={handleChange} required />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">GST</label>
          <input type="text" name="gst" className="form-control" placeholder="Enter GST number" value={formData.gst} onChange={handleChange} />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">PAN</label>
          <input type="text" name="pan" className="form-control" placeholder="Enter PAN" value={formData.pan} onChange={handleChange} />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">TAN</label>
          <input type="text" name="tan" className="form-control" placeholder="Enter TAN" value={formData.tan} onChange={handleChange} />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">CIN No</label>
          <input type="text" name="cin" className="form-control" placeholder="Enter CIN number" value={formData.cin} onChange={handleChange} />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Email</label>
          <input type="email" name="email" className="form-control" placeholder="Enter email" value={formData.email} onChange={handleChange} />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">GST State Code</label>
          <input type="text" name="state_code" className="form-control" placeholder="e.g. 07" value={formData.state_code} onChange={handleChange} />
        </div>
        <div className="col-md-12 mb-3">
          <label className="form-label">Address *</label>
          <textarea name="address" className="form-control" rows="2" placeholder="Enter address" value={formData.address} onChange={handleChange} required />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">City *</label>
          <input type="text" name="city" className="form-control" placeholder="Enter city" value={formData.city} onChange={handleChange} required />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">State *</label>
          <input type="text" name="state" className="form-control" placeholder="Enter state" value={formData.state} onChange={handleChange} required />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Zipcode *</label>
          <input type="number" name="zipcode" className="form-control" placeholder="Enter zipcode" value={formData.zipcode} onChange={handleChange} required />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Status</label>
          <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>

        <div className="col-12">
          <div className="d-flex align-items-center justify-content-between mb-3 mt-2">
            <h6 className="text-uppercase small fw-bold mb-0">Bank Accounts</h6>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={addBankRow}>
              + Add Bank Account
            </button>
          </div>
          <Table bordered responsive className="align-middle mb-4">
            <thead>
              <tr>
                <th>Bank Name</th>
                <th>Account No</th>
                <th>Branch</th>
                <th>IFSC</th>
                <th className="text-center">Primary</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bankAccounts.map((bank, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Bank name"
                      value={bank.bank_name}
                      onChange={(e) => handleBankChange(index, "bank_name", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Account no"
                      value={bank.ac_no}
                      onChange={(e) => handleBankChange(index, "ac_no", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Branch"
                      value={bank.branch_name}
                      onChange={(e) => handleBankChange(index, "branch_name", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="IFSC"
                      value={bank.ifsc_code}
                      onChange={(e) => handleBankChange(index, "ifsc_code", e.target.value)}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={!!bank.is_primary}
                      onChange={(e) => handleBankChange(index, "is_primary", e.target.checked)}
                    />
                  </td>
                  <td className="text-center">
                    {bankAccounts.length > 1 && (
                      <button type="button" className="btn btn-light btn-sm text-danger" onClick={() => removeBankRow(index)} title="Remove">
                        <i className="fa fa-trash"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      <div className="text-end border-top pt-3">
        {onClose && (
          <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : companyId ? "Update Company" : "Save Company"}
        </button>
      </div>
    </form>
  );
};

export default CompanyDetailForm;
