// middlewares/auth.js

const jwt = require("jsonwebtoken");

const userAuth = (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    // Return here to stop execution
    return res.json({ success: false, message: "Not Authorized. Login Again" });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    if (tokenDecode.id) {
      req.userId = tokenDecode.id; // If successful, call next() and let the function end
      next();
    } else {
      // Return here as well
      return res.json({
        success: false,
        message: "Not Authorized. Login Again",
      });
    }
  } catch (error) {
    // Return here after catching an error
    return res.json({ success: false, message: error.message });
  }
};

module.exports = userAuth;
