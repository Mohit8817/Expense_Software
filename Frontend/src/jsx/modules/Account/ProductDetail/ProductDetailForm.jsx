import React, { useState } from "react";
import { toast } from "react-toastify";
import { createProduct, updateProduct } from "../productApi";

const emptyForm = () => ({
  name: "",
  desc: "",
  hsn_sac: "",
  units: "",
  status: "1",
});

const ProductDetailForm = ({ productId, initialData, onClose, onSaved }) => {
  const [formData, setFormData] = useState(initialData || emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.desc) {
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        desc: formData.desc,
        hsn_sac: formData.hsn_sac,
        units: formData.units,
        status: Number(formData.status),
      };

      const result = productId
        ? await updateProduct(productId, payload)
        : await createProduct(payload);

      if (onSaved) onSaved(productId || result?.data?.id);
    } catch (error) {
      toast.error(error.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Product Name *</label>
          <input
            type="text"
            name="name"
            className="form-control"
            placeholder="Enter product name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">HSN/SAC</label>
          <input
            type="text"
            name="hsn_sac"
            className="form-control"
            placeholder="Enter HSN/SAC code"
            value={formData.hsn_sac}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-12 mb-3">
          <label className="form-label">Description *</label>
          <textarea
            name="desc"
            className="form-control"
            rows="3"
            placeholder="Enter product description"
            value={formData.desc}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">Units</label>
          <input
            type="text"
            name="units"
            className="form-control"
            placeholder="e.g. nos, kg, pcs"
            value={formData.units}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">Status</label>
          <select
            name="status"
            className="form-control"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
      </div>

      <div className="text-end border-top pt-3">
        {onClose && (
          <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : productId ? "Update Product" : "Save Product"}
        </button>
      </div>
    </form>
  );
};

export default ProductDetailForm;
