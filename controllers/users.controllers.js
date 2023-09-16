const Joi = require("joi");
require("dotenv").config();

const service = require("../models/users");

const bCrypt = require("bcryptjs");

const { User } = require("../models/users");

const jwt = require("jsonwebtoken");

const gravatar = require("gravatar");
const fs = require("fs").promises;
const path = require("path");
const Jimp = require("jimp");

const secret = process.env.JWT_SECRET;

const { nanoid } = require("nanoid");
const nodemailer = require("nodemailer");

const userValidator = Joi.object({
  email: Joi.string().required(),

  password: Joi.string()
    .trim()

    .required(),
  token: Joi.string(),
});

const userEmailValidator = Joi.object({
  email: Joi.string().required(),
});

const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.USER,
    pass: process.env.PASS,
  },
});

const verificationEmail = async (userEmail, verificationToken) => {
  const emailOptions = {
    from: "szymonsliwa@proton.me",
    to: userEmail,
    subject: "E-mail verification",
    html: `Copy the link to verify your email: http://localhost:3000/api/users/verify/${verificationToken}`,
  };

  transport.sendMail(emailOptions).catch((err) => console.log(err));
};

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
    const avatarURL = gravatar.url(email, {
      s: "200",
      r: "pg",
    });

    const hashPassword = bCrypt.hashSync(password, bCrypt.genSaltSync(6));

    const newUser = await User.create({
      email,
      password: hashPassword,
      avatarURL,
      verificationToken: nanoid(),
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

const updateAvatar = async (req, res, next) => {
  const { id } = req.user;

  try {
    const storeImage = path.join(process.cwd(), "public", "avatars");
    const { path: temporaryName, originalname } = req.file;

    await Jimp.read(`tmp/${originalname}`)
      .then((avatar) => {
        return avatar.resize(250, 250).greyscale().write(`tmp/${originalname}`);
      })
      .catch((err) => {
        console.error(err);
      });

    const ext = path.extname(originalname);
    const avatarNewName = `avatar-id_${id}${ext}`;
    const fileName = path.join(storeImage, avatarNewName);
    await fs.rename(temporaryName, fileName);

    const avatarNewURL = `/avatars/${avatarNewName}`;
    const response = await service.updateUserAvatar(id, avatarNewURL);

    return res.status(200).json({
      status: "success",
      code: 200,
      data: "OK",
      ResponseBody: {
        avatarURL: response.avatarURL,
      },
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const verify = async (req, res, next) => {
  console.log(req.body);
  const { email } = req.body;
  const validation = userEmailValidator.validate(req.body);

  if (validation.error?.message) {
    return res.status(400).json({ message: validation.error.message });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.verify) {
      return res
        .status(400)
        .json({ message: "Verification has already been passed" });
    }
    const newVerificationToken = user.verificationToken;
    console.log(newVerificationToken);
    await verificationEmail(email, newVerificationToken);
    res.status(200).json({
      status: "success",
      code: 200,
      message: "Verification email has been sent",
    });
  } catch (error) {
    next(error);
  }
};

const verifyUserByToken = async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const response = await service.getUserByVerificationToken(
      verificationToken
    );
    console.log(response);
    if (response) {
      await service.updateUserVerification(response.id);
      res.status(200).json({
        status: "success",
        code: 200,
        data: "OK",
        ResponseBody: {
          message: "Verification successful",
        },
      });
    } else {
      return res.status(404).json({
        status: "fail",
        code: 404,
        data: "Not found",
        ResponseBody: {
          message: "User not found",
        },
      });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  currentUser,
  updateAvatar,
  verify,
  // verificationToken,
  verifyUserByToken,
};
