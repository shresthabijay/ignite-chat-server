const router = require("express").Router()
const { check } = require('express-validator');
const usersController = require("../controllers/usersController")
const { catchErrors } = require("../handlers/errorHandlers")
const { jwtVerification } = require("../handlers/jwtVerification")

router.get("/", catchErrors(usersController.getUserDetails))

router.post("/register",
  [
    check('first_name').isString().isLength({ min: 1 }),
    check('last_name').isString().isLength({ min: 1 }),
    check('email').isEmail(),
    check('phone_number').isNumeric().isLength({ min: 10, max: 12 }),
    check('password').isString().isLength({ min: 8 })
  ],
  catchErrors(usersController.registerUser))

router.post("/login",
  [
    check('email').isEmail(),
    check('password').isString().isLength({ min: 8 })
  ],
  catchErrors(usersController.loginUser))

router.post("/sendFriendRequest",
  [
    check('email').isEmail(),
  ],
  jwtVerification,
  catchErrors(usersController.sendFriendRequest))

router.post("/updateUsersRelationship",
  [
    check('userId').isInt(),
    check('action').isString(),
  ],
  jwtVerification,
  catchErrors(usersController.updateUsersRelationShip))

router.get("/getFriendsList",
  [
  ],
  jwtVerification,
  catchErrors(usersController.getFriendsList))


module.exports = router


