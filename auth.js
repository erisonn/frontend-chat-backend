import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const PRIVATE_KEY = process.env.AUTH_KEY;

export const validateToken = (req, res, next) => {
  const token = req.cookies.jwt_auth ?? null;
  if (!token) {
    return res.status(401).json({
      message: "No access token provided",
    });
  }

  try {
    const payload = jsonwebtoken.verify(token, PRIVATE_KEY);
    req.headers["user"] = payload.user;
    return next();
  } catch (err) {
    console.log("validateToken >>>", err);
    return res.status(401).json({
      message: "Invalid access token",
    });
  }
};
