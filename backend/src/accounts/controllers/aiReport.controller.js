import {
  buildAiReportContext,
  generateAiReportAnswer,
} from "../utils/aiReportContext.js";

export const askAiReport = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    if (!company_id) {
      return res.status(401).json({ message: "Unauthorized — company not found in session" });
    }

    const { question, from, to } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    if (question.trim().length > 2000) {
      return res.status(400).json({ message: "Question is too long (max 2000 characters)" });
    }

    const context = await buildAiReportContext(company_id, { from, to });
    const answer = await generateAiReportAnswer(question.trim(), context);

    return res.json({
      success: true,
      data: {
        answer,
        company_id,
        date_range: context.date_range,
      },
    });
  } catch (error) {
    console.error("AI Report error:", error);
    return res.status(500).json({
      message: error.message || "Failed to generate AI report answer",
    });
  }
};
