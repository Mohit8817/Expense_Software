import { PrismaClient, Prisma } from '@prisma/client';
import { validationResult } from "express-validator";
const prisma = new PrismaClient();


const getCurrentFYYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const fyStartYear = month >= 4 ? year : year - 1;

  return `${fyStartYear}-${fyStartYear + 1}`;
};

const isValidFYYear = (fy) => /^\d{4}-\d{4}$/.test(fy);
const financial_year = getCurrentFYYear();



export const createAdvanceExpense = async (req, res) => {
  const company_id = req.user.company_id;
  const accountant_id = req.user.id;
  try {
    const {
      user_id,
      project_id,
      amount,
      payment_mode,
      reference_no,
      payment_date,
      remarks,
    } = req.body;
    const doc_file = req.file ? req.file.filename : null;
    const result = await prisma.$transaction(async (tx) => {
      const advance = await tx.payments.create({
        data: {
          user_id: parseInt(user_id),
          company_id,
          financial_year: financial_year,
          project_id: project_id ? parseInt(project_id) : 0,
          accountant_id,
          amount: parseFloat(amount),
          payment_mode,
          payment_date: new Date(payment_date),
          reference_no: reference_no || null,
          remarks: remarks || null,
          status: 1,
          doc_file,
        },
      });
      const wallet = await tx.wallet.upsert({
        where: {
          user_id: parseInt(user_id),
        },
        create: {
          user_id: parseInt(user_id),
          company_id,
          balance: parseFloat(amount),
        },
        update: {
          balance: {
            increment: parseFloat(amount),
          },
        },
      });
      const walletHistory = await tx.walletHistory.create({
        data: {
          user_id: parseInt(user_id),
          wallet_id: wallet.id,
          company_id,
          payment_mode: "credit",
          type: "advance_expense",
          amount: parseFloat(amount),
          balance: wallet.balance,
        },
      });

      return { advance, wallet, walletHistory };
    });

    return res.status(201).json({
      success: true,
      message: "Advance Expense Created successfully",
      //   data: result,
    });

  } catch (error) {
    console.error("Create AdvanceExpense Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// export const getpaymentExpenses = async (req, res) => {

//   try {

//     const company_id = req.user.company_id;

//     // Wallet + User Details
//     const wallets = await prisma.$queryRaw`

//       SELECT
//         w.id AS wallet_id,
//         w.user_id,
//         w.balance,
//         u.username,
//         u.email

//       FROM Wallet w

//       INNER JOIN User u
//       ON u.id = w.user_id

//       WHERE w.company_id = ${company_id}

//       ORDER BY u.username ASC
//     `;

//     // Payments / Advances
//     const advances = await prisma.$queryRaw`

//       SELECT
//         p.*

//       FROM Payments p

//       WHERE p.company_id = ${company_id}
//       AND p.status = 1 -- Only completed advances
//       ORDER BY p.createdAt DESC
//     `;
//     const settlements = await prisma.$queryRaw`
//       SELECT
//         p.*
//       FROM Payments p
//       WHERE p.company_id = ${company_id}
//       AND p.status = 2 -- Only completed settlements
//       ORDER BY p.createdAt DESC
//     `;

//     // Wallet Transaction History
//     const walletHistory = await prisma.$queryRaw`

//       SELECT
//         wh.*

//       FROM WalletHistory wh

//       WHERE wh.company_id = ${company_id}

//       ORDER BY wh.createdAt DESC
//     `;

//     // Merge Complete Data
//     const finalData = wallets.map((wallet) => {

//       // User Advance Payments
//       const userAdvances = advances.filter(
//         (item) => item.user_id === wallet.user_id
//       );

//       const settlement = settlements.filter(
//         (item) => item.user_id === wallet.user_id
//       );

//       // Wallet Transactions
//       const transactions = walletHistory.filter(
//         (item) => item.wallet_id === wallet.wallet_id
//       );

//       // Total Advance Amount
//     //   const totalAdvance = userAdvances.reduce(
//     //     (sum, item) => sum + Number(item.amount),
//     //     0
//     //   );

//       // Total Transaction Amount
//     //   const totalTransaction = transactions.reduce(
//     //     (sum, item) => sum + Number(item.amount),
//     //     0
//     //   );

//       return {
//         wallet_id: wallet.wallet_id,
//         user_id: wallet.user_id,
//         username: wallet.username,
//         email: wallet.email,
//         wallet_balance: wallet.balance,
//         // total_advance_amount: totalAdvance,
//         // total_transaction_amount: totalTransaction,
//         advances: userAdvances,
//         settlements: settlement,
//         transaction_history: transactions
//       };
//     });

//     return res.status(200).json({
//       success: true,
//       count: finalData.length,
//       data: finalData

//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message
//     });

//   }

// };




export const getpaymentExpenses = async (req, res) => {
  try {
    const company_id = req.user.company_id;
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
    const filterUserId = req.query.user_id ? parseInt(req.query.user_id, 10) : null;
    const filterProjectId = req.query.project_id ? parseInt(req.query.project_id, 10) : null;
    const fyFragment = fyYear ? Prisma.sql`AND p.financial_year = ${fyYear}` : Prisma.empty;
    const userFragment = filterUserId ? Prisma.sql`AND p.user_id = ${filterUserId}` : Prisma.empty;
    const projectFragment = filterProjectId ? Prisma.sql`AND p.project_id = ${filterProjectId}` : Prisma.empty;
    const extraFilters = Prisma.sql` ${fyFragment} ${projectFragment} ${userFragment}`;
    const walletUserFragment = filterUserId ? Prisma.sql`AND w.user_id = ${filterUserId}` : Prisma.empty;
    const walletHistoryUserFragment = filterUserId ? Prisma.sql`AND wh.user_id = ${filterUserId}` : Prisma.empty;

    const whereCondition = {
      company_id,
      ...(fyYear && { financial_year: fyYear }),
      ...(filterUserId && { user_id: filterUserId }),
      ...(filterProjectId && { project_id: filterProjectId }),
    };
    const summaryData = await prisma.payments.groupBy({
      by: ["status"],
      where: whereCondition,
      _sum: {
        amount: true,
      },
    });
    let totalAdvanced = 0;
    let totalSettled = 0;
    summaryData.forEach((item) => {
      const amount = Number(item._sum.amount) || 0;
      if (item.status === 1) {
        totalAdvanced += amount;
      }
      if (item.status === 2) {
        totalSettled += amount;
      }
    });
    const totalPending = totalAdvanced - totalSettled;
    const wallets = await prisma.$queryRaw`
      SELECT
        w.id AS wallet_id,
        w.user_id,
        w.balance,
        u.username,
        u.email
      FROM Wallet w
      INNER JOIN User u ON u.id = w.user_id
      WHERE w.company_id = ${company_id}
      ${walletUserFragment}
      ORDER BY u.username ASC
    `;
    const advances = await prisma.$queryRaw`
      SELECT p.*
      FROM Payments p
      WHERE p.company_id = ${company_id}
      AND p.status = 1
      ${extraFilters}
      ORDER BY p.createdAt DESC
    `;
    const settlements = await prisma.$queryRaw`
      SELECT p.*
      FROM Payments p
      WHERE p.company_id = ${company_id}
      AND p.status = 2
      ${extraFilters}
      ORDER BY p.createdAt DESC
    `;
    const walletHistory = await prisma.$queryRaw`
      SELECT wh.*
      FROM WalletHistory wh
      WHERE wh.company_id = ${company_id}
      ${walletHistoryUserFragment}
      ORDER BY wh.createdAt DESC
    `;
    const fullySettledEmployees = wallets.filter(
      (w) => Number(w.balance) === 0
    ).length;
    const finalData = wallets.map((wallet) => {
      const userAdvances = advances.filter(
        (item) => item.user_id === wallet.user_id
      );
      const settlement = settlements.filter(
        (item) => item.user_id === wallet.user_id
      );
      const transactions = walletHistory.filter(
        (item) => item.wallet_id === wallet.wallet_id
      );

      return {
        wallet_id: wallet.wallet_id,
        user_id: wallet.user_id,
        username: wallet.username,
        email: wallet.email,
        wallet_balance: wallet.balance,
        advances: userAdvances,
        settlements: settlement,
        transaction_history: transactions
      };
    });
    const availableFYList = await prisma.$queryRaw`
      SELECT DISTINCT financial_year AS fy_year
      FROM Payments
      WHERE company_id = ${company_id}
      ORDER BY financial_year DESC
    `;
    const availableUsers = await prisma.$queryRaw`
      SELECT DISTINCT
        u.id AS user_id,
        u.username AS user_name
      FROM Payments pay
      LEFT JOIN User u ON u.id = pay.user_id
      WHERE pay.company_id = ${company_id}
      ORDER BY u.username ASC
    `;
    const availableProjects = await prisma.$queryRaw`
      SELECT DISTINCT
        pr.id AS project_id,
        pr.name AS project_name
      FROM Payments pay
      LEFT JOIN Project pr ON pr.id = pay.project_id
      WHERE pay.company_id = ${company_id}
      ORDER BY pr.name ASC
    `;

    return res.status(200).json({
      success: true,
      filterOptions: {
        availableFYList,
        availableUsers,
        availableProjects,
      },
      summary: {
        totalAdvanced,
        totalSettled,
        totalPending,
        fullySettledEmployees,
      },
      data: finalData,
    });
  } catch (error) {
    console.error("getpaymentExpenses Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


export const settlementExpenses = async (req, res) => {
  const company_id = req.user.company_id;
  const accountant_id = req.user.id;
  try {
    const { user_id, amount, remarks } = req.body;
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User is required",
      });
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }
    const userWallet = await prisma.wallet.findFirst({
      where: {
        user_id: parseInt(user_id),
        company_id,
      },
    });
    if (!userWallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }
    if (userWallet.balance < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }
    const result = await prisma.$transaction(async (tx) => {
      const settlement = await tx.payments.create({
        data: {
          user_id: parseInt(user_id),
          company_id,
          accountant_id,
          financial_year: financial_year,
          amount: parseFloat(amount),
          payment_mode: "settlement",
          payment_date: new Date(),
          reference_no: 'NA',
          remarks: remarks || null,
          status: 2, // Mark as settled
        },
      });
      const wallet = await tx.wallet.update({
        where: {
          user_id: userWallet.user_id,
        },
        data: {
          balance: {
            decrement: parseFloat(amount),
          },
        },
      });
      await tx.walletHistory.create({
        data: {
          user_id: parseInt(user_id),
          wallet_id: wallet.id,
          company_id,
          payment_mode: "debit",
          type: "settlement_expense",
          amount: parseFloat(amount),
          balance: wallet.balance,
        },
      });

      return settlement;
    });
    return res.status(201).json({
      success: true,
      message: "Settlement created successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};