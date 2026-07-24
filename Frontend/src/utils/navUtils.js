export const NAV_RESET_STATE_KEY = "sidebarReset";

export const normalizePath = (path) => {
  if (!path || path === "#") return "";
  const value = path.startsWith("/") ? path : `/${path}`;
  return value.replace(/\/+$/, "").toLowerCase();
};

export const pathsMatch = (currentPath, targetPath) => {
  const current = normalizePath(currentPath);
  const target = normalizePath(targetPath);
  if (!target) return false;
  return current === target || current.endsWith(target);
};

/** Remount route content when the same sidebar link is clicked again. */
export const getOutletKey = (location) =>
  `${location.pathname}${location.state?.[NAV_RESET_STATE_KEY] ?? ""}`;
