const router = require("express").Router()
const { check } = require('express-validator');
const usersController = require("../controllers/usersController")
const { catchErrors } = require("../handlers/errorHandlers")

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


module.exports = router


