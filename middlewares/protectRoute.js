import jwt from 'jsonwebtoken';
import User from "../models/userModel.js";

const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, please login" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user by decoded ID (use 'decoded.id' since that's how you're signing the token)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found. Unauthorized." });
    }

    // Move to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Authorization error:", error.message);
    res.status(401).json({ message: "Not authorized, please login", error: error.message });
  }
};

export default protectRoute;
