import { PrismaClient } from "@prisma/client";
import PDFDocument from "pdfkit";
const prisma = new PrismaClient();


export const getExpenseFormData = async (req, res) => {
    try {
        const company_id = req.user?.company_id;

        if (!company_id) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        // ✅ Fetch Projects
        const projects = await prisma.project.findMany({
            where: {
                company_id: company_id,
                status: true,
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        // ✅ Fetch Interventions
        const interventions = await prisma.intervention.findMany({
            where: {
                company_id: company_id,
                status: true,
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        return res.status(200).json({
            projects,
            interventions,
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const createExpense = async (req, res) => {
  try {
    const {
      project_name,
      project_state,
      project_district,
      project_village,
      intervention,
      amount,
    } = req.body;

    const company_id = req.user.company_id; 
    const created_by = req.user.email;
    const requested_by = req.user.id;

        // ✅ Financial Year Function
        const getFinancialYear = () => {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;

      return month >= 4 
        ? `${year}-${year + 1}` 
        : `${year - 1}-${year}`;
    };

        const financial_year = getFinancialYear();

        // ✅ Get Manager from Project
        const manager_project_id = await prisma.project.findFirst({
            where: {
                id: parseInt(project_name),
            },
            select: {
                manager_id: true,
            },
        });

        if (!manager_project_id) {
            return res.status(404).json({
                message: "Project not found",
            });
        }

        let document = null;

        if (req.file) {
            document = req.file.filename;
        }

    // ✅ Create Expense
    const expense = await prisma.expensePayment.create({
      data: {
        company_id,
        project_name,
        project_state,
        project_district,
        project_village,
        intervention: parseInt(intervention),
        amount: Number(amount),
        manager_id: parseInt(manager_project_id.manager_id),
        requested_by,
        created_by,
        document,
        financial_year, 
      },
    });

        return res.status(201).json({
            message: "Expense created successfully",
            data: expense,
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};


export const getMyCreatedExpenses = async (req, res) => {
    try {
        const company_id = req.user?.company_id;
        const user_id = req.user?.id;

        if (!company_id || !user_id) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const [expenses, projects, users, interventions] = await Promise.all([
            prisma.expensePayment.findMany({
                where: {
                    company_id,
                    requested_by: user_id,
                },
                orderBy: {
                    created_at: "desc",
                },
            }),

            prisma.project.findMany({
                where: { company_id },
                select: { id: true, name: true },
            }),

            prisma.user.findMany({
                where: { company_id },
                select: { id: true, username: true },
            }),

            prisma.intervention.findMany({
                where: { company_id },
                select: { id: true, name: true },
            }),
        ]);

        // ✅ MAPS
        const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]));
        const userMap = Object.fromEntries(users.map(u => [u.id, u.username]));
        const interventionMap = Object.fromEntries(interventions.map(i => [i.id, i.name]));

        // ✅ STATUS HELPERS
        const getStatusText = (status) => {
            const s = Number(status);
            if (s === 1) return "Approved";
            if (s === 2) return "Rejected";
            return "Pending";
        };

        const getPaymentStatusText = (status) => {
            const s = Number(status);
            if (s === 2) return "Paid";
            if (s === 1) return "Partially Paid";
            return "Pending";
        };

        // ✅ SAFE PARSER
        const safeId = (val) => {
            const n = Number(val);
            return isNaN(n) ? null : n;
        };

        const mappedExpenses = expenses.map((exp) => {
            const projectId = safeId(exp.project_name);
            const interventionId = safeId(exp.intervention);
            const managerId = safeId(exp.manager_id);
            const userId = safeId(exp.requested_by);

            return {
                id: exp.id,

                project_name:
                    projectId !== null
                        ? projectMap[projectId] || "N/A"
                        : exp.project_name || "N/A",

                intervention_name:
                    interventionId !== null
                        ? interventionMap[interventionId] || "N/A"
                        : exp.intervention || "N/A",

                state: exp.project_state,
                district: exp.project_district,
                village: exp.project_village,

        amount: exp.amount,
        document: exp.document,
        created_at: exp.created_at,

                raised_by: userMap[userId] || "N/A",
                manager_name: userMap[managerId] || "N/A",

                final_approved_amount: exp.final_approved_amount ?? 0,
                payment_amount: exp.paid_amount ?? 0,

                reviewer_status: getStatusText(exp.reviewer_approval_status),
                approval_status: getStatusText(exp.approval_status),

                payment_status: getPaymentStatusText(exp.payment_status),
            };
        });

        return res.status(200).json(mappedExpenses);

    } catch (error) {
        console.error("Error in getMyCreatedExpenses:", error);

        return res.status(500).json({
            message: error.message,
        });
    }
};



export const deleteExpense = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const existing = await prisma.expensePayment.findUnique({
      where: { id, approval_status: 0 }
    });

    if (!existing) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const deletedExpense = await prisma.expensePayment.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Expense deleted successfully",
      data: deletedExpense,
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: error.message });
  }
};






export const deleteExpense = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "Invalid expense ID" });
        }

        const existing = await prisma.expensePayment.findUnique({
            where: { id, approval_status: 0 }
        });

        if (!existing) {
            return res.status(404).json({ message: "Expense not found" });
        }

        const deletedExpense = await prisma.expensePayment.delete({
            where: { id },
        });

        res.status(200).json({
            message: "Expense deleted successfully",
            data: deletedExpense,
        });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getManagerExpenses = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const manager_id = req.user?.id;

    if (!company_id || !manager_id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

const [expenses, projects, interventions, users] = await Promise.all([      

      prisma.expensePayment.findMany({
        where: {
          company_id,
          manager_id: Number(manager_id),
        },
        orderBy: {
          created_at: "desc",
        },
      }),

            prisma.project.findMany({
                where: { company_id },
                select: { id: true, name: true },
            }),

            prisma.intervention.findMany({
                where: { company_id },
                select: { id: true, name: true },
            }),

            prisma.user.findMany({
                where: { company_id },
                select: { id: true, username: true, email: true },
            }),
        ]);

        // ✅ Maps
        const projectMap = Object.fromEntries(
            projects.map((p) => [p.id, p.name])
        );

        const interventionMap = Object.fromEntries(
            interventions.map((i) => [i.id, i.name])
        );

       const userMap = Object.fromEntries(
      users.map((u) => [u.id, u.username])
    );


    // ✅ Status converter
        const getStatusText = (status) => {
      if (Number(status) === 1) return "Approved";
      if (Number(status) === 2) return "Rejected";
      return "Pending";
    };

    // ✅ Final Response
   const result = expenses.map((exp) => ({
  id: exp.id,

  project: projectMap[Number(exp.project_name)] || "N/A",

  intervention:
    interventionMap[Number(exp.intervention)] || "N/A",

  state: exp.project_state,
  district: exp.project_district,
  village: exp.project_village,
  amount: exp.amount,


  // ✅ CLEAN & CORRECT
  raised_by: userMap[Number(exp.requested_by)] || "N/A",
  manager_name: userMap[Number(exp.manager_id)] || "N/A",
  reviewer_name: userMap[Number(exp.reviewer_id)] || "N/A",
  document: exp.document,

  review_assign: exp.review_assign,
  managertoreviewer: exp.managertoreviewer,
  approved_amount: exp.approved_amount || "N/A",
  reviewer_approval_status: Number(exp.reviewer_approval_status), // raw value
  reviewer_approval_text: getStatusText(exp.reviewer_approval_status), // label
  reviewer_remarks: exp.reviewer_remarks || "N/A",


  status: getStatusText(exp.approval_status),
}));

        return res.status(200).json(result);

  } catch (error) {
    console.log(error); 
    return res.status(500).json({
      message: error.message,
    });
  }
};


export const getReviewers = async (req, res) => {
    try {
        const company_id = req.user?.company_id;

    if (!company_id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const reviewers = await prisma.user.findMany({
      where: {
        company_id: company_id,
        status: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
      orderBy: {
        username: "asc",
      },
    });

        return res.status(200).json(reviewers);

    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};


export const assignReviewer = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { reviewer_id, managertoreviewer } = req.body;

        const updated = await prisma.expensePayment.update({
            where: { id },
            data: {
                reviewer_id: reviewer_id,
                managertoreviewer: managertoreviewer || "",
                review_assign: true,
            },
        });
        return res.status(200).json({
            message: "Reviewer Assigned Successfully",
            data: updated,
        });

  } catch (error) {
  console.log("ERROR 👉", error); // 👈 IMPORTANT
  return res.status(500).json({
    message: error.message,
  });
}
};


export const getReviewerExpenses = async (req, res) => {
    try {
        const company_id = req.user?.company_id;
        const reviewer_id = req.user?.id;

        if (!company_id || !reviewer_id) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const [expenses, projects, users, interventions] = await Promise.all([
            prisma.expensePayment.findMany({
                where: {
                    company_id,
                    reviewer_id: Number(reviewer_id),
                },
                orderBy: {
                    created_at: "desc",
                },
            }),

            prisma.project.findMany({
                where: { company_id },
                select: { id: true, name: true },
            }),

            prisma.user.findMany({
                where: { company_id },
                select: { id: true, username: true, email: true },
            }),

            prisma.intervention.findMany({
                where: { company_id },
                select: { id: true, name: true },
            }),
        ]);

        // ✅ Maps
        const projectMap = Object.fromEntries(
            projects.map((p) => [p.id, p.name])
        );

        const userMap = Object.fromEntries(
            users.map((u) => [u.id, u.username])
        );

        const emailMap = Object.fromEntries(
            users.map((u) => [u.email, u.username]) // 👈 for created_by
        );

        const interventionMap = Object.fromEntries(
            interventions.map((i) => [i.id, i.name])
        );

        const getStatusText = (status) => {
            if (status === 1) return "Approved";
            if (status === 2) return "Rejected";
            return "Pending";
        };

        // ✅ FINAL RESPONSE
        const result = expenses.map((exp) => ({
            id: exp.id,

            project: projectMap[Number(exp.project_name)] || "N/A",

            intervention:
                interventionMap[Number(exp.intervention)] || "N/A",

            state: exp.project_state,
            district: exp.project_district,
            village: exp.project_village,
            amount: exp.amount,
            document: exp.document,

            // ✅ ALL 3 NAMES
            raised_by: userMap[exp.requested_by] || exp.requested_by || "N/A",
            manager_name: userMap[exp.manager_id] || "N/A",
            reviewer_name: userMap[exp.reviewer_id] || "N/A",

            manager_remark: exp.managertoreviewer,
            reviewer_remarks: exp.reviewer_remarks,
            approved_amount: exp.approved_amount,

            reviewer_status: getStatusText(exp.reviewer_approval_status),

            created_at: exp.created_at,
        }));

        return res.status(200).json(result);

    } catch (error) {
        console.log(error); // 🔥 always log
        return res.status(500).json({
            message: error.message,
        });
    }
};


export const reviewerApprove = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const reviewer_id = req.user?.id;

        const {
            reviewer_approval_status,
            reviewer_remarks,
            approved_amount,
        } = req.body;

        const existing = await prisma.expensePayment.findUnique({
            where: { id },
        });

        if (!existing) {
            return res.status(404).json({ message: "Expense not found" });
        }

        const approvedAmt = approved_amount
            ? Number(approved_amount)
            : existing.amount;

        let amountChangeBy = null;

        if (approvedAmt !== existing.amount) {
            amountChangeBy = reviewer_id;
        }

        const updated = await prisma.expensePayment.update({
            where: { id },
            data: {
                reviewer_status: true,
                reviewer_approval_status: Number(reviewer_approval_status),
                reviewer_remarks,
                approved_amount: approvedAmt,
                amount_change_by: amountChangeBy,
            },
        });

        return res.status(200).json({
            message: "Review submitted successfully",
            data: updated,
        });

    } catch (error) {
        console.log("ERROR:", error); // 👈 VERY IMPORTANT
        return res.status(500).json({
            message: error.message,
        });
    }
};


export const managerApproveExpense = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            approval_status,
            manager_remarks,
            final_approved_amount,
        } = req.body;

        // ✅ Validate
        if (!approval_status) {
            return res.status(400).json({
                message: "Approval status is required",
            });
        }

        // ✅ Get existing expense
        const expense = await prisma.expensePayment.findUnique({
            where: { id: Number(id) },
        });

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found",
            });
        }

        // ✅ Final Amount Logic (IMPORTANT)
        let finalAmount = Number(final_approved_amount);

        if (Number(approval_status) === 2) {
            // Rejected
            finalAmount = 0;
        }

        // ✅ Update
        const updated = await prisma.expensePayment.update({
            where: { id: Number(id) },
            data: {
                approval_status: Number(approval_status),
                manager_remarks,
                final_approved_amount: finalAmount,
            },
        });

        return res.json({
            message: "Manager approval updated successfully",
            data: updated,
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};


export const getAccountsExpenses = async (req, res) => {
  try {
    const company_id = req.user.company_id;

    // ✅ Fetch only Manager Approved
    const expenses = await prisma.expensePayment.findMany({
      where: {
        company_id,
        approval_status: 1, // ✅ KEY CONDITION
      },
      orderBy: {
        created_at: "desc",
      },
    });

        // ✅ Fetch related data
        const [projects, interventions, users] = await Promise.all([
            prisma.project.findMany({
                where: { company_id },
                select: { id: true, name: true },
            }),
            prisma.intervention.findMany({
                where: { company_id },
                select: { id: true, name: true },
            }),
            prisma.user.findMany({
                where: { company_id },
                select: { id: true, username: true },
            }),
        ]);

        // ✅ Maps
        const projectMap = Object.fromEntries(
            projects.map((p) => [p.id, p.name])
        );

        const interventionMap = Object.fromEntries(
            interventions.map((i) => [i.id, i.name])
        );

        const userMap = Object.fromEntries(
            users.map((u) => [u.id, u.username])
        );

        // ✅ Status helper
        const getStatusText = (status) => {
            if (status === 1) return "Approved";
            if (status === 2) return "Rejected";
            return "Pending";
        };

    // ✅ Final Response
  const result = expenses.map((exp) => ({
  id: exp.id,

  project: projectMap[Number(exp.project_name)] || "N/A",
  intervention: interventionMap[Number(exp.intervention)] || "N/A",

  state: exp.project_state,
  district: exp.project_district,
  village: exp.project_village,

  amount: exp.amount,
  requested_date: exp.requested_date,
  document: exp.document,

  // ✅ IMPORTANT
  final_approved_amount: exp.final_approved_amount,
  paid_amount: exp.paid_amount || 0,              // 🔥 ADD THIS
  payment_status: exp.payment_status || 0,        // 🔥 ADD THIS

  // ✅ USERS
  raised_by: userMap[Number(exp.requested_by)] || "N/A",
  manager_name: userMap[Number(exp.manager_id)] || "N/A",

  // ✅ STATUS
  manager_status: getStatusText(exp.approval_status),
}));

        return res.json(result);

    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};


export const processPayment = async (req, res) => {
    try {
        const expense_id = Number(req.params.id);

        const {
            payment_amount,
            payment_mode,
            payment_date,
            reference_no,
            remarks,
        } = req.body;

        const accountant_id = req.user.id;

        // ✅ 1. Get Expense
        const expense = await prisma.expensePayment.findUnique({
            where: { id: expense_id },
        });

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        const finalAmount = expense.final_approved_amount;

        // ✅ 2. Calculate new paid amount
        const newPaidAmount = (expense.paid_amount || 0) + Number(payment_amount);

        // ❌ Prevent overpayment
        if (newPaidAmount > finalAmount) {
            return res.status(400).json({
                message: "Payment exceeds approved amount",
            });
        }

        // ✅ 3. Create Transaction
        await prisma.expensePaymentTransaction.create({
            data: {
                expense_id,
                accountant_id,
                payment_amount: Number(payment_amount),
                payment_mode,
                payment_date: new Date(payment_date),
                reference_no,
                remarks,
            },
        });

        // ✅ 4. Decide Payment Status
        let payment_status = 0; // Unpaid

        if (newPaidAmount === finalAmount) {
            payment_status = 2; // Fully Paid
        } else if (newPaidAmount > 0) {
            payment_status = 1; // Partially Paid
        }

        // ✅ 5. Update ExpensePayment table
        await prisma.expensePayment.update({
            where: { id: expense_id },
            data: {
                paid_amount: newPaidAmount,
                payment_status,
            },
        });

        return res.status(200).json({
            message: "Payment processed successfully",
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error.message,
        });
    }
};


export const getPaymentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const company_id = req.user.company_id;

        // ✅ Fetch Transactions
        const transactions = await prisma.expensePaymentTransaction.findMany({
            where: { expense_id: Number(id) },
            orderBy: { created_at: "desc" },
        });

        // ✅ Fetch Users
        const users = await prisma.user.findMany({
            where: { company_id },
            select: { id: true, username: true },
        });

        // ✅ Create Map
        const userMap = Object.fromEntries(
            users.map((u) => [u.id, u.username])
        );

        // ✅ Final Response
        const result = transactions.map((t) => ({
            id: t.id,
            payment_amount: t.payment_amount,
            payment_mode: t.payment_mode,
            payment_date: t.payment_date,
            reference_no: t.reference_no,
            remarks: t.remarks,

            // ✅ MAPPED NAME
            accountant_name: userMap[Number(t.accountant_id)] || "N/A",
        }));

        res.json(result);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const paymentReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        const company_id = req.user.company_id;

        // ✅ Get Expense
        const expense = await prisma.expensePayment.findFirst({
            where: {
                id: Number(id),
                company_id,
            },
        });

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        // ✅ Fetch Transactions
        const transactions = await prisma.expensePaymentTransaction.findMany({
            where: { expense_id: Number(id) },
            orderBy: { created_at: "asc" },
        });

        // ✅ Fetch related data
        const [projects, interventions, users] = await Promise.all([
            prisma.project.findMany({
                where: { company_id },
                select: { id: true, name: true },
            }),
            prisma.intervention.findMany({
                where: { company_id },
                select: { id: true, name: true },
            }),
            prisma.user.findMany({
                where: { company_id },
                select: { id: true, username: true },
            }),
        ]);

        // ✅ Maps
        const projectMap = Object.fromEntries(
            projects.map((p) => [p.id, p.name])
        );

        const interventionMap = Object.fromEntries(
            interventions.map((i) => [i.id, i.name])
        );

        const userMap = Object.fromEntries(
            users.map((u) => [u.id, u.username])
        );

        // ✅ Calculations
        const totalPaid = transactions.reduce(
            (sum, t) => sum + Number(t.payment_amount),
            0
        );

        const remaining =
            Number(expense.final_approved_amount || expense.amount) - totalPaid;

        // ✅ PDF INIT
        const doc = new PDFDocument({ margin: 40, size: "A4" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=receipt-${id}.pdf`);

        doc.pipe(res);

        // ================= HEADER =================
        doc
            .fontSize(20)
            .fillColor("#333")
            .text("PAYMENT RECEIPT", { align: "center" });

        doc.moveDown(0.5);

        doc
            .fontSize(10)
            .fillColor("gray")
            .text(`Receipt ID: #${expense.id}`, { align: "right" })
            .text(`Date: ${new Date().toLocaleDateString("en-IN")}`, {
                align: "right",
            });

        doc.moveDown(1);

        // ================= PROJECT INFO =================
        doc
            .fontSize(14)
            .fillColor("#000")
            .text("Project Details", { underline: true });

        doc.moveDown(0.5);

        doc.fontSize(11).fillColor("#333");

    doc.text(
      `Project: ${projectMap[Number(expense.project_name)] || "N/A"}`
    );
    doc.text(
      `Intervention: ${
        interventionMap[Number(expense.intervention)] || "N/A"
      }`
    );
    doc.text(`State: ${expense.project_state}`);
    doc.text(`District: ${expense.project_district}`);
    doc.text(`Village: ${expense.project_village}`);

        doc.moveDown();

        // ================= USER INFO =================
        doc
            .fontSize(14)
            .text("User Details", { underline: true })
            .moveDown(0.5);

        doc.fontSize(11);

        doc.text(
            `Raised By: ${userMap[Number(expense.requested_by)] || "N/A"}`
        );
        doc.text(
            `Manager: ${userMap[Number(expense.manager_id)] || "N/A"}`
        );

        doc.moveDown();

        // ================= PAYMENT SUMMARY =================
        doc
            .fontSize(14)
            .text("Payment Summary", { underline: true })
            .moveDown(0.5);

        doc.fontSize(11);

    doc.text(`Total Amount: ₹ ${expense.amount}`);
    doc.text(
      `Final Approved Amount: ₹ ${
        expense.final_approved_amount || expense.amount
      }`
    );
    doc.text(`Total Paid: ₹ ${totalPaid}`);
    doc.text(`Remaining: ₹ ${remaining}`);

        doc.moveDown();

        // ================= TRANSACTION TABLE =================
        doc
            .fontSize(14)
            .text("Transaction History", { underline: true })
            .moveDown(0.5);

        doc.fontSize(10);

        // Table Header
        doc.text("Date", 40);
        doc.text("Amount", 120);
        doc.text("Mode", 200);
        doc.text("Ref No", 280);
        doc.text("Remarks", 360);

        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();

        transactions.forEach((t) => {
            doc.moveDown(0.5);

            doc.text(new Date(t.payment_date).toLocaleDateString("en-IN"), 40);
            doc.text(`₹ ${t.payment_amount}`, 120);
            doc.text(t.payment_mode, 200);
            doc.text(t.reference_no || "-", 280);
            doc.text(t.remarks || "-", 360);
        });

        doc.moveDown(2);

        // ================= FOOTER =================
        doc
            .fontSize(10)
            .fillColor("gray")
            .text("This is a system-generated receipt.", { align: "center" });

        doc.end();

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};