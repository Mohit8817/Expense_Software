import { isDeveloperUser } from "./developerAccess.js";

export const requireDeveloper = (req, res, next) => {
  if (!isDeveloperUser(req.user)) {
    return res.status(403).json({
      message: "Developer access only",
    });
  }
  next();
};
