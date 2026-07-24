import { PrismaClient } from "@prisma/client";
import {
  ATTACHMENT_DOCUMENT_TYPES,
  deleteAttachmentsForDocument,
} from "../utils/attachmentUtils.js";

const prisma = new PrismaClient();

export const createProduct = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const user_id = req.user?.id;
    const { name, desc, hsn_sac, units, status } = req.body;

    if (!company_id || !user_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!name || !desc) {
      return res.status(400).json({
        success: false,
        message: "Name and Description are required.",
      });
    }

    const product = await prisma.productDetail.create({
      data: {
        company_id,
        user_id,
        name,
        desc,
        hsn_sac: hsn_sac || null,
        units: units || null,
        status: status != null ? Number(status) : 0,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const company_id = req.user?.company_id;

    if (!company_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const products = await prisma.productDetail.findMany({
      where: { company_id },
      orderBy: { id: "desc" },
    });

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const { id } = req.params;

    const product = await prisma.productDetail.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const { id } = req.params;
    const { name, desc, hsn_sac, units, status } = req.body;

    const product = await prisma.productDetail.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const updatedProduct = await prisma.productDetail.update({
      where: { id: Number(id) },
      data: {
        ...(name != null && { name }),
        ...(desc != null && { desc }),
        ...(hsn_sac !== undefined && { hsn_sac: hsn_sac || null }),
        ...(units !== undefined && { units: units || null }),
        ...(status != null && { status: Number(status) }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const { id } = req.params;

    const product = await prisma.productDetail.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    await deleteAttachmentsForDocument(company_id, ATTACHMENT_DOCUMENT_TYPES.PRODUCT, id);

    await prisma.productDetail.delete({ where: { id: Number(id) } });

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const importProducts = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const user_id = req.user?.id;
    const { products } = req.body;

    if (!company_id || !user_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No products to import.",
      });
    }

    const results = { created: 0, failed: 0, errors: [] };

    for (let index = 0; index < products.length; index += 1) {
      const row = products[index];
      const rowNum = index + 2;
      const name = row?.name?.trim();
      const desc = row?.desc?.trim();

      if (!name || !desc) {
        results.failed += 1;
        results.errors.push({
          row: rowNum,
          message: "Product Name and Description are required.",
        });
        continue;
      }

      try {
        await prisma.productDetail.create({
          data: {
            company_id,
            user_id,
            name,
            desc,
            hsn_sac: row.hsn_sac?.trim() || null,
            units: row.units?.trim() || null,
            status: row.status != null ? Number(row.status) : 1,
          },
        });
        results.created += 1;
      } catch (error) {
        results.failed += 1;
        results.errors.push({ row: rowNum, message: error.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${results.created} product(s) imported, ${results.failed} failed.`,
      data: results,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
