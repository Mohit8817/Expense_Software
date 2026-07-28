export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

export function isDeveloperUser(user = getStoredUser()) {
  return user?.is_developer === true;
}

export const DEVELOPER_ROUTE_PREFIXES = [
  "/role/",
  "/permission/",
  "/tenant/",
  "/settings/tally-manual",
];

export function isDeveloperRoute(pathname) {
  return DEVELOPER_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function getDeveloperHomeRoute() {
  return "/role/list";
}
