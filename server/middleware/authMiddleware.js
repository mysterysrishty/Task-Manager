import { verifyToken } from "../utils/helpers.js";
import User from "../models/user.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ detail: 'Invalid token' });
    }

    const user = await User.findOne({ user_id: decoded.sub }).select('-password_hash -__v');
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }

    req.user = user.toObject();
    req.user._id = undefined;
    next();
  } catch (err) {
    return res.status(401).json({ detail: 'Authentication failed' });
  }
};
