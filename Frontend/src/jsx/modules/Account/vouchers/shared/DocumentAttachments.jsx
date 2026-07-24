import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { FormSection } from "./voucherFormUi";
import {
  attachmentFileUrl,
  deleteDocumentAttachment,
  formatFileSize,
  getDocumentAttachments,
  uploadDocumentAttachments,
} from "../../documentAttachmentApi";

const ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const fileIcon = (name = "", mime = "") => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return { icon: "fa-file-image", tone: "doc-att-icon-image" };
  }
  if (ext === "pdf" || mime.includes("pdf")) return { icon: "fa-file-pdf", tone: "doc-att-icon-pdf" };
  if (["doc", "docx"].includes(ext)) return { icon: "fa-file-word", tone: "doc-att-icon-word" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { icon: "fa-file-excel", tone: "doc-att-icon-excel" };
  return { icon: "fa-file-lines", tone: "doc-att-icon-default" };
};

const AttachmentFileRow = ({ name, size, status, href, onRemove, readOnly }) => {
  const { icon, tone } = fileIcon(name);

  return (
    <div className={`doc-att-file ${status === "queued" ? "doc-att-file-queued" : ""}`}>
      <div className={`doc-att-file-icon ${tone}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div className="doc-att-file-body">
        <div className="doc-att-file-name text-truncate" title={name}>
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {name}
            </a>
          ) : (
            name
          )}
        </div>
        <div className="doc-att-file-meta">
          {size ? formatFileSize(size) : "—"}
          {status === "queued" && <Badge bg="warning" className="ms-2">Queued</Badge>}
        </div>
      </div>
      {!readOnly && onRemove && (
        <button type="button" className="btn btn-sm doc-att-remove-btn" onClick={onRemove} title="Remove">
          <i className="fa fa-trash"></i>
        </button>
      )}
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-sm doc-att-view-btn" title="Open">
          <i className="fa fa-arrow-up-right-from-square"></i>
        </a>
      )}
    </div>
  );
};

const DocumentAttachments = forwardRef(
  (
    {
      documentType,
      documentId,
      readOnly = false,
      title = "Attach Documents",
      inline = false,
    },
    ref
  ) => {
    const [attachments, setAttachments] = useState([]);
    const [pendingFiles, setPendingFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    const totalCount = attachments.length + pendingFiles.length;

    const loadAttachments = async () => {
      if (!documentType || !documentId) {
        setAttachments([]);
        return;
      }
      try {
        setLoading(true);
        const rows = await getDocumentAttachments(documentType, documentId);
        setAttachments(Array.isArray(rows) ? rows : []);
      } catch (error) {
        toast.error(error.message || "Failed to load attachments");
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      loadAttachments();
    }, [documentType, documentId]);

    const uploadFiles = async (files, targetId = documentId) => {
      if (!targetId || !files.length) return [];
      setUploading(true);
      try {
        const uploaded = await uploadDocumentAttachments(documentType, targetId, files);
        if (Number(targetId) === Number(documentId)) {
          setAttachments((prev) => [...uploaded, ...prev]);
        }
        return uploaded;
      } finally {
        setUploading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      hasPending: () => pendingFiles.length > 0,
      uploadPending: async (targetId) => {
        if (!pendingFiles.length || !targetId) return [];
        const uploaded = await uploadFiles(pendingFiles, targetId);
        setPendingFiles([]);
        return uploaded;
      },
      refresh: loadAttachments,
    }));

    const queueOrUpload = async (files) => {
      if (!files.length) return;

      if (documentId) {
        try {
          await uploadFiles(files);
          toast.success(`${files.length} file(s) uploaded`);
        } catch (error) {
          toast.error(error.message || "Upload failed");
        }
        return;
      }

      setPendingFiles((prev) => [...prev, ...files]);
      toast.info(`${files.length} file(s) queued — will upload when you save`);
    };

    const handleFileSelect = async (event) => {
      const files = Array.from(event.target.files || []);
      event.target.value = "";
      await queueOrUpload(files);
    };

    const handleDrop = async (event) => {
      event.preventDefault();
      setDragOver(false);
      if (readOnly || uploading) return;
      const files = Array.from(event.dataTransfer.files || []);
      await queueOrUpload(files);
    };

    const handleRemovePending = (index) => {
      setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDelete = async (attachment) => {
      if (!window.confirm(`Remove "${attachment.original_name}"?`)) return;
      try {
        await deleteDocumentAttachment(attachment.id);
        setAttachments((prev) => prev.filter((row) => row.id !== attachment.id));
        toast.success("Attachment removed");
      } catch (error) {
        toast.error(error.message || "Failed to remove attachment");
      }
    };

    const content = (
      <div className="doc-att-panel">
        {!readOnly && (
          <div
            className={`doc-att-dropzone ${dragOver ? "doc-att-dropzone-active" : ""} ${uploading ? "doc-att-dropzone-busy" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!uploading) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!uploading) inputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="d-none"
              accept={ACCEPT}
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <div className="doc-att-dropzone-icon">
              <i className={`fa-solid ${uploading ? "fa-spinner fa-spin" : "fa-cloud-arrow-up"}`}></i>
            </div>
            <div className="doc-att-dropzone-text">
              <strong>{uploading ? "Uploading files..." : "Click or drag files here"}</strong>
              <span>PDF, Word, Excel, CSV, images · up to 5 MB each</span>
              {!documentId && (
                <span className="doc-att-dropzone-hint">New records: files upload after you save.</span>
              )}
            </div>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm doc-att-browse-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (!uploading) inputRef.current?.click();
              }}
              disabled={uploading}
            >
              Browse Files
            </button>
          </div>
        )}

        {loading && (
          <div className="doc-att-loading">
            <i className="fa-solid fa-spinner fa-spin me-2"></i>
            Loading attachments...
          </div>
        )}

        {!loading && totalCount > 0 && (
          <div className="doc-att-list">
            {pendingFiles.map((file, index) => (
              <AttachmentFileRow
                key={`pending-${file.name}-${index}`}
                name={file.name}
                size={file.size}
                status="queued"
                readOnly={readOnly}
                onRemove={() => handleRemovePending(index)}
              />
            ))}
            {attachments.map((file) => (
              <AttachmentFileRow
                key={file.id}
                name={file.original_name}
                size={file.file_size}
                href={attachmentFileUrl(file.file_name)}
                readOnly={readOnly}
                onRemove={() => handleDelete(file)}
              />
            ))}
          </div>
        )}

        {!loading && readOnly && totalCount === 0 && (
          <div className="doc-att-empty-inline">No documents attached.</div>
        )}
      </div>
    );

    if (inline) {
      return (
        <div className="doc-att-inline">
          <div className="doc-att-inline-head">
            <h6 className="mb-0 fw-bold">
              <i className="fa fa-paperclip me-2 text-primary"></i>
              {title}
              {totalCount > 0 && (
                <Badge bg="primary" pill className="ms-2 doc-att-count">
                  {totalCount}
                </Badge>
              )}
            </h6>
          </div>
          {content}
        </div>
      );
    }

    return (
      <FormSection title={title} icon="fa fa-paperclip" className="doc-att-section mb-3">
        {content}
      </FormSection>
    );
  }
);

DocumentAttachments.displayName = "DocumentAttachments";

export default DocumentAttachments;
