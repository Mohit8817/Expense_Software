import { body, validationResult } from "express-validator";

export const createAdvanceExpenseValidator = async (req, res, next) => {
  await Promise.all([
    body("user_id")
      .notEmpty().withMessage("User is required")
      .bail()
      .isInt().withMessage("User must be valid ID")
      .run(req),
    body("project_id")
    .optional()
      .notEmpty().withMessage("Project is required")
      .bail()
      .isInt().withMessage("Project must be valid ID")
      .run(req),

    body("amount")
      .notEmpty().withMessage("Amount is required")
      .bail()
      .isFloat({ gt: 0 }).withMessage("Amount must be greater than 0")
      .toFloat()
      .run(req),

    body("payment_mode")
      .notEmpty().withMessage("Payment mode is required")
      .run(req),
    body("payment_date")
      .notEmpty().withMessage("Payment date is required")
      .isISO8601().withMessage("Invalid date format (YYYY-MM-DD)")
      .toDate()
      .run(req),
    body("reference_no")
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage("Reference max 200 chars")
      .run(req),

    body("remarks")
      .optional()
      .trim()
      .isLength({ max: 255 }).withMessage("Remarks max 255 chars")
      .run(req),

  ]);

  // ✅ File Validation (REQUIRED)
  const fileErrors = [];

if (req.file) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      fileErrors.push({
        field: "doc_file",
        message: "Only JPG, PNG, PDF, DOC, DOCX files allowed",
      });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      fileErrors.push({
        field: "doc_file",
        message: "File must be less than 5MB",
      });
    }
  }

  // ✅ Combine errors
  const errors = validationResult(req);

  const allErrors = [
    ...errors.array().map(err => ({
      field: err.path,
      location: err.location,
      message: err.msg,
    })),
    ...fileErrors,
  ];

  if (allErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: allErrors,
    });
  }

  next();
};

export const settlementExpensesValidator = async (req, res, next) => {
  await Promise.all([
    body("user_id")
      .notEmpty().withMessage("User is required")
      .bail()
      .isInt().withMessage("User must be valid ID")
      .run(req),
    body("amount")
      .notEmpty().withMessage("Amount is required")
      .bail()
      .isFloat({ gt: 0 }).withMessage("Amount must be greater than 0")
      .toFloat()
      .run(req),
    body("remarks")
      .optional()
      .trim()
      .isLength({ max: 255 }).withMessage("Remarks max 255 chars")
      .run(req),
  ]);

  const errors = validationResult(req);

  if (errors.array().length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  next();
};