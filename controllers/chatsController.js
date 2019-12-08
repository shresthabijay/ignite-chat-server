const chatsQueries = require("../databaseQueries/chatsQueries")

exports.getPrivateMessage = async (req, res, next) => {

  try {
    let userAccess = await chatsQueries.checkIfUserBelongsToPrivateConversation(req.body.decoded.id, req.body.conversation_id)

    if (!userAccess) {
      res.status(403).json({ message: "user doesn't have access to this chat!" })
      return
    }

    let data = await chatsQueries.getPrivateMessages(req.body.conversation_id, req.body.timestamp, req.body.limit)
    res.status(200).json({ data })
  }
  catch (err) {
    throw err
  }
}


exports.createGroups = async (req, res, next) => {
  try {
    let groupData = await chatsQueries.createGroupChat(req.body.decoded.id, req.body.title)
    res.status(200).json({ data: groupData })
  }
  catch (err) {
    throw err
  }
}

exports.addGroupMembers = async (req, res, next) => {
  try {
    let data = await chatsQueries.addGroupParticipants(req.body.decoded.id, req.body.participant_id, req.body.group_id)
    res.status(200).json({ data: "user added successfully" })
  }
  catch (err) {
    throw err
  }
}

exports.removeGroupMembers = async (req, res, next) => {
  try {
    let data = await chatsQueries.removeParticipantFromGroup(req.body.decoded.id, req.body.participant_id, req.body.group_id)
    res.status(200).json({ data: "user removed from the group successfully" })
  }
  catch (err) {
    throw err
  }
}

exports.createGroupMessage = async (req, res, next) => {
  try {
    let doesUserBelongToGroup = await chatsQueries.checkIfTheUserBelongsToGroup(req.body.decoded.id, req.body.group_id)

    if (!doesUserBelongToGroup) {
      res.status(403).json({ message: "user doesn't have access to this chat!" })
      return
    }

    let data = await chatsQueries.createGroupMessage(req.body.group_id, req.body.decoded.id, req.body.message_type, req.body.message, req.body.attachment_url)
    res.status(200).json({ data: "message added successfully" })
  }
  catch (err) {
    throw err
  }
}