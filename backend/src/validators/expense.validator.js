import { body, validationResult } from "express-validator";

export const createExpenseValidator = async (req, res, next) => {
  await Promise.all([

    body("project_name")
      .notEmpty().withMessage("Project is required")
      .bail()
      .isInt().withMessage("Project must be valid ID")
      .run(req),

    body("project_state")
      .notEmpty().withMessage("State is required")
      .trim()
      .run(req),

    body("project_district")
      .notEmpty().withMessage("District is required")
      .trim()
      .run(req),

    body("project_village")
      .notEmpty().withMessage("Village is required")
      .trim()
      .run(req),

    body("intervention")
      .notEmpty().withMessage("Intervention is required")
      .bail()
      .isInt().withMessage("Intervention must be numeric")
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
      .isLength({ max: 255 }).withMessage("Remarks max 255 characters")
      .run(req),

  ]);

  const fileErrors = [];

  if (!req.file) {
    fileErrors.push({
      field: "document",
      message: "Document is required",
    });
  } else {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      fileErrors.push({
        field: "document",
        message: "Only JPG, PNG, PDF, DOC, DOCX files are allowed",
      });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      fileErrors.push({
        field: "document",
        message: "File must be less than 5MB",
      });
    }
  }

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