import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCurrentFYYear = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const fyStartYear = month >= 4 ? year : year - 1;
    return `${fyStartYear}-${fyStartYear + 1}`;
};

const isValidFYYear = (fy) => /^\d{4}-\d{4}$/.test(fy);

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const UserDashboard = async (req, res) => {
    try {
        const company_id = req.user.company_id;
        const user_id = req.user.id;
        const rawFY = req.query.fy_year;
        let fyYear;
        if (!rawFY || rawFY === "current") {
            fyYear = getCurrentFYYear();
        } else if (rawFY === "all" || rawFY === "0") {
            fyYear = null;
        } else if (isValidFYYear(rawFY)) {
            fyYear = rawFY;
        } else {
            fyYear = getCurrentFYYear();
        }

        // ─── Optional Filters ─────────────────────────────

        const filterProjectId = req.query.project_id ? String(req.query.project_id).trim() : null;
        const filterInterventionId = req.query.intervention_id ? parseInt(req.query.intervention_id) : null;
        // ─── Safe SQL Fragments ───────────────────────────
        const fyFragment = fyYear ? Prisma.sql`AND ep.financial_year = ${fyYear}` : Prisma.empty;
        const projectFragment = filterProjectId ? Prisma.sql`AND ep.project_name = ${filterProjectId}` : Prisma.empty;
        const interventionFragment = filterInterventionId ? Prisma.sql`AND ep.intervention = ${filterInterventionId}` : Prisma.empty;

        const whereCondition = {
            company_id,
            requested_by: user_id,
            ...(fyYear && { financial_year: fyYear }),
            ...(filterProjectId && { project_name: filterProjectId }),
            ...(filterInterventionId && { intervention: filterInterventionId }),
        };

        // ─── 1. Status Summary ────────────────────────────
        const data = await prisma.ExpensePayment.groupBy({
            by: ['approval_status', 'payment_status'],
            where: whereCondition,
            _sum: {
                amount: true,
                final_approved_amount: true,
                paid_amount: true
            },
        });

        let totalExpense = 0, paidAmount = 0, pendingAmount = 0;
        let rejectedAmount = 0, approvedAmount = 0;

        for (const item of data) {
            const amount = Number(item._sum.amount) || 0;
            const approvalamount = Number(item._sum.final_approved_amount) || 0;
            const pamount = Number(item._sum.paid_amount) || 0;
            if (item.payment_status !== 0) paidAmount += pamount;
            if (item.approval_status === 2) rejectedAmount += amount;
            if (item.approval_status === 1) approvedAmount += approvalamount;
            if (item.approval_status === 1) pendingAmount += approvalamount - pamount;
            if (item.approval_status !== 5) totalExpense += amount;
        }

        // ─── 2. Yearly Paid Data ──────────────────────────
        const yearlyPaidData = await prisma.$queryRaw`
            SELECT
                financial_year   AS fy_year,
                SUM(ep.paid_amount) AS totalPaid
            FROM ExpensePayment ep
            WHERE ep.company_id     = ${company_id}
              AND ep.requested_by   = ${user_id}
              AND ep.payment_status != 0
              ${projectFragment}
              ${interventionFragment}
            GROUP BY financial_year
            ORDER BY financial_year DESC
        `;

        // ─── 3. Yearly Monthly Paid Data ──────────────────
        const yearlyMonthlyPaidData = await prisma.$queryRaw`
            SELECT
                ep.financial_year           AS fy_year,
                MONTH(ep.created_at)     AS month_number,
                MONTHNAME(ep.created_at) AS month_name,
                COUNT(ep.id)             AS totalCount,
                COALESCE(SUM(ep.amount), 0) AS totalAmount,
                COALESCE(SUM(CASE WHEN ep.payment_status != 0 THEN ep.paid_amount ELSE 0 END), 0) AS totalPaid,
                COALESCE(SUM(CASE WHEN ep.approval_status = 1 THEN ep.final_approved_amount - COALESCE(ep.paid_amount, 0) ELSE 0 END), 0) AS pendingAmount,
                COALESCE(SUM(CASE WHEN ep.approval_status = 2 THEN ep.amount ELSE 0 END), 0) AS rejectedAmount,
                COALESCE(SUM(CASE WHEN ep.approval_status = 1 THEN ep.final_approved_amount ELSE 0 END), 0) AS approvedAmount
            FROM ExpensePayment ep
            WHERE ep.company_id     = ${company_id}
              AND ep.requested_by   = ${user_id}
              ${fyFragment}
              ${projectFragment}
              ${interventionFragment}
            GROUP BY financial_year, MONTH(ep.created_at), MONTHNAME(ep.created_at)
            ORDER BY financial_year DESC, MONTH(ep.created_at) ASC
        `;

        // ─── 4. Project-wise Data ─────────────────────────
        const projectWiseData = await prisma.$queryRaw`
            SELECT
                p.id   AS project_id,
                p.name AS project_name,
                COUNT(ep.id) AS totalRequests,
                COALESCE(SUM(ep.amount), 0) AS totalAmount,
                COALESCE(SUM(CASE WHEN ep.payment_status != 0 THEN ep.paid_amount ELSE 0 END), 0) AS totalPaid,
                COALESCE(SUM(CASE WHEN ep.approval_status = 1 THEN ep.final_approved_amount - COALESCE(ep.paid_amount, 0) ELSE 0 END), 0) AS pendingAmount,
                COALESCE(SUM(CASE WHEN ep.approval_status = 2 THEN ep.amount ELSE 0 END), 0) AS rejectedAmount,
                COALESCE(SUM(CASE WHEN ep.approval_status = 1 THEN ep.final_approved_amount ELSE 0 END), 0) AS approvedAmount
            FROM ExpensePayment ep
            LEFT JOIN Project p ON p.id = ep.project_name
            WHERE ep.company_id   = ${company_id}
              AND ep.requested_by = ${user_id}
              ${fyFragment}
              ${interventionFragment}
            GROUP BY p.id, p.name
        `;

        // ─── 5. Latest 5 Expenses ─────────────────────────
        // const AllExpenseData = await prisma.$queryRaw`
        //     SELECT
        //         ep.*,
        //         p.name AS project_name
        //     FROM ExpensePayment ep
        //     LEFT JOIN Project p ON ep.project_name = p.id
        //     WHERE ep.company_id   = ${company_id}
        //       AND ep.requested_by = ${user_id}
        //       ${fyFragment}
        //       ${projectFragment}
        //       ${interventionFragment}
        //     ORDER BY ep.id DESC
        //     LIMIT 5
        // `;
        const AllExpenseData = await prisma.$queryRaw`
    SELECT
        ep.*,
        p.name AS project_name,

        DATE_FORMAT(ep.requested_date, '%Y-%m-%d %H:%i:%s') AS requested_date,
        DATE_FORMAT(ep.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(ep.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at

    FROM ExpensePayment ep
    LEFT JOIN Project p ON ep.project_name = p.id

    WHERE ep.company_id   = ${company_id}
      AND ep.requested_by = ${user_id}
      ${fyFragment}
      ${projectFragment}
      ${interventionFragment}

    ORDER BY ep.id DESC
    LIMIT 5
`;

        // ─── 6. Available FY List ─────────────────────────
        const availableFYList = await prisma.$queryRaw`
            SELECT DISTINCT financial_year AS fy_year
            FROM ExpensePayment ep
            WHERE ep.company_id   = ${company_id}
              AND ep.requested_by = ${user_id}
            ORDER BY financial_year DESC
        `;

        // ─── 7. Intervention-wise Data ────────────────────
        const interventionWiseData = await prisma.$queryRaw`
            SELECT
                i.id   AS intervention_id,
                i.name AS intervention_name,
                COUNT(ep.id) AS totalRequests,
                COALESCE(SUM(ep.amount), 0) AS totalAmount,
                COALESCE(SUM(CASE WHEN ep.payment_status != 0 THEN ep.paid_amount ELSE 0 END), 0) AS totalPaid,
                COALESCE(SUM(CASE WHEN ep.approval_status = 1 THEN ep.final_approved_amount - COALESCE(ep.paid_amount, 0) ELSE 0 END), 0) AS pendingAmount,
                COALESCE(SUM(CASE WHEN ep.approval_status = 2 THEN ep.amount ELSE 0 END), 0) AS rejectedAmount,
                COALESCE(SUM(CASE WHEN ep.approval_status = 1 THEN ep.final_approved_amount ELSE 0 END), 0) AS approvedAmount
            FROM ExpensePayment ep
            LEFT JOIN Intervention i ON i.id = ep.intervention
            WHERE ep.company_id   = ${company_id}
              AND ep.requested_by = ${user_id}
              ${fyFragment}
              ${projectFragment}
            GROUP BY i.id, i.name
        `;

        // ─── 8. Filter Dropdown Lists ─────────────────────
        const availableProjects = await prisma.$queryRaw`
            SELECT DISTINCT
                p.id   AS project_id,
                p.name AS project_name
            FROM ExpensePayment ep
            LEFT JOIN Project p ON p.id = ep.project_name
            WHERE ep.company_id   = ${company_id}
              AND ep.requested_by = ${user_id}
            ORDER BY p.name ASC
        `;

        const availableInterventions = await prisma.$queryRaw`
            SELECT DISTINCT
                i.id   AS intervention_id,
                i.name AS intervention_name
            FROM ExpensePayment ep
            LEFT JOIN Intervention i ON i.id = ep.intervention
            WHERE ep.company_id   = ${company_id}
              AND ep.requested_by = ${user_id}
            ORDER BY i.name ASC
        `;

        // ─── Response ─────────────────────────────────────
        const responseData = serializeBigInt({
            activeFilters: {
                fy: fyYear ?? "all",
                project_id: filterProjectId ?? "all",
                intervention_id: filterInterventionId ?? "all",
            },
            filterOptions: {
                availableFYList,
                availableProjects,
                availableInterventions,
            },
            totalExpense,
            paidAmount,
            pendingAmount,
            rejectedAmount,
            approvedAmount,
            yearlyPaidData,
            yearlyMonthlyPaidData,
            projectWiseData,
            AllExpenseData,
            interventionWiseData,
        });

        return res.status(200).json({ success: true, data: responseData });

    } catch (error) {
        console.error("Dashboard Error:", error);
        return res.status(500).json({
            success: false,
            message: "Dashboard fetch failed",
            error: error.message,
        });
    }
};




export const AdminDashboard = async (req, res) => {
    try {
        const company_id = req.user.company_id;

        // ─── FY Resolution ────────────────────────────────
        const rawFY = req.query.fy_year;
        let fyYear;
        if (!rawFY || rawFY === "current") {
            fyYear = getCurrentFYYear();
        } else if (rawFY === "all" || rawFY === "0") {
            fyYear = null;
        } else if (isValidFYYear(rawFY)) {
            fyYear = rawFY;
        } else {
            fyYear = getCurrentFYYear();
        }

        // ─── Optional Filters ─────────────────────────────
        const filterUserId = req.query.user_id ? parseInt(req.query.user_id) : null;
        // const filterProjectId = req.query.project_id ? String(req.query.project_id).trim() : null;
        const filterProjectId = req.query.project_id ? String(req.query.project_id).trim() : null;
        const filterInterventionId = req.query.intervention_id ? parseInt(req.query.intervention_id) : null;

        // ─── Safe SQL Fragments ───────────────────────────
        const fyFragment = fyYear ? Prisma.sql`AND ep.financial_year = ${fyYear}` : Prisma.empty;
        const userFragment = filterUserId ? Prisma.sql`AND ep.requested_by = ${filterUserId}` : Prisma.empty;
        const projectFragment = filterProjectId ? Prisma.sql`AND ep.project_name = ${filterProjectId}` : Prisma.empty;
        const interventionFragment = filterInterventionId ? Prisma.sql`AND ep.intervention = ${filterInterventionId}` : Prisma.empty;
        const extraFilters = Prisma.sql`${fyFragment} ${userFragment} ${projectFragment} ${interventionFragment}`;

        // ─── ORM where (for groupBy) ──────────────────────
        const whereCondition = {
            company_id,
            ...(fyYear && { financial_year: fyYear }),
            ...(filterUserId && { requested_by: filterUserId }),
            ...(filterProjectId && { project_name: filterProjectId }),
            ...(filterInterventionId && { intervention: filterInterventionId }),
        };

        // ─── 1. Status Summary ────────────────────────────
        const summaryData = await prisma.ExpensePayment.groupBy({
            by: ['approval_status', 'payment_status'],
            where: whereCondition,
            _sum: {
                amount: true,
                final_approved_amount: true,
                paid_amount: true
            }
        });

        let totalExpense = 0, paidAmount = 0, pendingAmount = 0;
        let rejectedAmount = 0, approvedAmount = 0;

        for (const item of summaryData) {
            const amount = Number(item._sum.amount) || 0;
            const approvalamount = Number(item._sum.final_approved_amount) || 0;
            const pamount = Number(item._sum.paid_amount) || 0;

            if (item.payment_status !== 0) paidAmount += pamount;
            if (item.approval_status === 2) rejectedAmount += amount;
            if (item.approval_status === 1)
                approvedAmount += approvalamount;
            if (item.approval_status === 1) pendingAmount += approvalamount - pamount;
            totalExpense += amount;
        }

        // ─── 2. All Users Expense Summary ─────────────────
        const userWiseSummary = await prisma.$queryRaw`
    SELECT
        u.id                AS userid,
        u.username          AS Name,
        u.email             AS user_email,
        u.phone_no          AS user_phone,

        COUNT(ep.id)        AS totalRequests,

        COALESCE(SUM(ep.amount), 0) AS totalAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.payment_status != 0 
                THEN ep.paid_amount 
                ELSE 0 
            END
        ), 0) AS totalPaid,

        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 2 
                THEN ep.amount 
                ELSE 0 
            END
        ), 0) AS rejectedAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 1  
                THEN ep.final_approved_amount 
                ELSE 0 
            END
        ), 0) AS approvedAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 1 
                THEN ep.final_approved_amount - COALESCE(ep.paid_amount, 0)
                ELSE 0 
            END
        ), 0) AS pendingAmount

    FROM ExpensePayment ep
    LEFT JOIN User u ON u.id = ep.requested_by

    WHERE ep.company_id = ${company_id}
    ${fyFragment}
    ${projectFragment}
    ${interventionFragment}

    GROUP BY u.id, u.username, u.email, u.phone_no

    ORDER BY totalAmount DESC
`;

        // ─── 3. Approval Queue (pending approvals) ────────
        const approvalQueue = await prisma.$queryRaw`
            SELECT
                ep.id               AS expense_id,
                ep.final_approved_amount AS amount,
                ep.financial_year,
                ep.created_at,
                u.id                AS userid,
                u.username          AS user_name,
                u.email             AS user_email,
                p.name              AS project_name,
                i.name              AS intervention_name
            FROM ExpensePayment ep
            LEFT JOIN User u         ON u.id  = ep.requested_by
            LEFT JOIN Project p      ON p.id  = ep.project_name
            LEFT JOIN Intervention i ON i.id  = ep.intervention
            WHERE ep.company_id      = ${company_id}
              AND ep.approval_status = 0
              ${fyFragment}
              ${userFragment}
              ${projectFragment}
              ${interventionFragment}
            ORDER BY ep.created_at ASC
        `;

        // ─── 4. Payment Status Overview ───────────────────
        const paymentOverview = await prisma.$queryRaw`
            SELECT
                ep.payment_status,
                ep.approval_status,
                COUNT(ep.id)   AS totalCount,
                SUM(ep.paid_amount) AS totalAmount
            FROM ExpensePayment ep
            WHERE ep.company_id = ${company_id}
              ${extraFilters}
            GROUP BY ep.payment_status, ep.approval_status
        `;

        // ─── 5. Project-wise Breakdown ────────────────────
        const projectWiseData = await prisma.$queryRaw`
    SELECT
        p.id   AS project_id,
        p.name AS project_name,

        COUNT(ep.id) AS totalRequests,

        COALESCE(SUM(ep.amount), 0) AS totalAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.payment_status != 0 
                THEN ep.paid_amount 
                ELSE 0 
            END
        ), 0) AS totalPaid,

        -- ✅ Correct Pending (approved - paid)
        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 1 
                THEN ep.final_approved_amount - COALESCE(ep.paid_amount, 0)
                ELSE 0 
            END
        ), 0) AS pendingAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 2 
                THEN ep.amount 
                ELSE 0 
            END
        ), 0) AS rejectedAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 1
                THEN ep.final_approved_amount 
                ELSE 0 
            END
        ), 0) AS approvedAmount

    FROM ExpensePayment ep
    LEFT JOIN Project p ON p.id = ep.project_name

    WHERE ep.company_id = ${company_id}
    ${fyFragment}
    ${projectFragment}
    ${userFragment}
    ${interventionFragment}

    GROUP BY p.id, p.name

    ORDER BY totalAmount DESC
`;

        // ─── 6. Intervention-wise Breakdown ───────────────
        const interventionWiseData = await prisma.$queryRaw`
    SELECT
        i.id   AS intervention_id,
        i.name AS intervention_name,

        COUNT(ep.id) AS totalRequests,

        COALESCE(SUM(ep.amount), 0) AS totalAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.payment_status != 0 
                THEN ep.paid_amount 
                ELSE 0 
            END
        ), 0) AS totalPaid,

        -- ✅ Correct Pending
        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 1 
                THEN ep.final_approved_amount - COALESCE(ep.paid_amount, 0)
                ELSE 0 
            END
        ), 0) AS pendingAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 2 
                THEN ep.amount 
                ELSE 0 
            END
        ), 0) AS rejectedAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 1 
                THEN ep.final_approved_amount 
                ELSE 0 
            END
        ), 0) AS approvedAmount

    FROM ExpensePayment ep
    LEFT JOIN Intervention i ON i.id = ep.intervention

    WHERE ep.company_id = ${company_id}
    ${fyFragment}
    ${userFragment}
    ${projectFragment}
    ${interventionFragment}

    GROUP BY i.id, i.name

    ORDER BY totalAmount DESC
`;



        const UserExpenseData = await prisma.$queryRaw`
            SELECT
                ep.*,
                p.name AS project_name,
                u.username AS requested_by_name,
                i.name AS intervention_name
            FROM ExpensePayment ep
            LEFT JOIN User u ON u.id = ep.requested_by
            LEFT JOIN Project p ON ep.project_name = p.id
            LEFT JOIN Intervention i ON ep.intervention = i.id
            WHERE ep.company_id   = ${company_id}
            ${fyFragment}
            ${userFragment}
            ${projectFragment}
            ${interventionFragment}
            ORDER BY ep.id DESC
            LIMIT 6
        `;




        // ─── 7. Year-wise Paid (always all FYs for chart) ─
        const yearlyPaidData = await prisma.$queryRaw`
            SELECT
                financial_year AS fy_year,
                SUM(amount)    AS totalPaid,
                COUNT(id)      AS totalCount
            FROM ExpensePayment
            WHERE company_id    = ${company_id}
              AND payment_status != 0
            GROUP BY financial_year
            ORDER BY financial_year ASC
        `;

        // ─── 8. Filter Dropdown Lists ─────────────────────
        const availableFYList = await prisma.$queryRaw`
            SELECT DISTINCT financial_year AS fy_year
            FROM ExpensePayment
            WHERE company_id = ${company_id}
            ORDER BY financial_year DESC
        `;

        const availableUsers = await prisma.$queryRaw`
            SELECT DISTINCT
                u.id       AS user_id,
                u.username AS user_name
            FROM ExpensePayment ep
            LEFT JOIN User u ON u.id = ep.requested_by
            WHERE ep.company_id = ${company_id}
            ORDER BY u.username ASC
        `;

        const availableProjects = await prisma.$queryRaw`
            SELECT DISTINCT
                p.id   AS project_id,
                p.name AS project_name
            FROM ExpensePayment ep
            LEFT JOIN Project p ON p.id = ep.project_name
            WHERE ep.company_id = ${company_id}
            ORDER BY p.name ASC
        `;

        const availableInterventions = await prisma.$queryRaw`
            SELECT DISTINCT
                i.id   AS intervention_id,
                i.name AS intervention_name
            FROM ExpensePayment ep
            LEFT JOIN Intervention i ON i.id = ep.intervention
            WHERE ep.company_id = ${company_id}
            ORDER BY i.name ASC
        `;
        // ─── Serialize BigInt → Number then Respond ───────
        const responseData = serializeBigInt({
            activeFilters: {
                fy: fyYear ?? "all",
                user_id: filterUserId ?? "all",
                project_id: filterProjectId ?? "all",
                intervention_id: filterInterventionId ?? "all",
            },
            filterOptions: {
                availableFYList,
                availableUsers,
                availableProjects,
                availableInterventions,
            },
            totalExpense,
            paidAmount,
            pendingAmount,
            rejectedAmount,
            approvedAmount,
            approvalQueueCount: approvalQueue.length,
            userWiseSummary,
            approvalQueue,
            paymentOverview,
            projectWiseData,
            interventionWiseData,
            yearlyPaidData,
            UserExpenseData,
        });

        return res.status(200).json({ success: true, data: responseData });

    } catch (error) {
        console.error("Admin Dashboard Error:", error);
        return res.status(500).json({
            success: false,
            message: "Admin Dashboard fetch failed",
            error: error.message,
        });
    }
};

export const ManagerDashboard = async (req, res) => {
    try {
        const company_id = req.user.company_id;
        const manager_id = req.user.id;

        // ─── FY Resolution ────────────────────────────────
        const rawFY = req.query.fy_year;
        let fyYear;
        if (!rawFY || rawFY === "current") {
            fyYear = getCurrentFYYear();
        } else if (rawFY === "all" || rawFY === "0") {
            fyYear = null;
        } else if (isValidFYYear(rawFY)) {
            fyYear = rawFY;
        } else {
            fyYear = getCurrentFYYear();
        }

        // ─── Optional Filters ─────────────────────────────
        const filterUserId = req.query.user_id ? parseInt(req.query.user_id) : null;
        // const filterProjectId = req.query.project_id ? String(req.query.project_id).trim() : null;
        const filterProjectId = req.query.project_id ? String(req.query.project_id).trim() : null;
        const filterInterventionId = req.query.intervention_id ? parseInt(req.query.intervention_id) : null;

        // ─── Safe SQL Fragments ───────────────────────────
        const fyFragment = fyYear ? Prisma.sql`AND ep.financial_year = ${fyYear}` : Prisma.empty;
        const userFragment = filterUserId ? Prisma.sql`AND ep.requested_by = ${filterUserId}` : Prisma.empty;
        const projectFragment = filterProjectId ? Prisma.sql`AND ep.project_name = ${filterProjectId}` : Prisma.empty;
        const interventionFragment = filterInterventionId ? Prisma.sql`AND ep.intervention = ${filterInterventionId}` : Prisma.empty;
        const extraFilters = Prisma.sql`${fyFragment} ${userFragment} ${projectFragment} ${interventionFragment}`;

        // ─── ORM where (for groupBy) ──────────────────────
        const whereCondition = {
            manager_id: manager_id,
            company_id,
            ...(fyYear && { financial_year: fyYear }),
            ...(filterUserId && { requested_by: filterUserId }),
            ...(filterProjectId && { project_name: filterProjectId }),
            ...(filterInterventionId && { intervention: filterInterventionId }),
        };

        // ─── 1. Status Summary ────────────────────────────
        const summaryData = await prisma.ExpensePayment.groupBy({
            by: ['approval_status', 'payment_status'],
            where: whereCondition,
            _sum: {
                amount: true,
                final_approved_amount: true,
                paid_amount: true
            }
        });

        let totalExpense = 0, paidAmount = 0, pendingAmount = 0;
        let rejectedAmount = 0, approvedAmount = 0;

        for (const item of summaryData) {
            const amount = Number(item._sum.amount) || 0;
            const approvalamount = Number(item._sum.final_approved_amount) || 0;
            const pamount = Number(item._sum.paid_amount) || 0;

            if (item.payment_status !== 0) paidAmount += pamount;
            if (item.approval_status === 2) rejectedAmount += amount;
            if (item.approval_status === 1)
                approvedAmount += approvalamount;
            if (item.approval_status === 1) pendingAmount += approvalamount - pamount;
            totalExpense += amount;
        }

        // ─── 2. All Users Expense Summary ─────────────────
        const userWiseSummary = await prisma.$queryRaw`
    SELECT
        u.id                AS userid,
        u.username          AS Name,
        u.email             AS user_email,
        u.phone_no          AS user_phone,

        COUNT(ep.id)        AS totalRequests,

        COALESCE(SUM(ep.amount), 0) AS totalAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.payment_status != 0 
                THEN ep.paid_amount 
                ELSE 0 
            END
        ), 0) AS totalPaid,

        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 2 
                THEN ep.amount 
                ELSE 0 
            END
        ), 0) AS rejectedAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 1  
                THEN ep.final_approved_amount 
                ELSE 0 
            END
        ), 0) AS approvedAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 1 
                THEN ep.final_approved_amount - COALESCE(ep.paid_amount, 0)
                ELSE 0 
            END
        ), 0) AS pendingAmount

    FROM ExpensePayment ep
    LEFT JOIN User u ON u.id = ep.requested_by

    WHERE ep.company_id = ${company_id}
        AND ep.manager_id = ${manager_id}
    ${fyFragment}
    ${projectFragment}
    ${interventionFragment}

    GROUP BY u.id, u.username, u.email, u.phone_no

    ORDER BY totalAmount DESC
`;

        // ─── 3. Approval Queue (pending approvals) ────────
        const approvalQueue = await prisma.$queryRaw`
            SELECT
                ep.id               AS expense_id,
                ep.final_approved_amount AS amount,
                ep.financial_year,
                ep.created_at,
                ep.payment_status,
                ep.paid_amount,
                u.id                AS userid,
                u.username          AS user_name,
                u.email             AS user_email,
                p.name              AS project_name,
                i.name              AS intervention_name
            FROM ExpensePayment ep
            LEFT JOIN User u         ON u.id  = ep.requested_by
            LEFT JOIN Project p      ON p.id  = ep.project_name
            LEFT JOIN Intervention i ON i.id  = ep.intervention
            WHERE ep.company_id      = ${company_id}
              AND ep.approval_status = 1
                AND ep.manager_id       = ${manager_id}
              ${fyFragment}
              ${userFragment}
              ${projectFragment}
              ${interventionFragment}
            ORDER BY ep.created_at ASC
        `;

        // ─── 4. Payment Status Overview ───────────────────
        const paymentOverview = await prisma.$queryRaw`
            SELECT
                ep.payment_status,
                ep.approval_status,
                COUNT(ep.id)   AS totalCount,
                SUM(ep.paid_amount) AS totalAmount
            FROM ExpensePayment ep
            WHERE ep.company_id = ${company_id}
                AND ep.manager_id = ${manager_id}
              ${extraFilters}
            GROUP BY ep.payment_status, ep.approval_status
        `;

        // ─── 5. Project-wise Breakdown ────────────────────
        const projectWiseData = await prisma.$queryRaw`
    SELECT
        p.id   AS project_id,
        p.name AS project_name,

        COUNT(ep.id) AS totalRequests,

        COALESCE(SUM(ep.amount), 0) AS totalAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.payment_status != 0 
                THEN ep.paid_amount 
                ELSE 0 
            END
        ), 0) AS totalPaid,

        -- ✅ Correct Pending (approved - paid)
        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 1 
                THEN ep.final_approved_amount - COALESCE(ep.paid_amount, 0)
                ELSE 0 
            END
        ), 0) AS pendingAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 2 
                THEN ep.amount 
                ELSE 0 
            END
        ), 0) AS rejectedAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 1
                THEN ep.final_approved_amount 
                ELSE 0 
            END
        ), 0) AS approvedAmount

    FROM ExpensePayment ep
    LEFT JOIN Project p ON p.id = ep.project_name

    WHERE ep.company_id = ${company_id}
        AND ep.manager_id = ${manager_id}
    ${fyFragment}
    ${projectFragment}
    ${userFragment}
    ${interventionFragment}

    GROUP BY p.id, p.name

    ORDER BY totalAmount DESC
`;

        // ─── 6. Intervention-wise Breakdown ───────────────
        const interventionWiseData = await prisma.$queryRaw`
    SELECT
        i.id   AS intervention_id,
        i.name AS intervention_name,

        COUNT(ep.id) AS totalRequests,

        COALESCE(SUM(ep.amount), 0) AS totalAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.payment_status != 0 
                THEN ep.paid_amount 
                ELSE 0 
            END
        ), 0) AS totalPaid,

        -- ✅ Correct Pending
        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 1 
                THEN ep.final_approved_amount - COALESCE(ep.paid_amount, 0)
                ELSE 0 
            END
        ), 0) AS pendingAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 2 
                THEN ep.amount 
                ELSE 0 
            END
        ), 0) AS rejectedAmount,

        COALESCE(SUM(
            CASE 
                WHEN ep.approval_status = 1 
                THEN ep.final_approved_amount 
                ELSE 0 
            END
        ), 0) AS approvedAmount

    FROM ExpensePayment ep
    LEFT JOIN Intervention i ON i.id = ep.intervention

    WHERE ep.company_id = ${company_id}
        AND ep.manager_id = ${manager_id}
    ${fyFragment}
    ${userFragment}
    ${projectFragment}
    ${interventionFragment}

    GROUP BY i.id, i.name

    ORDER BY totalAmount DESC
`;



        const UserExpenseData = await prisma.$queryRaw`
            SELECT
                ep.*,
                p.name AS project_name,
                u.username AS requested_by_name,
                i.name AS intervention_name
            FROM ExpensePayment ep
            LEFT JOIN User u ON u.id = ep.requested_by
            LEFT JOIN Project p ON ep.project_name = p.id
            LEFT JOIN Intervention i ON ep.intervention = i.id
            WHERE ep.company_id   = ${company_id}
            AND ep.manager_id   = ${manager_id}
            ${fyFragment}
            ${userFragment}
            ${projectFragment}
            ${interventionFragment}
            ORDER BY ep.id DESC
            LIMIT 6
        `;




        // ─── 7. Year-wise Paid (always all FYs for chart) ─
        const yearlyPaidData = await prisma.$queryRaw`
            SELECT
                financial_year AS fy_year,
                SUM(amount)    AS totalPaid,
                COUNT(id)      AS totalCount
            FROM ExpensePayment
            WHERE company_id    = ${company_id}
                AND manager_id    = ${manager_id}
              AND payment_status != 0
            GROUP BY financial_year
            ORDER BY financial_year ASC
        `;

        // ─── 8. Filter Dropdown Lists ─────────────────────
        const availableFYList = await prisma.$queryRaw`
            SELECT DISTINCT financial_year AS fy_year
            FROM ExpensePayment
            WHERE company_id = ${company_id}
                AND manager_id = ${manager_id}
            ORDER BY financial_year DESC
        `;

        const availableUsers = await prisma.$queryRaw`
            SELECT DISTINCT
                u.id       AS user_id,
                u.username AS user_name
            FROM ExpensePayment ep
            LEFT JOIN User u ON u.id = ep.requested_by
            WHERE ep.company_id = ${company_id}
                AND ep.manager_id = ${manager_id}
            ORDER BY u.username ASC
        `;

        const availableProjects = await prisma.$queryRaw`
            SELECT DISTINCT
                p.id   AS project_id,
                p.name AS project_name
            FROM ExpensePayment ep
            LEFT JOIN Project p ON p.id = ep.project_name
            WHERE ep.company_id = ${company_id}
                AND ep.manager_id = ${manager_id}
            ORDER BY p.name ASC
        `;

        const availableInterventions = await prisma.$queryRaw`
            SELECT DISTINCT
                i.id   AS intervention_id,
                i.name AS intervention_name
            FROM ExpensePayment ep
            LEFT JOIN Intervention i ON i.id = ep.intervention
            WHERE ep.company_id = ${company_id}
                AND ep.manager_id = ${manager_id}
            ORDER BY i.name ASC
        `;
        // ─── Serialize BigInt → Number then Respond ───────
        const responseData = serializeBigInt({
            activeFilters: {
                fy: fyYear ?? "all",
                user_id: filterUserId ?? "all",
                project_id: filterProjectId ?? "all",
                intervention_id: filterInterventionId ?? "all",
            },
            filterOptions: {
                availableFYList,
                availableUsers,
                availableProjects,
                availableInterventions,
            },
            totalExpense,
            paidAmount,
            pendingAmount,
            rejectedAmount,
            approvedAmount,
            approvalQueueCount: approvalQueue.length,
            userWiseSummary,
            approvalQueue,
            paymentOverview,
            projectWiseData,
            interventionWiseData,
            yearlyPaidData,
            UserExpenseData,
        });

        return res.status(200).json({ success: true, data: responseData });

    } catch (error) {
        console.error("Admin Dashboard Error:", error);
        return res.status(500).json({
            success: false,
            message: "Admin Dashboard fetch failed",
            error: error.message,
        });
    }
};


const serializeBigInt = (data) => {
    if (Array.isArray(data)) return data.map(serializeBigInt);
    if (data !== null && typeof data === 'object')
        return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, serializeBigInt(v)]));
    if (typeof data === 'bigint') return Number(data);
    return data;
};