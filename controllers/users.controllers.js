const Joi = require("joi");
require("dotenv").config();

const service = require("../models/users");

const bCrypt = require("bcryptjs");

const { User } = require("../models/users");

const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET;

const userValidator = Joi.object({
  email: Joi.string().required(),

  password: Joi.string()
    .trim()

    .required(),
  token: Joi.string(),
});

const registerUser = async (req, res, next) => {
  const { email, password } = req.body;
  const validatedUser = userValidator.validate(req.body);

  if (validatedUser.error?.message) {
    return res.status(400).json({
      status: "error",
      data: "Bad Request",
      message: validatedUser.error.message,
    });
  }
  const user = await service.getUserByEmail(email);
  if (user) {
    return res.status(409).json({
      status: "fail",
      code: 409,
      data: "Conflict",
      ResponseBody: {
        message: "Email in use",
      },
    });
  }
  try {
    const hashPassword = bCrypt.hashSync(password, bCrypt.genSaltSync(6));

    const newUser = await User.create({
      email,
      password: hashPassword,
    });

    res.status(201).json({
      status: "success",

      data: "Created",
      message: "Registration successful",
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        password: hashPassword,
      },
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  const validatedLogin = userValidator.validate(req.body);
  if (validatedLogin.error?.message) {
    return res.status(400).json({
      status: "error",
      data: "Bad Request",
      message: validatedLogin.error.message,
    });
  }

  try {
    const user = await service.getUserByEmail(email);

    if (!user || !user.validPassword(password)) {
      return res.status(401).json({
        status: "fail",
        code: 401,
        data: "Unauthorized",
        ResponseBody: {
          message: "Email or password is wrong",
        },
      });
    } else {
      const payload = {
        id: user._id,
        email: user.email,
      };

      const token = jwt.sign(payload, secret, { expiresIn: "1h" });
      const response = await service.loginUser(user._id, token);
      return res.status(200).json({
        status: "success",
        code: 200,
        data: "OK",
        ResponseBody: {
          token: response.token,
          user: {
            email: response.email,
            subscription: response.subscription,
          },
        },
      });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    const { id } = req.user;
    await service.getLogoutUser(id);
    res.status(204).json({});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const currentUser = async (req, res, next) => {
  try {
    const { email, subscription, id } = req.user;
    //  const response = await service.getUserById(id);
    res.status(200).json({
      status: "success",
      code: 200,
      data: "OK",
      ResponseBody: {
        email,
        subscription,
        id,
      },
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  currentUser,
};
