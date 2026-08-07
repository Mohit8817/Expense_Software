import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ CREATE ROLE (system-wide — shared by all companies)
export const createRole = async (req, res) => {
  try {
    const { name, description } = req.body;
    const created_by = req.user?.id;

    if (!created_by) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        created_by: String(created_by),
      },
    });

    return res.status(201).json({
      message: "Role created successfully",
      data: role,
    });
  } catch (error) {
    console.error(error);
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A role with this name already exists" });
    }
    return res.status(500).json({ message: error.message });
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
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

    const role = await prisma.role.findFirst({
      where: { id: Number(id) },
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
      data: role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existing = await prisma.role.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ message: "Role not found" });
    }

    const role = await prisma.role.update({
      where: { id: Number(id) },
      data: { name, description },
    });

    res.json(role);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A role with this name already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.role.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ message: "Role not found" });
    }

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

    if (!role_id || !Array.isArray(permission_ids)) {
      return res.status(400).json({
        message: "Role ID and permission_ids array required",
      });
    }

    const role = await prisma.role.findUnique({
      where: { id: Number(role_id) },
    });

    if (!role) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    const normalizedIds = [...new Set(permission_ids.map((pid) => Number(pid)).filter(Boolean))];

    const validPermissions = normalizedIds.length
      ? await prisma.permission.findMany({
          where: { id: { in: normalizedIds } },
          select: { id: true },
        })
      : [];

    if (validPermissions.length !== normalizedIds.length) {
      return res.status(400).json({
        message: "One or more permission IDs are invalid",
      });
    }

    await prisma.rolePermission.deleteMany({
      where: { role_id: Number(role_id) },
    });

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
      key: p.permission.name,
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
