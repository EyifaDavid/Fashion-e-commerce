import jwt from "jsonwebtoken";
import User from "../models/user.js";

// Prefer the httpOnly cookie, but also accept the JWT via the Authorization
// header (used by clients that can't reliably store/send Secure cookies, e.g.
// some mobile browsers / ITP). fetchWithAuth + apiSlice always send both.
const readToken = (req) => {
  const cookieToken = req.cookies?.token;
  if (cookieToken) return cookieToken;

  const header = req.headers?.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();

  return null;
};

const protectRoute = async (req, res, next) => {
  try {
    const token = readToken(req);

    if (token) {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

      const resp = await User.findById(decodedToken.userId).select(
        "isAdmin email"
      );

      req.user = {
        email: resp.email,
        isAdmin: resp.isAdmin,
        _id: decodedToken.userId,
      };

      next();
    } else {
      return res
        .status(401)
        .json({ status: false, message: "Not authorized. Try login again." });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(401)
      .json({ status: false, message: "Not authorized. Try login again." });
  }
};

const isAdminRoute = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(401).json({
      status: false,
      message: "Not authorized as admin. Try login as admin.",
    });
  }
};

export { isAdminRoute, protectRoute };
