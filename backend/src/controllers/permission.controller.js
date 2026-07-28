import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ✅ CREATE PERMISSION (system-wide catalog)
export const createPermission = async (req, res) => {
  try {
    const { name, label, module } = req.body;
    const created_by = req.user?.id;

    if (!created_by) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const permission = await prisma.permission.create({
      data: {
        name,
        label,
        module,
        created_by: String(created_by),
      },
    });

    return res.status(201).json({
      message: "Permission created successfully",
      data: permission,
    });
  } catch (error) {
    console.error(error);
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "This permission key already exists",
      });
    }
    return res.status(500).json({ message: error.message });
  }
};

// ✅ GET ALL PERMISSIONS (shared across companies)
export const getPermissions = async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { name: "asc" }],
    });

    return res.json(permissions);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
