import { PrismaClient } from "@prisma/client";
import { request } from "express";
import PDFDocument from "pdfkit";
const prisma = new PrismaClient();



function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}
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
            remarks,
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
                remarks,
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
                remarks: exp.remarks || "N/A",
                created_at: exp.created_at,

                raised_by: userMap[userId] || "N/A",
                manager_name: userMap[managerId] || "N/A",

                final_approved_amount: exp.final_approved_amount ?? 0,
                payment_amount: exp.paid_amount ?? 0,
                review_assign: Number(exp.review_assign),

                reviewer_status: getStatusText(exp.reviewer_approval_status),
                approval_status: getStatusText(exp.approval_status),
                requested_date: formatDate(exp.requested_date),
                assign_date: formatDate(exp.assign_date),
                manager_approved_at: formatDate(exp.manager_approved_at),
                reviewer_approved_at: formatDate(exp.reviewer_approved_at),

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



export const editExpense = async (req, res) => {
    try {
        const company_id = req.user.company_id;
        const id = Number(req.params.id);
        const expense = await prisma.expensePayment.findUnique({
            where: { id, company_id },
        });
        if (!expense) {
            return res.status(404).json({
                message: "Expense not found",
            });
        }

        return res.status(200).json({
            data: expense,
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const updateExpense = async (req, res) => {
    try {
        const company_id = req.user.company_id;
        const id = Number(req.params.id);
        const existing = await prisma.expensePayment.findUnique({
            where: { id, company_id, approval_status: 0 }
        });
        if (!existing) {
            return res.status(404).json({
                message: "Expense not found or cannot be edited",
            });
        }
        const {
            project_name,
            project_state,
            project_district,
            project_village,
            intervention,
            amount,
            remarks,
        } = req.body;
        let document = existing.document;
        if (req.file) {
            document = req.file.filename;
        }
        const updated = await prisma.expensePayment.update({
            where: { id },
            data: {
                project_name,
                project_state,
                project_district,
                project_village,
                intervention: parseInt(intervention),
                amount: Number(amount),
                remarks,
                document,
            },
        });

        return res.status(200).json({
            message: "Expense updated successfully",
            data: updated,
        });

    } catch (error) {
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

export const getManagerExpenses = async (req, res) => {
    try {
        const company_id = req.user?.company_id;
        const manager_id = req.user?.id;
        const status = req.query.status; // Optional query param for filtering by status
        if (!status) {
            return res.status(400).json({
                message: "Status query parameter is required",
            });
        }
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
                    approval_status: Number(status) === 0 ? 0 : { not: 0 }, // If status=0, show only pending. Else show approved/rejected

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
            final_approved_amount: exp.final_approved_amount || "N/A",
            paid_amount: exp.paid_amount || "N/A",
            reviewer_approval_status: Number(exp.reviewer_approval_status), // raw value
            reviewer_approval_text: getStatusText(exp.reviewer_approval_status), // label
            reviewer_remarks: exp.reviewer_remarks || "N/A",


            requested_date: formatDate(exp.requested_date),
            assign_date: formatDate(exp.assign_date),
            manager_approved_at: formatDate(exp.manager_approved_at),
            reviewer_approved_at: formatDate(exp.reviewer_approved_at),


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
                assign_date: new Date(),
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
                reviewer_approved_at: new Date(),
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
                manager_approved_at: new Date(),
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

        const status = req.query.status; // Optional query param for filtering by payment status
        if (!status) {
            return res.status(400).json({
                message: "Status is required",
            });
        }

        // ✅ Fetch only Manager Approved
        const expenses = await prisma.expensePayment.findMany({
            where: {
                company_id,
                approval_status: 1, // ✅ KEY CONDITION
                payment_status: Number(status) === 0 ? { in: [0, 1] } : 2, // If status=0, show only unpaid. Else show partially/fully paid

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
            requested_date: formatDate(exp.requested_date),
            document: exp.document,

            // ✅ IMPORTANT
            final_approved_amount: exp.final_approved_amount,
            manager_approved_date: formatDate(exp.manager_approved_at),
            paid_amount: exp.paid_amount || 0,              
            payment_status: exp.payment_status || 0,        

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


// export const paymentReceipt = async (req, res) => {

//     try {
//         const { id } = req.params;
//         const company_id = req.user.company_id;

//         // ✅ Get Expense
//         const expense = await prisma.expensePayment.findFirst({
//             where: {
//                 id: Number(id),
//                 company_id,
//             },
//         });

//         if (!expense) {
//             return res.status(404).json({ message: "Expense not found" });
//         }

//         // ✅ Fetch Transactions
//         const transactions = await prisma.expensePaymentTransaction.findMany({
//             where: { expense_id: Number(id) },
//             orderBy: { created_at: "asc" },
//         });

//         // ✅ Fetch related data
//         const [projects, interventions, users] = await Promise.all([
//             prisma.project.findMany({
//                 where: { company_id },
//                 select: { id: true, name: true },
//             }),
//             prisma.intervention.findMany({
//                 where: { company_id },
//                 select: { id: true, name: true },
//             }),
//             prisma.user.findMany({
//                 where: { company_id },
//                 select: { id: true, username: true },
//             }),
//         ]);

//         // ✅ Maps
//         const projectMap = Object.fromEntries(
//             projects.map((p) => [p.id, p.name])
//         );

//         const interventionMap = Object.fromEntries(
//             interventions.map((i) => [i.id, i.name])
//         );

//         const userMap = Object.fromEntries(
//             users.map((u) => [u.id, u.username])
//         );

//         // ✅ Calculations
//         const totalPaid = transactions.reduce(
//             (sum, t) => sum + Number(t.payment_amount),
//             0
//         );

//         const remaining =
//             Number(expense.final_approved_amount || expense.amount) - totalPaid;

//         // ✅ PDF INIT
//         const doc = new PDFDocument({ margin: 40, size: "A4" });

//         res.setHeader("Content-Type", "application/pdf");
//         res.setHeader("Content-Disposition", `inline; filename=receipt-${id}.pdf`);

//         doc.pipe(res);

//         // ================= HEADER =================
//         doc
//             .fontSize(20)
//             .fillColor("#333")
//             .text("PAYMENT RECEIPT", { align: "center" });

//         doc.moveDown(0.5);

//         doc
//             .fontSize(10)
//             .fillColor("gray")
//             .text(`Receipt ID: #${expense.id}`, { align: "right" })
//             .text(`Date: ${new Date().toLocaleDateString("en-IN")}`, {
//                 align: "right",
//             });

//         doc.moveDown(1);

//         // ================= PROJECT INFO =================
//         doc
//             .fontSize(14)
//             .fillColor("#000")
//             .text("Project Details", { underline: true });

//         doc.moveDown(0.5);

//         doc.fontSize(11).fillColor("#333");

//         doc.text(
//             `Project: ${projectMap[Number(expense.project_name)] || "N/A"}`
//         );
//         doc.text(
//             `Intervention: ${interventionMap[Number(expense.intervention)] || "N/A"
//             }`
//         );
//         doc.text(`State: ${expense.project_state}`);
//         doc.text(`District: ${expense.project_district}`);
//         doc.text(`Village: ${expense.project_village}`);

//         doc.moveDown();

//         // ================= USER INFO =================
//         doc
//             .fontSize(14)
//             .text("User Details", { underline: true })
//             .moveDown(0.5);

//         doc.fontSize(11);

//         doc.text(
//             `Raised By: ${userMap[Number(expense.requested_by)] || "N/A"}`
//         );
//         doc.text(
//             `Manager: ${userMap[Number(expense.manager_id)] || "N/A"}`
//         );

//         doc.moveDown();

//         // ================= PAYMENT SUMMARY =================
//         doc
//             .fontSize(14)
//             .text("Payment Summary", { underline: true })
//             .moveDown(0.5);

//         doc.fontSize(11);

//         doc.text(`Total Amount: ₹ ${expense.amount}`);
//         doc.text(
//             `Final Approved Amount: ₹ ${expense.final_approved_amount || expense.amount
//             }`
//         );
//         doc.text(`Total Paid: ₹ ${totalPaid}`);
//         doc.text(`Remaining: ₹ ${remaining}`);

//         doc.moveDown();

//         // ================= TRANSACTION TABLE =================
//         doc
//             .fontSize(14)
//             .text("Transaction History", { underline: true })
//             .moveDown(0.5);

//         doc.fontSize(10);

//         // Table Header
//         doc.text("Date", 40);
//         doc.text("Amount", 120);
//         doc.text("Mode", 200);
//         doc.text("Ref No", 280);
//         doc.text("Remarks", 360);

//         doc.moveDown(0.5);
//         doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();

//         transactions.forEach((t) => {
//             doc.moveDown(0.5);

//             doc.text(new Date(t.payment_date).toLocaleDateString("en-IN"), 40);
//             doc.text(`₹ ${t.payment_amount}`, 120);
//             doc.text(t.payment_mode, 200);
//             doc.text(t.reference_no || "-", 280);
//             doc.text(t.remarks || "-", 360);
//         });

//         doc.moveDown(2);

//         // ================= FOOTER =================
//         doc
//             .fontSize(10)
//             .fillColor("gray")
//             .text("This is a system-generated receipt.", { align: "center" });

//         doc.end();

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };




export const paymentReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        const company_id = req.user.company_id;

        const expense = await prisma.expensePayment.findFirst({
            where: { id: Number(id), company_id },
        });

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        const transactions = await prisma.expensePaymentTransaction.findMany({
            where: { expense_id: Number(id) },
            orderBy: { created_at: "asc" },
        });

        const [projects, interventions, users] = await Promise.all([
            prisma.project.findMany({ where: { company_id }, select: { id: true, name: true } }),
            prisma.intervention.findMany({ where: { company_id }, select: { id: true, name: true } }),
            prisma.user.findMany({ where: { company_id }, select: { id: true, username: true } }),
        ]);

        const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));
        const interventionMap = Object.fromEntries(interventions.map((i) => [i.id, i.name]));
        const userMap = Object.fromEntries(users.map((u) => [u.id, u.username]));

        const approvedAmount = Number(expense.final_approved_amount || expense.amount);
        const totalPaid = transactions.reduce((sum, t) => sum + Number(t.payment_amount), 0);
        const remaining = approvedAmount - totalPaid;
        const paidPercent = approvedAmount > 0 ? Math.round((totalPaid / approvedAmount) * 100) : 0;

        const doc = new PDFDocument({ margin: 0, size: "A4" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=receipt-${id}.pdf`);
        doc.pipe(res);

        const PAGE_W = 595.28;
        const PAGE_H = 841.89;
        const MARGIN = 50;
        const CONTENT_W = PAGE_W - MARGIN * 2;

        // ── PALETTE ────────────────────────────────────
        const BRAND = "#950000";   // <-- aapka theme color
        const BRAND_DARK = "#6b0000";   // header ke liye thoda aur dark
        const BRAND_LIGHT = "#fdf0f0";  // light tint for alternating rows / bg
        const WHITE = "#ffffff";
        const GRAY_1 = "#333333";
        const GRAY_2 = "#555555";
        const GRAY_3 = "#888888";
        const GRAY_4 = "#bbbbbb";
        const GRAY_5 = "#dedede";
        const GRAY_6 = "#f5f5f5";

        // ── HELPERS ────────────────────────────────────
        const fmt = (val) =>
            `Rs. ${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

        const fmtDate = (d) =>
            new Date(d).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
            });

        // ── HEADER ─────────────────────────────────────
        // Main header bar — brand red
        doc.rect(0, 0, PAGE_W, 90).fill(BRAND);

        // Subtle darker strip on right for depth (same family)
        doc.rect(PAGE_W - 120, 0, 120, 90).fill(BRAND_DARK);

        // Title
        doc.fontSize(22).fillColor(WHITE).font("Helvetica-Bold")
            .text("PAYMENT RECEIPT", MARGIN, 22, { width: 300 });

        doc.fontSize(9).fillColor("rgba(255,255,255,0.65)").font("Helvetica")
            .text("Expense Management System", MARGIN, 52);

        //  logo 

        // Thin accent line under header
        doc.rect(0, 90, PAGE_W, 2).fill(BRAND_DARK);

        // Meta row
        const statusText =
            remaining <= 0 ? "FULLY PAID" :
                remaining < approvedAmount ? "PARTIALLY PAID" : "UNPAID";

        doc.fontSize(8).fillColor(GRAY_2).font("Helvetica")
            .text(`Status: ${statusText}`, MARGIN, 102);
        doc.fontSize(8).fillColor(GRAY_3).font("Helvetica")
            .text(`Generated: ${fmtDate(new Date())}`, MARGIN, 102,
                { width: CONTENT_W, align: "right" });

        let y = 128;

        // ── HELPERS ────────────────────────────────────
        const divider = (yPos) => {
            doc.moveTo(MARGIN, yPos).lineTo(MARGIN + CONTENT_W, yPos)
                .strokeColor(GRAY_5).lineWidth(0.5).stroke();
        };

        const section = (label, yPos) => {
            // Left red accent bar + label
            doc.rect(MARGIN, yPos, 3, 13).fill(BRAND);
            doc.fontSize(8).fillColor(BRAND).font("Helvetica-Bold")
                .text(label.toUpperCase(), MARGIN + 9, yPos + 1, { characterSpacing: 0.8 });
            divider(yPos + 16);
            return yPos + 25;
        };

        const field = (label, value, x, yPos, w) => {
            doc.fontSize(7.5).fillColor(GRAY_3).font("Helvetica")
                .text(label, x, yPos, { width: w });
            doc.fontSize(9.5).fillColor(GRAY_1).font("Helvetica-Bold")
                .text(value || "—", x, yPos + 11, { width: w });
            return yPos + 30;
        };

        // ── PROJECT DETAILS ────────────────────────────
        y = section("Project & Location Details", y);

        const half = CONTENT_W / 2 - 12;
        const c1 = MARGIN;
        const c2 = MARGIN + CONTENT_W / 2 + 6;

        field("Project", projectMap[Number(expense.project_name)], c1, y, half);
        field("Intervention", interventionMap[Number(expense.intervention)], c2, y, half);
        y += 30;
        field("State", expense.project_state, c1, y, half);
        field("District", expense.project_district, c2, y, half);
        y += 30;
        field("Village", expense.project_village, c1, y, half);
        field("Raised By", userMap[Number(expense.requested_by)], c2, y, half);
        y += 36;

        // ── PAYMENT SUMMARY ────────────────────────────
        y = section("Payment Summary", y);

        const thirds = (CONTENT_W - 2) / 3;

        const amountBlock = (label, value, x, yPos, w, highlight = false) => {
            doc.fontSize(7.5).fillColor(GRAY_3).font("Helvetica")
                .text(label, x, yPos, { width: w });
            doc.fontSize(13)
                .fillColor(highlight ? BRAND : GRAY_1)
                .font("Helvetica-Bold")
                .text(value, x, yPos + 12, { width: w });
        };

        amountBlock("Total Amount", fmt(expense.amount), MARGIN, y, thirds - 10);
        amountBlock("Approved Amount", fmt(approvedAmount), MARGIN + thirds, y, thirds - 10);
        amountBlock("Total Paid", fmt(totalPaid), MARGIN + thirds * 2, y, thirds - 10, true);

        y += 40;
        divider(y);
        y += 10;

        // Remaining + progress bar
        doc.fontSize(7.5).fillColor(GRAY_3).font("Helvetica")
            .text("Remaining Balance", MARGIN, y);
        doc.fontSize(12)
            .fillColor(remaining <= 0 ? GRAY_3 : BRAND)
            .font("Helvetica-Bold")
            .text(fmt(remaining), MARGIN, y + 11);

        // Progress bar — brand red fill
        const barX = MARGIN + 180;
        const barW = CONTENT_W - 180;
        doc.fontSize(7.5).fillColor(GRAY_3).font("Helvetica")
            .text(`${paidPercent}% paid`, barX, y, { width: barW, align: "right" });
        doc.roundedRect(barX, y + 14, barW, 8, 4).fill(GRAY_5);
        if (paidPercent > 0) {
            doc.roundedRect(barX, y + 14, Math.min(barW * paidPercent / 100, barW), 8, 4).fill(BRAND);
        }
        doc.fontSize(7.5).fillColor(GRAY_3).font("Helvetica")
            .text(`Manager: ${userMap[Number(expense.manager_id)] || "—"}`, MARGIN, y + 26);

        y += 50;

        // ── TRANSACTION HISTORY ────────────────────────
        y = section("Transaction History", y);

        if (transactions.length === 0) {
            doc.fontSize(9).fillColor(GRAY_3).font("Helvetica")
                .text("No transactions recorded.", MARGIN, y, { width: CONTENT_W, align: "center" });
            y += 30;
        } else {
            const cols = [
                { label: "Date", x: MARGIN, w: 80 },
                { label: "Amount", x: MARGIN + 82, w: 90 },
                { label: "Mode", x: MARGIN + 174, w: 75 },
                { label: "Ref No.", x: MARGIN + 251, w: 100 },
                { label: "Remarks", x: MARGIN + 353, w: CONTENT_W - 303 },
            ];

            // Table header — brand red
            doc.rect(MARGIN, y, CONTENT_W, 22).fill(BRAND);
            cols.forEach((col) => {
                doc.fontSize(7.5).fillColor(WHITE).font("Helvetica-Bold")
                    .text(col.label, col.x + 4, y + 7, { width: col.w - 6 });
            });
            y += 22;

            transactions.forEach((t, idx) => {
                const rowH = 24;
                if (y + rowH > PAGE_H - 80) {
                    doc.addPage();
                    y = MARGIN;
                }

                // Alternating: white vs very light red tint
                doc.rect(MARGIN, y, CONTENT_W, rowH).fill(idx % 2 === 0 ? WHITE : BRAND_LIGHT);

                const vals = [
                    fmtDate(t.payment_date),
                    fmt(t.payment_amount),
                    t.payment_mode || "—",
                    t.reference_no || "—",
                    t.remarks || "—",
                ];

                cols.forEach((col, ci) => {
                    doc.fontSize(8.5)
                        .fillColor(ci === 1 ? BRAND : GRAY_1)
                        .font(ci === 1 ? "Helvetica-Bold" : "Helvetica")
                        .text(vals[ci], col.x + 4, y + 7, { width: col.w - 8, lineBreak: false });
                });

                y += rowH;
            });

            doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y)
                .strokeColor(GRAY_5).lineWidth(0.5).stroke();
        }

        y += 16;

        // Totals row
        doc.fontSize(8.5).fillColor(GRAY_2).font("Helvetica")
            .text(`Total Transactions: ${transactions.length}`, MARGIN, y);
        doc.fontSize(8.5).fillColor(BRAND).font("Helvetica-Bold")
            .text(`Total Paid: ${fmt(totalPaid)}`, MARGIN, y,
                { width: CONTENT_W, align: "right" });

        y += 30;

        // ── FOOTER ─────────────────────────────────────
        const footerY = PAGE_H - 50;

        // Red accent line above footer
        doc.rect(MARGIN, footerY, CONTENT_W, 1).fill(BRAND);


        doc.fontSize(7.5).fillColor(GRAY_4)


        doc.end();

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};