import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
};

export const generateToken = (userId, email) =>
  jwt.sign(
    {
      email,
    },
    getJwtSecret(),
    {
      subject: userId,
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
};
