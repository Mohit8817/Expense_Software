import React, { useRef, useState } from "react";
import { Modal, Table, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { importProducts } from "../productApi";
import {
  downloadProductImportSample,
  parseProductExcelFile,
  validateImportProducts,
} from "./productExcelUtils";

const ProductExcelImport = ({ show, onHide, onImported }) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  const resetState = () => {
    setFileName("");
    setRows([]);
    setErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (importing) return;
    resetState();
    onHide();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setErrors([]);
    try {
      const products = await parseProductExcelFile(file);
      if (!products.length) {
        toast.error("No product rows found in the file");
        setRows([]);
        setFileName("");
        return;
      }
      setRows(products);
      setFileName(file.name);
      setErrors(validateImportProducts(products));
    } catch (error) {
      toast.error(error.message || "Failed to parse Excel file");
      setRows([]);
      setFileName("");
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    const validationErrors = validateImportProducts(rows);
    setErrors(validationErrors);
    if (validationErrors.length) {
      toast.error("Fix validation errors before importing");
      return;
    }

    try {
      setImporting(true);
      const result = await importProducts(rows);
      const { created = 0, failed = 0 } = result.data || {};

      if (created > 0) {
        toast.success(`${created} product(s) imported successfully`);
        if (onImported) onImported();
      }
      if (failed > 0) {
        toast.warn(`${failed} row(s) could not be imported`);
        setErrors(result.data?.errors || []);
      }
      if (created > 0 && failed === 0) handleClose();
    } catch (error) {
      toast.error(error.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton={!importing}>
        <Modal.Title>Import Products from Excel</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small mb-3">
          Download the sample file, fill in your products, then upload the Excel file (.xlsx or .xls).
          Required columns: <strong>Product Name</strong> and <strong>Description</strong>.
        </p>

        <div className="d-flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            className="btn btn-outline-success btn-sm"
            onClick={downloadProductImportSample}
          >
            <i className="fa fa-file-excel me-1"></i>
            Download Sample Excel
          </button>
          <label className="btn btn-outline-primary btn-sm mb-0">
            <i className="fa fa-upload me-1"></i>
            {parsing ? "Reading..." : "Choose Excel File"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="d-none"
              disabled={parsing || importing}
              onChange={handleFileChange}
            />
          </label>
        </div>

        {fileName && (
          <div className="small text-muted mb-3">
            Selected file: <span className="fw-medium">{fileName}</span> · {rows.length} row(s)
          </div>
        )}

        {errors.length > 0 && (
          <div className="alert alert-warning py-2 small mb-3">
            <div className="fw-semibold mb-1">Validation issues</div>
            <ul className="mb-0 ps-3">
              {errors.slice(0, 8).map((err, index) => (
                <li key={`${err.row}-${index}`}>
                  Row {err.row}: {err.message}
                </li>
              ))}
              {errors.length > 8 && <li>…and {errors.length - 8} more</li>}
            </ul>
          </div>
        )}

        {rows.length > 0 && (
          <div className="table-responsive border rounded" style={{ maxHeight: 320 }}>
            <Table size="sm" className="mb-0 align-middle">
              <thead className="table-light sticky-top">
                <tr>
                  <th>#</th>
                  <th>Product Name</th>
                  <th>Description</th>
                  <th>HSN/SAC</th>
                  <th>Units</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td className="text-muted">{index + 1}</td>
                    <td className="fw-medium">{row.name || "—"}</td>
                    <td>{row.desc || "—"}</td>
                    <td>{row.hsn_sac || "—"}</td>
                    <td>{row.units || "—"}</td>
                    <td>
                      <Badge bg={row.status === 1 ? "success" : "secondary"} className="rounded-pill">
                        {row.status === 1 ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-light" onClick={handleClose} disabled={importing}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleImport}
          disabled={!rows.length || importing || parsing || errors.length > 0}
        >
          {importing ? "Importing..." : `Import ${rows.length || ""} Product${rows.length === 1 ? "" : "s"}`}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductExcelImport;
