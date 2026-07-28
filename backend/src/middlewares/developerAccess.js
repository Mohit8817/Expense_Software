/** API paths a developer user may access (Settings only). */
export const DEVELOPER_API_PREFIXES = [
  "/api/role",
  "/api/permission",
  "/api/tenant",
  "/api/developer",
];

export function isDeveloperUser(user) {
  return user?.is_developer === true;
}

/** Block developer users from all non-settings APIs. */
export const developerRouteGuard = (req, res, next) => {
  if (!isDeveloperUser(req.user)) return next();

  const url = req.originalUrl.split("?")[0];
  const allowed = DEVELOPER_API_PREFIXES.some((prefix) => url.startsWith(prefix));

  if (!allowed) {
    return res.status(403).json({
      message: "Developer access is limited to Settings only",
    });
  }

  next();
};
