import { PrismaClient, Prisma } from '@prisma/client';
import { validationResult } from "express-validator";
const prisma = new PrismaClient();



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

export const getpaymentExpenses = async (req, res) => {

  try {

    const company_id = req.user.company_id;

    // Wallet + User Details
    const wallets = await prisma.$queryRaw`

      SELECT
        w.id AS wallet_id,
        w.user_id,
        w.balance,
        u.username,
        u.email

      FROM Wallet w

      INNER JOIN User u
      ON u.id = w.user_id

      WHERE w.company_id = ${company_id}

      ORDER BY u.username ASC
    `;

    // Payments / Advances
    const advances = await prisma.$queryRaw`

      SELECT
        p.*

      FROM Payments p

      WHERE p.company_id = ${company_id}
      AND p.status = 1 -- Only completed advances
      ORDER BY p.createdAt DESC
    `;
    const settlements = await prisma.$queryRaw`
      SELECT
        p.*
      FROM Payments p
      WHERE p.company_id = ${company_id}
      AND p.status = 2 -- Only completed settlements
      ORDER BY p.createdAt DESC
    `;

    // Wallet Transaction History
    const walletHistory = await prisma.$queryRaw`

      SELECT
        wh.*

      FROM WalletHistory wh

      WHERE wh.company_id = ${company_id}

      ORDER BY wh.createdAt DESC
    `;

    // Merge Complete Data
    const finalData = wallets.map((wallet) => {

      // User Advance Payments
      const userAdvances = advances.filter(
        (item) => item.user_id === wallet.user_id
      );

      const settlement = settlements.filter(
        (item) => item.user_id === wallet.user_id
      );

      // Wallet Transactions
      const transactions = walletHistory.filter(
        (item) => item.wallet_id === wallet.wallet_id
      );

      // Total Advance Amount
    //   const totalAdvance = userAdvances.reduce(
    //     (sum, item) => sum + Number(item.amount),
    //     0
    //   );

      // Total Transaction Amount
    //   const totalTransaction = transactions.reduce(
    //     (sum, item) => sum + Number(item.amount),
    //     0
    //   );

      return {
        wallet_id: wallet.wallet_id,
        user_id: wallet.user_id,
        username: wallet.username,
        email: wallet.email,
        wallet_balance: wallet.balance,
        // total_advance_amount: totalAdvance,
        // total_transaction_amount: totalTransaction,
        advances: userAdvances,
        settlements: settlement,
        transaction_history: transactions
      };
    });

    return res.status(200).json({
      success: true,
      count: finalData.length,
      data: finalData

    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
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