import React, { useEffect, useMemo, useState } from "react";
import { Card, Col, Accordion, Badge, Button } from "react-bootstrap";
import PageTitle from "../../layouts/PageTitle";
import { downloadTallyManual, getTallyManual } from "./developerApi";

function renderInlineMarkdown(text) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="manual-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function ManualBlock({ block }) {
  if (block.type === "heading") {
    const Tag = `h${Math.min(block.level + 2, 6)}`;
    return <Tag className="manual-heading">{block.text}</Tag>;
  }

  if (block.type === "table") {
    return (
      <div className="table-responsive mb-3">
        <table className="table table-bordered table-sm manual-table">
          <thead>
            <tr>
              {block.headers.map((h) => (
                <th key={h}>{renderInlineMarkdown(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci}>{renderInlineMarkdown(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === "code") {
    return (
      <pre className="manual-code-block">
        <code>{block.text}</code>
      </pre>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="manual-list">
        {block.items.map((item, i) => (
          <li key={i}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
  }

  if (block.type === "quote") {
    return <blockquote className="manual-quote">{renderInlineMarkdown(block.text)}</blockquote>;
  }

  if (block.type === "hr") {
    return <hr className="manual-hr" />;
  }

  return <p className="manual-paragraph">{renderInlineMarkdown(block.text)}</p>;
}

function parseMarkdownSections(markdown) {
  const lines = markdown.split("\n");
  const sections = [];
  let current = null;
  let codeBuffer = null;
  let tableBuffer = null;

  const flushParagraph = (text) => {
    if (!text.trim() || !current) return;
    current.blocks.push({ type: "paragraph", text: text.trim() });
  };

  let paragraph = "";

  const pushSection = (title, level) => {
    if (current) sections.push(current);
    current = { title, level, blocks: [] };
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (codeBuffer) {
        current?.blocks.push({ type: "code", text: codeBuffer.join("\n") });
        codeBuffer = null;
      } else {
        flushParagraph(paragraph);
        paragraph = "";
        codeBuffer = [];
      }
      continue;
    }

    if (codeBuffer) {
      codeBuffer.push(line);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      flushParagraph(paragraph);
      paragraph = "";
      pushSection(headingMatch[2].trim(), headingMatch[1].length);
      continue;
    }

    if (line.trim() === "---") {
      flushParagraph(paragraph);
      paragraph = "";
      current?.blocks.push({ type: "hr" });
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph(paragraph);
      paragraph = "";
      current?.blocks.push({ type: "quote", text: line.slice(2).trim() });
      continue;
    }

    if (line.startsWith("|")) {
      flushParagraph(paragraph);
      paragraph = "";
      if (!tableBuffer) tableBuffer = { headers: [], rows: [] };
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) continue;
      if (!tableBuffer.headers.length) tableBuffer.headers = cells;
      else tableBuffer.rows.push(cells);
      continue;
    }

    if (tableBuffer) {
      current?.blocks.push({ type: "table", ...tableBuffer });
      tableBuffer = null;
    }

    if (line.startsWith("- ")) {
      flushParagraph(paragraph);
      paragraph = "";
      const items = [line.slice(2).trim()];
      current?.blocks.push({ type: "list", items });
      continue;
    }

    if (!line.trim()) {
      flushParagraph(paragraph);
      paragraph = "";
      continue;
    }

    paragraph += (paragraph ? " " : "") + line.trim();
  }

  flushParagraph(paragraph);
  if (tableBuffer && current) current.blocks.push({ type: "table", ...tableBuffer });
  if (current) sections.push(current);

  return sections.filter((s) => s.title && !s.title.includes("Table of Contents"));
}

const TallyManual = () => {
  const [manual, setManual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getTallyManual();
        setManual(data);
      } catch (err) {
        setError(err.message || "Failed to load manual");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sections = useMemo(
    () => (manual?.content ? parseMarkdownSections(manual.content) : []),
    [manual]
  );

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadTallyManual();
    } catch (err) {
      alert(err.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <p>Loading Tally manual...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <>
      <PageTitle activeMenu="Tally API Manual" motherMenu="Settings" />

      <Col lg={12}>
        <Card className="tally-manual-card">
          <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <Card.Title className="mb-1">{manual.title}</Card.Title>
              <div className="d-flex gap-2 align-items-center">
                <Badge bg="primary">v{manual.version}</Badge>
                <span className="text-muted small">Updated {manual.updated_at}</span>
              </div>
            </div>
            <Button variant="success" onClick={handleDownload} disabled={downloading}>
              <i className="fa fa-download me-2" />
              {downloading ? "Downloading..." : "Download Manual (PDF)"}
            </Button>
          </Card.Header>

          <Card.Body>
            <p className="text-muted">
              Complete reference for all <code>/api/tally</code> endpoints — export, import,
              update, delete, and mark-as-pushed workflows. This page is visible to developer
              users only.
            </p>

            <Accordion defaultActiveKey="0" alwaysOpen className="tally-manual-accordion">
              {sections.map((section, index) => (
                <Accordion.Item eventKey={String(index)} key={section.title}>
                  <Accordion.Header>{section.title}</Accordion.Header>
                  <Accordion.Body>
                    {section.blocks.map((block, bi) => (
                      <ManualBlock key={bi} block={block} />
                    ))}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </Card.Body>
        </Card>
      </Col>

      <style>{`
        .tally-manual-card .manual-code-block {
          background: #1e1e2d;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 13px;
        }
        .tally-manual-card .manual-inline-code {
          background: rgba(13, 110, 253, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .tally-manual-card .manual-table th {
          background: #f8f9fa;
          white-space: nowrap;
        }
        .tally-manual-card .manual-quote {
          border-left: 4px solid #0d6efd;
          padding-left: 1rem;
          color: #495057;
          margin: 1rem 0;
        }
        .tally-manual-card .manual-heading {
          margin-top: 1rem;
          margin-bottom: 0.75rem;
        }
        .tally-manual-accordion .accordion-button {
          font-weight: 600;
        }
      `}</style>
    </>
  );
};

export default TallyManual;
