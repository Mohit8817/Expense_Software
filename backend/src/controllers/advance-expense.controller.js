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
      payment_date,
      remarks,
    } = req.body;

    const doc_file = req.file ? req.file.filename : null;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create advance expense record
      const advance = await tx.advanceExpense.create({
        data: {
          user_id: parseInt(user_id),
          company_id,
          project_id: project_id ? parseInt(project_id) : 0,
          accountant_id,
          amount: parseFloat(amount),
          payment_mode,
          payment_date: new Date(payment_date),
          remarks: remarks || null,
          doc_file,
        },
      });

      // 2. Upsert wallet — create if not exists, increment if exists
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

      // 3. Create wallet history entry
      const walletHistory = await tx.walletHistory.create({
        data: {
          user_id: parseInt(user_id),
          wallet_id: wallet.id,
          company_id,
          payment_mode: "credit",
          type: "advance_expense",
          amount: parseFloat(amount),
          balance: wallet.balance, // This will reflect the updated balance after the transaction
        },
      });

      return { advance, wallet, walletHistory };
    });

    return res.status(201).json({
      success: true,
      message: "Advance expense created successfully",
      data: result,
    });

  } catch (error) {
    console.error("Create AdvanceExpense Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAdvanceExpenses = (req, res) => {
  const company_id = req.user.company_id;
  
}
