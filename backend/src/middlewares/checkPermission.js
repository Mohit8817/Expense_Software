import { PrismaClient } from "@prisma/client";
import { isDeveloperUser } from "./developerAccess.js";
const prisma = new PrismaClient();

export const checkPermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      if (isDeveloperUser(req.user)) return next();

      const role_id = req.user.role_id;

      const permissions = await prisma.rolePermission.findMany({
        where: { role_id },
        include: { permission: true },
      });

      const hasPermission = permissions.some(
        (p) => p.permission.name === permissionKey
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};