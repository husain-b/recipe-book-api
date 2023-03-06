const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Recipe = require("./recipe");
const config = require("../config");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid Email");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minLength: 6,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error('Password should not contain "password"');
        }
      },
    },
    age: {
      type: Number,
      trim: true,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("Age cannot be negative");
        }
      },
    },
    role: {
      type: String,
      default: "consumer",
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("recipes", {
  ref: "recipe",
  localField: "_id",
  foreignField: "owner",
});

userSchema.methods.toJSON = function () {
  const user = this;

  const userObject = user.toObject();

  delete userObject.role;
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign(
    { _id: user._id.toString() },
    config.JWT_SECRET,
    { expiresIn: config.TOKEN_EXPIRES_IN }
  );
  user.tokens = user.tokens.concat({ token });
  return token;
};

userSchema.statics.findByCreds = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    return { user: user, message: "EMAIL_NOT_FOUND" };
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return { user: user, message: "INVALID_PASSWORD" };
  }

  return { user: user, message: "USER_FOUND" };
};

userSchema.pre("remove", async function (next) {
  const user = this;
  await Recipe.deleteMany({ owner: user._id });
  next();
});

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
