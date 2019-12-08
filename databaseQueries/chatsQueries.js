exports.getUserGroups = async (userId) => {
  let data = await dbQuery(`
    SELECT group_par.group_id FROM group_participants as group_par
    INNER JOIN
    groups
    ON user_id=? 
  `, [userId])
  return data
}

exports.createGroupChat = async (creatorId, title) => {
  let data = await dbQuery(`
    INSERT INTO groups(creator_id,title)
    VALUES(?,?)
  `, [creatorId, title])

  let addData = await this.addGroupParticipants(creatorId, creatorId, data.results.insertId)

  return data.results
}

exports.checkIfTheUserBelongsToGroup = async (userId, groupId) => {
  let userData = await dbQuery(`
    SELECT COUNT(id) as count FROM group_participants
    WHERE group_id=? AND user_id=? 
  `, [groupId, userId])

  return userData.results[0].count === 1
}

exports.addGroupParticipants = async (userId, participantId, groupId) => {
  /* Checking if the user who is adding the participant is a member or the group creator*/

  let groupData = await dbQuery(`
    SELECT * FROM groups
    WHERE id=?
    LIMIT 1
  `, [groupId])

  let userData = await dbQuery(`
    SELECT * FROM group_participants
    WHERE group_id=? AND user_id=? 
    LIMIT 1
  `, [groupId, userId])

  if (userData.results.length === 0 && userId !== groupData.results[0].creator_id) throw "this user is not a participant or creator of this specific group!"

  /* Checking if the user is already a participant of this group */
  let participantData = await dbQuery(`
    SELECT * FROM group_participants
    WHERE group_id=? AND user_id=? 
    LIMIT 1
  `, [groupId, participantId])

  if (participantData.results.length >= 1) throw "this user is already a participant of this specific group!"

  let newParticipantAddData = await dbQuery(`
    INSERT INTO group_participants(group_id,user_id)
    VALUES(?,?)
  `, [groupId, participantId])

  return newParticipantAddData
}

exports.removeParticipantFromGroup = async (userId, participantId, groupId) => {
  /* Checking if the user who is adding the participant is a member */
  let groupData = await dbQuery(`
    SELECT * FROM groups
    WHERE id=?
    LIMIT 1
  `, [groupId])

  let userData = await dbQuery(`
    SELECT * FROM group_participants
    WHERE group_id=? AND user_id=? 
    LIMIT 1
  `, [groupId, userId])

  if (userData.results.length === 0 && userId !== groupData.results[0].creator_id) throw "this user is not a participant or creator of this specific group!"

  /* Checking if the user is already a participant of this group */
  let participantData = await dbQuery(`
    SELECT * FROM group_participants
    WHERE group_id=? AND user_id=? 
    LIMIT 1
  `, [groupId, participantId])

  if (participantData.results.length === 0) throw "this user is not a participant of this specific group!"

  let data = await dbQuery(`
    DELETE FROM group_participants
    WHERE user_id=? AND group_id=?
  `, [participantId, groupId])

  return data
}

exports.createGroupMessage = async (group_id, sender_id, messageType, message, attachment_url) => {
  let data = await dbQuery(`
    INSERT INTO  group_messages(group_id,message_type,message,attachment_url,sender_id)
    VALUES(?,?,?,?,?)
  `, [group_id, messageType, message, attachment_url, sender_id])

  return data.results
}

exports.createPrivateConversation = async (creator_id, participant_id) => {
  let alreadyExistData = await dbQuery(`
    SELECT * FROM private_conversations
    WHERE (user_one_id=? AND user_two_id=?)
    OR (user_one_id=? AND user_two_id=?)
  `, [creator_id, participant_id, participant_id, creator_id])

  if (alreadyExistData.results.length >= 1) throw "already exist private chat!"

  let data = await dbQuery(`
    INSERT INTO private_conversations(user_one_id,user_two_id)
    VALUES(?,?)
  `, [creator_id, participant_id])

  return data
}

exports.createPrivateMessage = async (sender_id, receiver_id) => {
  let alreadyExistData = dbQuery(`
    SELECT * FROM private_conversations
    WHERE (user_one_id=? AND user_two_id=?)
    OR (user_one_id=? AND user_two_id=?)
    LIMIT 1
  `, [creator_id, participant_id, participant_id, creator_id])

  if (alreadyExistData.results.length === 1) {

    let data = await dbQuery(`
      INSERT INTO private_conversations(private_conversation_id,user_one_id,user_two_id)
      VALUES(?,?)
    `, [alreadyExistData.results[0].id, sender_id, receiver_id])

    return data
  }
}

exports.checkIfUserBelongsToPrivateConversation = async (userId, conversation_id) => {
  let data = await dbQuery(`
     SELECT COUNT(id) as count FROM private_conversations
     WHERE id=? AND (
       user_one_id=? OR user_two_id=?
     )
    `, [conversation_id, userId, userId])

  return data.results[0].count === 1
}

exports.getPrivateMessages = async (conversation_id, timestamp, limit) => {
  let data = await dbQuery(`  
     SELECT * FROM private_messages
     WHERE private_conversation_id=? and created_at < ?
     LIMIT ${limit}
    `, [conversation_id, timestamp])

  return data.results
}
