import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

//   CREATE PERMISSION
export const createPermission = async (req, res) => {
  try {
    const { name, label, module } = req.body;

    const company_id = req.user?.company_id;
    const created_by = req.user?.id;

    console.log("USER:", req.user);

    if (!company_id || !created_by) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const permission = await prisma.permission.create({
      data: {
        name,
        label,
        module,
        company_id,
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
        message: "This permission key already exists for your company",
      });
    }
    return res.status(500).json({ message: error.message });
  }
};

//   GET PERMISSIONS (COMPANY BASED)
export const getPermissions = async (req, res) => {
  try {
    const company_id = req.user?.company_id;

    const permissions = await prisma.permission.findMany({
      where: { company_id },
      orderBy: { created_at: "desc" },
    });

    return res.json(permissions);

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


