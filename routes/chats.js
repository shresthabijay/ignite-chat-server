const router = require("express").Router()
const { check } = require('express-validator');
const chatsController = require("../controllers/chatsController")
const { catchErrors } = require("../handlers/errorHandlers")
const { jwtVerification } = require("../handlers/jwtVerification")


router.post("/getPrivateMessages",
  [
    check('conversation_id').isInt(),
    check('timestamp').isString(),
    check('limit').isInt()
  ],
  jwtVerification,
  catchErrors(chatsController.getPrivateMessage))


router.post("/createGroups",
  [
    check('title').isString(),
  ],
  jwtVerification,
  catchErrors(chatsController.createGroups))

router.post("/addGroupMembers",
  [
    check('participant_id').isInt(),
    check('group_id').isInt()
  ],
  jwtVerification,
  catchErrors(chatsController.addGroupMembers))

router.post("/removeGroupMembers",
  [
    check('participant_id').isInt(),
    check('group_id').isInt()
  ],
  jwtVerification,
  catchErrors(chatsController.removeGroupMembers))

router.post("/addGroupMessages",
  [
    check('group_id').isInt(),
    check('message_type').isString(),
    check('message').isString(),
  ],
  jwtVerification,
  catchErrors(chatsController.createGroupMessage))

module.exports = router


