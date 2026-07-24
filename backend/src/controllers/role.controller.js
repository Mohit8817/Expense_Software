import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

//   CREATE ROLE
export const createRole = async (req, res) => {
  try {
    const { name, description } = req.body;

    const company_id = req.user?.company_id;
    const created_by = req.user?.id;

    if (!company_id || !created_by) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        company_id,
        created_by: String(created_by),
      },
    });

    return res.status(201).json({
      message: "Role created successfully",
      data: role,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

//   GET ROLES WITH PERMISSIONS
export const getRoles = async (req, res) => {
  try {
    const company_id = req.user?.company_id;

    const roles = await prisma.role.findMany({
      where: { company_id },
      orderBy: { created_at: "desc" },
    });

    return res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;

    const role = await prisma.role.findFirst({
      where: {
        id: Number(id),
        company_id,
      },
      include: {
        permissions: {
          select: {
            permission_id: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    return res.json({
      success: true,
      data: role, //   FIXED
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const role = await prisma.role.update({
      where: { id: Number(id) },
      data: { name, description },
    });

    res.json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.role.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Role deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignPermissionsToRole = async (req, res) => {
  try {
    const { role_id, permission_ids } = req.body;

    const company_id = req.user?.company_id;

    if (!role_id || !Array.isArray(permission_ids)) {
      return res.status(400).json({
        message: "Role ID and permission_ids array required",
      });
    }

    // 🔍 Check role belongs to same company
    const role = await prisma.role.findFirst({
      where: {
        id: Number(role_id),
        company_id,
      },
    });

    if (!role) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    const normalizedIds = [...new Set(permission_ids.map((pid) => Number(pid)).filter(Boolean))];

    const validPermissions = normalizedIds.length
      ? await prisma.permission.findMany({
          where: {
            company_id,
            id: { in: normalizedIds },
          },
          select: { id: true },
        })
      : [];

    if (validPermissions.length !== normalizedIds.length) {
      return res.status(400).json({
        message: "One or more permissions do not belong to your company",
      });
    }

    // 🧹 Remove old permissions
    await prisma.rolePermission.deleteMany({
      where: { role_id: Number(role_id) },
    });

    // ✅ Add new permissions
    if (validPermissions.length) {
      await prisma.rolePermission.createMany({
        data: validPermissions.map(({ id }) => ({
          role_id: Number(role_id),
          permission_id: id,
        })),
        skipDuplicates: true,
      });
    }

    return res.json({
      message: "Permissions assigned successfully",
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const getMyPermissions = async (req, res) => {
  try {
    const role_id = req.user?.role_id;

    if (!role_id) {
      return res.status(400).json({
        message: "Role ID missing in token",
      });
    }

    const permissions = await prisma.rolePermission.findMany({
      where: {
        role_id: Number(role_id),
      },
      include: {
        permission: true,
      },
    });

    const result = permissions.map((p) => ({
      id: p.permission.id,
      key : p.permission.name,
      label: p.permission.label,
      module: p.permission.module,
    }));

    return res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};