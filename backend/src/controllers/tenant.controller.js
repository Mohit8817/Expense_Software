import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function deleteLogoFile(filename) {
  if (!filename) return;
  const filePath = path.join(process.cwd(), "uploads", filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

function parseStatus(value) {
  return value !== false && value !== "0" && value !== 0 && value !== "false";
}

function slugUniqueId(name, suffix = "") {
  const base = (name || "TENANT")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
  return `${base || "TENANT"}${suffix}`.slice(0, 32);
}

async function ensureUniqueId(preferred) {
  let candidate = preferred;
  let attempt = 0;
  while (attempt < 10) {
    const exists = await prisma.tenant.findUnique({ where: { unique_id: candidate } });
    if (!exists) return candidate;
    attempt += 1;
    candidate = slugUniqueId(preferred, String(Date.now()).slice(-6));
  }
  return `TNT${Date.now()}`;
}

async function getAdminRoleId() {
  const role = await prisma.role.findFirst({ where: { name: "admin" } });
  if (!role) throw new Error("Admin role not found. Create an 'admin' role first.");
  return role.id;
}

/** Next short user_id like ADM1, ADM2 (matches EMP901 style). */
async function nextUserId(tx, prefix) {
  const users = await tx.User.findMany({
    where: { user_id: { startsWith: prefix } },
    select: { user_id: true },
  });
  let max = 0;
  const re = new RegExp(`^${prefix}(\\d+)$`, "i");
  for (const u of users) {
    const m = u.user_id.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}${max + 1}`;
}

const tenantInclude = {
  admin_user: {
    select: {
      id: true,
      username: true,
      email: true,
      status: true,
      is_tenant_admin: true,
    },
  },
};

export const getTenants = async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: tenantInclude,
      orderBy: { created_at: "desc" },
    });
    return res.json({ success: true, data: tenants });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getTenantById = async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: Number(req.params.id) },
      include: tenantInclude,
    });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    return res.json({ success: true, data: tenant });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

/** Branding for logged-in user's company (sidebar logo + name). */
export const getTenantBranding = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(400).json({ message: "Company not found on user" });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { unique_id: companyId },
      select: {
        name: true,
        tenant_showing_name: true,
        tenant_logo: true,
      },
    });

    return res.json({
      success: true,
      data: tenant || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const createTenant = async (req, res) => {
  try {
    const {
      unique_id,
      name,
      tenant_showing_name,
      email,
      password,
      phone,
      address,
      status,
    } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Company name, admin email and password are required" });
    }

    const preferredId = unique_id?.trim() || slugUniqueId(name);
    const tenantUniqueId = await ensureUniqueId(preferredId);

    const emailTaken = await prisma.User.findUnique({ where: { email: email.trim() } });
    if (emailTaken) {
      return res.status(409).json({ message: "Admin email is already in use" });
    }

    const adminRoleId = await getAdminRoleId();
    const createdBy = req.user?.email || String(req.user?.id || "system");
    const tenantStatus = parseStatus(status);
    const logoFile = req.file?.filename || null;

    const result = await prisma.$transaction(async (tx) => {
      const adminUserId = await nextUserId(tx, "ADM");

      const adminUser = await tx.User.create({
        data: {
          company_id: tenantUniqueId,
          user_id: adminUserId,
          username: name.trim(),
          email: email.trim(),
          password: password.trim(),
          reporting_head: "System",
          doj: new Date(),
          designation: "Tenant Admin",
          phone_no: phone?.trim() || null,
          status: tenantStatus,
          is_tenant_admin: true,
          role_id: adminRoleId,
          created_by: createdBy,
        },
      });

      return tx.tenant.create({
        data: {
          unique_id: tenantUniqueId,
          name: name.trim(),
          tenant_showing_name: tenant_showing_name?.trim() || name.trim(),
          tenant_logo: logoFile,
          email: email.trim(),
          phone: phone?.trim() || null,
          address: address?.trim() || null,
          status: tenantStatus,
          admin_user_id: adminUser.id,
          created_by: createdBy,
        },
        include: tenantInclude,
      });
    });

    return res.status(201).json({
      message: "Company (tenant) created successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Company ID or email already exists" });
    }
    return res.status(500).json({ message: error.message });
  }
};

export const updateTenant = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      name,
      tenant_showing_name,
      email,
      password,
      phone,
      address,
      status,
      remove_logo,
    } = req.body;

    const existing = await prisma.tenant.findUnique({
      where: { id },
      include: { admin_user: true },
    });

    if (!existing) return res.status(404).json({ message: "Tenant not found" });

    if (email?.trim() && email.trim() !== existing.email) {
      const emailTaken = await prisma.User.findFirst({
        where: {
          email: email.trim(),
          NOT: { id: existing.admin_user_id ?? 0 },
        },
      });
      if (emailTaken) {
        return res.status(409).json({ message: "Admin email is already in use" });
      }
    }

    const tenantStatus = parseStatus(status);
    const newLogo = req.file?.filename || null;
    const shouldRemoveLogo =
      remove_logo === true || remove_logo === "true" || remove_logo === "1";

    const updated = await prisma.$transaction(async (tx) => {
      if (existing.admin_user_id) {
        const userUpdate = {
          username: name?.trim() || existing.name,
          email: email?.trim() || existing.email,
          phone_no: phone?.trim() || null,
          status: tenantStatus,
        };
        if (password?.trim()) userUpdate.password = password.trim();

        await tx.User.update({
          where: { id: existing.admin_user_id },
          data: userUpdate,
        });
      }

      const tenantUpdate = {
        name: name?.trim() || existing.name,
        tenant_showing_name:
          tenant_showing_name?.trim() ||
          (name?.trim() ? name.trim() : existing.tenant_showing_name || existing.name),
        email: email?.trim() || existing.email,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        status: tenantStatus,
      };

      if (newLogo) {
        deleteLogoFile(existing.tenant_logo);
        tenantUpdate.tenant_logo = newLogo;
      } else if (shouldRemoveLogo) {
        deleteLogoFile(existing.tenant_logo);
        tenantUpdate.tenant_logo = null;
      }

      return tx.tenant.update({
        where: { id },
        data: tenantUpdate,
        include: tenantInclude,
      });
    });

    return res.json({
      message: "Company (tenant) updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const deleteTenant = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.tenant.findUnique({ where: { id } });

    if (!existing) return res.status(404).json({ message: "Tenant not found" });

    deleteLogoFile(existing.tenant_logo);

    await prisma.$transaction(async (tx) => {
      await tx.tenant.delete({ where: { id } });
      if (existing.admin_user_id) {
        await tx.User.delete({ where: { id: existing.admin_user_id } }).catch(() => null);
      }
    });

    return res.json({ message: "Company (tenant) deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
