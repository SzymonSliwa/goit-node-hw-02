const mongoose = require("mongoose");
const { Schema } = mongoose;
const bCrypt = require("bcryptjs");

const user = new Schema({
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  subscription: {
    type: String,
    enum: ["starter", "pro", "business"],
    default: "starter",
  },
  token: {
    type: String,
    default: null,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
  avatarURL: {
    type: String,
  },
  verify: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    required: [true, "Verify token is required"],
  },
});

user.methods.validPassword = function (password) {
  return bCrypt.compareSync(password, this.password);
};

const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

const loginUser = async (id, token) => {
  return User.findByIdAndUpdate({ _id: id }, { token: token }, { new: true });
};

const getLogoutUser = async (id) => {
  return User.findByIdAndUpdate({ _id: id }, { token: null }, { new: true });
};

const getUserById = async (id) => {
  return User.findOne({ _id: id });
};

const updateUserAvatar = async (id, avatarURL) => {
  return User.findByIdAndUpdate({ _id: id }, { avatarURL }, { new: true });
};

const getUserByVerificationToken = (verificationToken) => {
  return User.findOne({ token: verificationToken });
};

const updateUserVerification = async (id) => {
  return User.findByIdAndUpdate(
    { _id: id },
    { verificationToken: null, verify: true }
  );
};

const User = mongoose.model("user", user, "users");

module.exports = {
  getUserByEmail,
  loginUser,
  getLogoutUser,
  getUserById,
  updateUserAvatar,
  getUserByVerificationToken,
  updateUserVerification,
  User,
};
