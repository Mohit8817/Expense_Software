import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  try {
    const bearerHeader = req.headers.authorization;
    if (!bearerHeader) return res.status(401).json({ message: "No token Provided" });

    if (!bearerHeader.startsWith("Bearer "))
      return res.status(403).json({ message: "Invalid token format" });

    const token = bearerHeader.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(403).json({ message: "Invalid token" });
  }
};
