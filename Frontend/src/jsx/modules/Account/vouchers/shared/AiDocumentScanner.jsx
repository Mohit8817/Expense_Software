import React, { useRef, useState } from "react";
import { Badge } from "react-bootstrap";
import { toast } from "react-toastify";

const AiDocumentScanner = ({
  title = "AI Scan",
  badge = "Auto-fill from photo or PDF",
  description = "Upload a document or take a photo — AI reads it and fills the form.",
  scanFile,
  onApply,
  renderPreview,
  disabled = false,
}) => {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewName, setPreviewName] = useState("");
  const uploadRef = useRef(null);
  const cameraRef = useRef(null);

  const runScan = async (file) => {
    if (!file || disabled) return;
    try {
      setScanning(true);
      setPreview(null);
      setPreviewName(file.name);
      const mapped = await scanFile(file);
      setPreview(mapped);
      toast.success("Document scanned — review and apply to form");
    } catch (error) {
      toast.error(error.message || "Scan failed");
      setPreviewName("");
    } finally {
      setScanning(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    runScan(file);
  };

  const handleApply = () => {
    if (!preview || !onApply) return;
    onApply(preview);
    setPreview(null);
    setPreviewName("");
    toast.success("Form updated from scan — please verify all fields");
  };

  return (
    <div className="pi-bill-scan card border-0 shadow-sm mb-3">
      <div className="card-header border-bottom py-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <h6 className="mb-0 fw-bold">
          <i className="fa fa-wand-magic-sparkles me-2 text-primary"></i>
          {title}
        </h6>
        <Badge bg="light" text="dark" className="border">
          {badge}
        </Badge>
      </div>
      <div className="card-body">
        <p className="small text-muted mb-3">{description}</p>

        <div className="pi-bill-scan-actions">
          <input
            ref={uploadRef}
            type="file"
            className="d-none"
            accept="image/*,application/pdf,.pdf"
            onChange={handleFileChange}
            disabled={disabled || scanning}
          />
          <input
            ref={cameraRef}
            type="file"
            className="d-none"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            disabled={disabled || scanning}
          />

          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={disabled || scanning}
            onClick={() => uploadRef.current?.click()}
          >
            <i className="fa fa-file-arrow-up me-1"></i>
            Upload
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            disabled={disabled || scanning}
            onClick={() => cameraRef.current?.click()}
          >
            <i className="fa fa-camera me-1"></i>
            Take Photo
          </button>
          {preview && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                setPreview(null);
                setPreviewName("");
              }}
            >
              Clear
            </button>
          )}
        </div>

        {scanning && (
          <div className="pi-bill-scan-status mt-3">
            <i className="fa fa-spinner fa-spin me-2 text-primary"></i>
            Reading document with AI...
          </div>
        )}

        {preview && !scanning && (
          <div className="pi-bill-scan-preview mt-3">
            <div className="small fw-semibold mb-2">Extracted from {previewName || "document"}</div>
            {renderPreview ? renderPreview(preview) : null}
            <button type="button" className="btn btn-success btn-sm mt-3" onClick={handleApply}>
              <i className="fa fa-check me-1"></i>
              Apply to Form
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiDocumentScanner;
