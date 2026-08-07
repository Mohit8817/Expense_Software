import PDFDocument from "pdfkit";

const PAGE_MARGIN = 50;
const CONTENT_WIDTH = 595.28 - PAGE_MARGIN * 2; // A4 width pt

function stripMarkdownInline(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function ensureSpace(doc, needed = 40) {
  if (doc.y + needed > doc.page.height - PAGE_MARGIN) {
    doc.addPage();
  }
}

function writeWrappedText(doc, text, options = {}) {
  const {
    font = "Helvetica",
    fontSize = 10,
    indent = 0,
    color = "#222222",
    lineGap = 3,
  } = options;

  ensureSpace(doc, fontSize * 2);
  doc.font(font).fontSize(fontSize).fillColor(color);
  doc.text(stripMarkdownInline(text), PAGE_MARGIN + indent, doc.y, {
    width: CONTENT_WIDTH - indent,
    lineGap,
  });
}

function writeHeading(doc, text, level) {
  const sizes = { 1: 18, 2: 14, 3: 12, 4: 11 };
  const size = sizes[level] || 11;
  ensureSpace(doc, size + 16);
  doc.moveDown(level === 1 ? 0.6 : 0.4);
  doc
    .font("Helvetica-Bold")
    .fontSize(size)
    .fillColor(level <= 2 ? "#0d47a1" : "#1565c0")
    .text(stripMarkdownInline(text), PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });
  doc.moveDown(0.3);
}

function writeCodeBlock(doc, code) {
  const lines = code.split("\n");
  const fontSize = 8;
  const lineHeight = fontSize + 4;
  const blockHeight = lines.length * lineHeight + 16;

  ensureSpace(doc, Math.min(blockHeight, doc.page.height - PAGE_MARGIN * 2));

  const startY = doc.y;
  doc
    .rect(PAGE_MARGIN, startY, CONTENT_WIDTH, blockHeight)
    .fillAndStroke("#f4f6f8", "#d0d7de");

  let y = startY + 8;
  doc.font("Courier").fontSize(fontSize).fillColor("#1e1e2d");

  for (const line of lines) {
    if (y + lineHeight > doc.page.height - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN + 8;
      doc
        .rect(PAGE_MARGIN, PAGE_MARGIN, CONTENT_WIDTH, blockHeight)
        .fillAndStroke("#f4f6f8", "#d0d7de");
    }
    doc.text(line || " ", PAGE_MARGIN + 8, y, { lineBreak: false, width: CONTENT_WIDTH - 16 });
    y += lineHeight;
  }

  doc.y = startY + blockHeight + 8;
  doc.fillColor("#222222");
}

function writeTable(doc, headers, rows) {
  const colCount = headers.length;
  const colWidth = CONTENT_WIDTH / colCount;
  const cellPadding = 4;
  const fontSize = 8;
  const rowHeight = fontSize + cellPadding * 2 + 4;

  ensureSpace(doc, rowHeight * 2);

  let startY = doc.y;

  const drawRow = (cells, isHeader = false) => {
    if (startY + rowHeight > doc.page.height - PAGE_MARGIN) {
      doc.addPage();
      startY = PAGE_MARGIN;
    }

    if (isHeader) {
      doc.rect(PAGE_MARGIN, startY, CONTENT_WIDTH, rowHeight).fill("#e3f2fd");
    } else {
      doc.rect(PAGE_MARGIN, startY, CONTENT_WIDTH, rowHeight).stroke("#dee2e6");
    }

    cells.forEach((cell, i) => {
      doc
        .font(isHeader ? "Helvetica-Bold" : "Helvetica")
        .fontSize(fontSize)
        .fillColor("#222222")
        .text(stripMarkdownInline(cell), PAGE_MARGIN + i * colWidth + cellPadding, startY + cellPadding, {
          width: colWidth - cellPadding * 2,
          height: rowHeight,
          ellipsis: true,
        });
    });

    startY += rowHeight;
  };

  drawRow(headers, true);
  rows.forEach((row) => drawRow(row));
  doc.y = startY + 6;
}

function writeList(doc, items) {
  items.forEach((item) => {
    writeWrappedText(doc, `• ${item}`, { indent: 10, fontSize: 10 });
  });
  doc.moveDown(0.2);
}

function parseAndRenderMarkdown(doc, markdown) {
  const lines = markdown.split("\n");
  let i = 0;
  let paragraph = "";
  let codeBuffer = null;
  let tableBuffer = null;

  const flushParagraph = () => {
    if (paragraph.trim()) {
      writeWrappedText(doc, paragraph.trim());
      paragraph = "";
      doc.moveDown(0.2);
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (codeBuffer) {
        flushParagraph();
        writeCodeBlock(doc, codeBuffer.join("\n"));
        codeBuffer = null;
      } else {
        flushParagraph();
        codeBuffer = [];
      }
      i += 1;
      continue;
    }

    if (codeBuffer) {
      codeBuffer.push(line);
      i += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      flushParagraph();
      writeHeading(doc, headingMatch[2], headingMatch[1].length);
      i += 1;
      continue;
    }

    if (line.trim() === "---") {
      flushParagraph();
      ensureSpace(doc, 12);
      doc
        .moveTo(PAGE_MARGIN, doc.y)
        .lineTo(PAGE_MARGIN + CONTENT_WIDTH, doc.y)
        .strokeColor("#cccccc")
        .stroke();
      doc.moveDown(0.5);
      i += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      writeWrappedText(doc, line.slice(2), { color: "#555555", indent: 8 });
      i += 1;
      continue;
    }

    if (line.startsWith("|")) {
      flushParagraph();
      if (!tableBuffer) tableBuffer = { headers: [], rows: [] };
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) {
        i += 1;
        continue;
      }
      if (!tableBuffer.headers.length) tableBuffer.headers = cells;
      else tableBuffer.rows.push(cells);
      i += 1;
      continue;
    }

    if (tableBuffer) {
      writeTable(doc, tableBuffer.headers, tableBuffer.rows);
      tableBuffer = null;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      const items = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2).trim());
        i += 1;
      }
      writeList(doc, items);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      i += 1;
      continue;
    }

    paragraph += (paragraph ? " " : "") + line.trim();
    i += 1;
  }

  flushParagraph();
  if (tableBuffer) writeTable(doc, tableBuffer.headers, tableBuffer.rows);
}

export function generateTallyManualPdf(markdown, meta = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
      info: {
        Title: meta.title || "KLK Tally API Manual",
        Author: "KLK Ventures",
        Subject: "Tally Integration API Documentation",
      },
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Cover
    doc.font("Helvetica-Bold").fontSize(22).fillColor("#0d47a1");
    doc.text(meta.title || "KLK Expense — Tally Integration API Manual", {
      align: "center",
    });
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).fillColor("#555555");
    doc.text(`Version ${meta.version || "1.0"}  •  Updated ${meta.updated_at || ""}`, {
      align: "center",
    });
    doc.moveDown(1.5);

    parseAndRenderMarkdown(doc, markdown);

    // Page numbers
    const range = doc.bufferedPageRange();
    for (let p = range.start; p < range.start + range.count; p += 1) {
      doc.switchToPage(p);
      doc.font("Helvetica").fontSize(8).fillColor("#999999");
      doc.text(
        `Page ${p + 1} of ${range.count}`,
        PAGE_MARGIN,
        doc.page.height - PAGE_MARGIN + 15,
        { align: "center", width: CONTENT_WIDTH }
      );
    }

    doc.end();
  });
}
