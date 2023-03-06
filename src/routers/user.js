const express = require("express");
const User = require("../models/user");
const router = new express.Router();
const auth = require("../middleware/auth");
const sharp = require("sharp");
const multer = require("multer");
const config = require("../config");

const { sendWelcomeEmail, sendGoodByeEmail } = require("../emails/account");

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error("Please upload an image file"));
    }
    cb(undefined, true);
  },
});

router.get("/users/me", auth, async (req, res) => res.send(req.user));

router.post(
  "/users/me/avatar",
  auth,
  upload.single("upload"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;

    await req.user.save();
    res.send();
  },
  (err, req, res, next) => {
    res.status(400).send({ error: err.message });
  }
);

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set("Content-type", "image/png").send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

router.delete(
  "/users/avatar/me",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  },
  (err, req, res, next) => {
    res.status(500).send(e);
  }
);

router.get("/users", auth, async (req, res) => {
  if (!(req.user.role === "admin")) {
    return res.status(401).send("Not authorized");
  }
  try {
    const users = await User.find({});
    res.send(users);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/users/getUser", auth, async (req, res) => {
  //using async await -- alternative to promoise chaining
  try {
    if (!(req.user.role === "admin")) {
      return res.status(401).send();
    }
    const user = await User.findOne({ email: req.body.email });
    res.send(user);
  } catch (e) {
    res.status(404).send("No user found with the email : " + req.body.email);
  }
});

router.patch("/users/updateUser", auth, async (req, res) => {
  const updates = Object.keys(req.body);

  try {
    // const user = await User.findByIdAndUpdate(req.params.id,req.body,{new : true, runValidators : true});
    if (!(req.user.role === "admin")) {
      return res
        .status(401)
        .send("You dont have rights to perform this opeartion");
    }
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).send();
    }
    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();
    res.send(user);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.patch("/users/me", auth, async (req, res) => {
  const validUpdates = ["name", "email", "age", "password"];
  const updates = Object.keys(req.body);
  const filteredInvalidUpdates = updates.filter((update) => {
    return !validUpdates.includes(update);
  });

  if (filteredInvalidUpdates.length > 0) {
    return res
      .status(400)
      .send({ "Invalid Update values": filteredInvalidUpdates });
  }

  try {
    // const user = await User.findByIdAndUpdate(req.params.id,req.body,{new : true, runValidators : true});
    // const user = await User.findById(req.params.id);
    // if(!user){
    //     return res.status(404).send();
    // }
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

//Create User
router.post("/users", async (req, res) => {
  const validUpdates = ["name", "email", "age", "password"];
  const updates = Object.keys(req.body);
  const filteredInvalidUpdates = updates.filter(
    (update) => !validUpdates.includes(update)
  );

  if (filteredInvalidUpdates.length > 0) {
    return res
      .status(400)
      .send({ "Invalid Properties": filteredInvalidUpdates });
  }
  const user = new User(req.body);

  try {
    const emailExists = await User.findOne({ email: req.body.email });
    if (emailExists) {
      return res.status(400).send({ error: { message: "EMAIL_EXISTS" } });
    }
    if (!user.name) {
      user.name = user.email.substr(0, user.email.indexOf("@"));
    }
    const token = await user.generateAuthToken();
    await user.save();
    setTimeout(async () => {
      await User.findOneAndUpdate(
        { email: user.email },
        {
          $pull: { tokens: { token: token } },
        }
      );
    }, config.TOKEN_EXPIRES_IN);

    sendWelcomeEmail(user.email, user.name);
    res.status(201).send({
      name: user.name,
      idToken: token,
      email: user.email,
      expiresIn: config.TOKEN_EXPIRES_IN,
      localId: user._id,
    });
  } catch (e) {
    console.log(e)
    res.status(500).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const result = await User.findByCreds(req.body.email, req.body.password);
    if (!result.user) {
      return res.status(404).send({ error: { message: "EMAIL_NOT_FOUND" } });
    }
    if (result.message === "INVALID_PASSWORD") {
      return res.status(404).send({ error: { message: "EMAIL_NOT_FOUND" } });
    }
    const token = await result.user.generateAuthToken();
    await result.user.save();
    res.send({
      name: result.user.name,
      idToken: token,
      email: result.user.email,
      expiresIn: config.TOKEN_EXPIRES_IN,
      localId: result.user._id,
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((el) => {
      return !el.token === req.token;
    });
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((el) => false);
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

//delete all users except admin
router.delete("/users", auth, async (req, res) => {
  try {
    if (!(req.user.role === "admin")) {
      return res
        .status(401)
        .send("You dont have rights to perform this opeartion");
    }
    const result = await User.deleteMany({ role: { $ne: "admin" } });
    res.send(result.deletedCount + " users deleted");
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/users/deleteUser", auth, async (req, res) => {
  try {
    if (!(req.user.role === "admin")) {
      return res
        .status(401)
        .send("You are not authorized to perform this operation");
    }
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).send();
    }
    await user.remove();
    res.send(user);
  } catch (e) {
    res.status(500).send();
  }
});

//delete me
router.delete(
  "/users/me",
  auth,
  async (req, res) => {
    try {
      await req.user.remove();
      sendGoodByeEmail(req.user.email, req.user.name);

      res.send(req.user);
    } catch (e) {
      res.status(500).send();
    }
  },
  (err, req, res, next) => {
    console.log(err);
  }
);

module.exports = router;
