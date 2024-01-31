const express = require("express");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.get("/", (req, res) => {
  res.send("User routes are working!");
});

router.post("/register", async (req, res) => {
  try {
    const { name, phoneNumber, password, priority } = req.body;

    const user = new User({ name, phoneNumber, password, priority });
    await user.save();
    res.status(201).send({ user, message: "User Created Successfully" });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      throw new Error("Unable to login , invalid credentials");
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new Error("Unable to login , invalid credentials");
    }

    const token = jwt.sign(
      {
        _id: user._id.toString(),
      },
      process.env.JWT_SECRET_KEY
    );

    res.send({ user, token, message: "Logged in successfully" });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// register a user
// login a user
module.exports = router;
