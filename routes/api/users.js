const express = require("express");

const router = express.Router();

const usersControllers = require("./../../controllers/users.controllers");

const { auth } = require("./../../middleware/auth");

const { upload } = require("../../middleware/upload");

router.post("/signup", usersControllers.registerUser);

router.post("/login", usersControllers.loginUser);

router.get("/logout", auth, usersControllers.logoutUser);

router.get("/current", auth, usersControllers.currentUser);

router.patch(
  "/avatars",
  auth,
  upload.single("avatar"),
  usersControllers.updateAvatar
);

module.exports = router;
