import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

const getCurrentFYYear = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const fyStartYear = month >= 4 ? year : year - 1;
    return `${fyStartYear}-${fyStartYear + 1}`;
};
const isValidFYYear = (fy) => /^\d{4}-\d{4}$/.test(fy);
export const InterventionReport = async (req, res) => {
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
        const filterUserId = req.query.user_id ? parseInt(req.query.user_id) : null;
        const filterProjectId = req.query.project_id ? String(req.query.project_id).trim() : null;
        const filterInterventionId = req.query.intervention_id ? parseInt(req.query.intervention_id) : null;

        // Date range filter
        const fromDate = req.query.from_date ? new Date(req.query.from_date) : null;
        const toDate = req.query.to_date ? new Date(req.query.to_date) : null;

        // ─── SQL Fragments ────────────────────────────────
        const fyFragment = fyYear ? Prisma.sql`AND ep.financial_year = ${fyYear}` : Prisma.empty;
        const userFragment = filterUserId ? Prisma.sql`AND ep.requested_by = ${filterUserId}` : Prisma.empty;
        const projectFragment = filterProjectId ? Prisma.sql`AND ep.project_name = ${filterProjectId}` : Prisma.empty;
        const interventionFragment = filterInterventionId ? Prisma.sql`AND ep.intervention = ${filterInterventionId}` : Prisma.empty;
        const fromFragment = fromDate ? Prisma.sql`AND ep.created_at >= ${fromDate}` : Prisma.empty;
        const toFragment = toDate ? Prisma.sql`AND ep.created_at <= ${toDate}` : Prisma.empty;

        // ─── Step 1: Get all Interventions for this company ───
        // (These become your dynamic columns)
        const interventions = await prisma.$queryRaw`
            SELECT DISTINCT
                i.id   AS intervention_id,
                i.name AS intervention_name
            FROM ExpensePayment ep
            LEFT JOIN Intervention i ON i.id = ep.intervention
            WHERE ep.company_id = ${company_id}
            ORDER BY i.id ASC
        `;

        // ─── Step 2: Flat rows — one per (user × intervention) ──
        const rawRows = await prisma.$queryRaw`
            SELECT
                u.id            AS user_id,
                u.username      AS employee_name,
                u.email         AS employee_email,
                i.id            AS intervention_id,
                i.name          AS intervention_name,
                COUNT(ep.id)    AS request_count,
                COALESCE(SUM(ep.amount), 0)                 AS total_requested,

                COALESCE(SUM(
                    CASE WHEN ep.approval_status = 1
                    THEN ep.final_approved_amount ELSE 0 END
                ), 0) AS total_approved,

                COALESCE(SUM(
                    CASE WHEN ep.payment_status != 0
                    THEN ep.paid_amount ELSE 0 END
                ), 0) AS total_paid,

                COALESCE(SUM(
                    CASE WHEN ep.approval_status = 2
                    THEN ep.amount ELSE 0 END
                ), 0) AS total_rejected

            FROM ExpensePayment ep
            LEFT JOIN User u         ON u.id  = ep.requested_by
            LEFT JOIN Intervention i ON i.id  = ep.intervention
            WHERE ep.company_id = ${company_id}


            GROUP BY u.id, u.username, u.email, i.id, i.name
            ORDER BY u.username ASC, i.id ASC
        `;

        // ─── Step 3: Pivot in JS ──────────────────────────
        // Group rows by user, spread interventions as keys
        const userMap = new Map();

        for (const row of rawRows) {
            const uid = Number(row.user_id);

            if (!userMap.has(uid)) {
                userMap.set(uid, {
                    user_id: uid,
                    employee_name: row.employee_name,
                    employee_email: row.employee_email,
                    interventions: {},   // { intervention_id: { name, amount, ... } }
                    row_total: 0,
                });
            }

            const user = userMap.get(uid);
            const iid = Number(row.intervention_id);

            user.interventions[iid] = {
                intervention_id: iid,
                intervention_name: row.intervention_name,
                total_paid: Number(row.total_paid),
            };

            user.row_total += Number(row.total_paid); // or total_paid — match your UI
        }

        // ─── Step 4: Column totals ────────────────────────
        const columnTotals = {};
        let grandTotal = 0;

        for (const iObj of interventions) {
            const iid = Number(iObj.intervention_id);
            columnTotals[iid] = 0;
        }

        for (const user of userMap.values()) {
            for (const [iid, data] of Object.entries(user.interventions)) {
                columnTotals[iid] = (columnTotals[iid] || 0) + data.total_paid;
            }
            grandTotal += user.row_total;
        }

        // ─── Serialize & Respond ──────────────────────────
        const responseData = ({
            activeFilters: {
                fy: fyYear ?? "all",
                user_id: filterUserId ?? "all",
                project_id: filterProjectId ?? "all",
                intervention_id: filterInterventionId ?? "all",
                from_date: fromDate ?? null,
                to_date: toDate ?? null,
            },
            interventions,                        // → column headers
            rows: [...userMap.values()],          // → table rows (pivoted)
            columnTotals,                         // → footer totals per intervention
            grandTotal,                           // → bottom-right total
        });

        return res.status(200).json({ success: true, data: responseData });

    } catch (error) {
        console.error("Intervention Report Error:", error);
        return res.status(500).json({
            success: false,
            message: "Intervention Report fetch failed",
            error: error.message,
        });
    }
};




export const PaidExpenseReport = async (req, res) => {
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
        const filterUserId = req.query.user_id ? parseInt(req.query.user_id) : null;
        const filterProjectId = req.query.project_id ? String(req.query.project_id).trim() : null;
        const filterInterventionId = req.query.intervention_id ? parseInt(req.query.intervention_id) : null;

        // Date range filter
        const fromDate = req.query.from_date ? new Date(req.query.from_date) : null;
        const toDate = req.query.to_date ? new Date(req.query.to_date) : null;

        // ─── SQL Fragments ────────────────────────────────
        const fyFragment = fyYear ? Prisma.sql`AND ep.financial_year = ${fyYear}` : Prisma.empty;
        const userFragment = filterUserId ? Prisma.sql`AND ep.requested_by = ${filterUserId}` : Prisma.empty;
        const projectFragment = filterProjectId ? Prisma.sql`AND ep.project_name = ${filterProjectId}` : Prisma.empty;
        const interventionFragment = filterInterventionId ? Prisma.sql`AND ep.intervention = ${filterInterventionId}` : Prisma.empty;
        const fromFragment = fromDate ? Prisma.sql`AND ept.payment_date >= ${fromDate}` : Prisma.empty;
        const toFragment = toDate ? Prisma.sql`AND ept.payment_date <= ${toDate}` : Prisma.empty;

        const paidExpenses = await prisma.$queryRaw`
  SELECT 
    ep.*, 
    req.username AS requested_by_name, 
    req.email AS requested_by_email,
    mgr.username AS manager_name, 
    i.name AS intervention_name, 
    p.name AS project_name, 
    ept.payment_date
  FROM ExpensePayment ep

  JOIN User req ON req.id = ep.requested_by
  JOIN User mgr ON mgr.id = ep.manager_id

  JOIN Intervention i ON i.id = ep.intervention
  JOIN Project p ON p.id = ep.project_name

  JOIN (
      SELECT expense_id, MAX(payment_date) as payment_date
      FROM ExpensePaymentTransaction
      GROUP BY expense_id
  ) ept ON ept.expense_id = ep.id

  WHERE ep.company_id = ${company_id}
    AND ep.payment_status = 2
    ${fyFragment}
    ${userFragment}
    ${projectFragment}
    ${interventionFragment}
    ${fromFragment}
    ${toFragment}

  ORDER BY ept.payment_date DESC, ep.id DESC
`;
        return res.status(200).json({ success: true, data: paidExpenses });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Paid Expense Report fetch failed",
            error: error.message,
        });
    }
};