import {
  TALLY_API_MANUAL,
  TALLY_MANUAL_FILENAME,
  TALLY_MANUAL_PDF_FILENAME,
} from "../docs/tallyApiManual.js";
import { generateTallyManualPdf } from "../utils/tallyManualPdf.js";

const MANUAL_META = {
  title: "KLK Expense — Tally Integration API Manual",
  version: "1.1",
  updated_at: "2026-08-06",
};

export const getTallyManual = async (req, res) => {
  return res.json({
    success: true,
    data: {
      ...MANUAL_META,
      filename: TALLY_MANUAL_PDF_FILENAME,
      content: TALLY_API_MANUAL,
    },
  });
};

export const downloadTallyManual = async (req, res) => {
  try {
    const pdfBuffer = await generateTallyManualPdf(TALLY_API_MANUAL, MANUAL_META);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${TALLY_MANUAL_PDF_FILENAME}"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Tally manual PDF generation failed:", error);
    return res.status(500).json({ message: "Failed to generate PDF manual" });
  }
};
