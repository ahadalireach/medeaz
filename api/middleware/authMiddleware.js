const { verifyAccessToken } = require("../utils/jwt");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized to access this route" });
  }

  try {
    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res
        .status(401)
        .json({ success: false, message: "Token is invalid or expired" });
    }

    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized to access this route" });
  }
};

module.exports = { protect };
