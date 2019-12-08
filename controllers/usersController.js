const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { user_relationships } = require('../constants')

exports.getUserDetails = async (req, res, next) => {
  let data = await dbQuery('SELECT * FROM users')
  res.json(data)
}

exports.registerUser = async (req, res, next) => {
  //Checking if the user with common email or phone number already exists
  let emailData = await dbQuery(`
    SELECT COUNT(id) as count FROM users WHERE email=? OR phone_number=? 
  `, [req.body.email, req.body.phone_number])

  if (emailData.results[0].count > 0) throw "dupicate-phone-email"

  //Hashing the passoword

  var hash = bcrypt.hashSync(req.body.password, 8);

  //Registering the user into the database
  let registerData = await dbQuery(
    `
  INSERT INTO users(first_name,last_name,email,phone_number,password)
  VALUES ( ? , ? , ? , ? ,? )
  `, [req.body.first_name, req.body.last_name, req.body.email, req.body.phone_number, hash])

  var token = jwt.sign({ id: registerData.results.insertId }, process.env.SECRET, {
    expiresIn: 86400 // expires in 24 hours
  });

  res.status(200).json({ auth: true, token })
}

exports.loginUser = async (req, res, next) => {

  //Checking if the user is valid and credentials are correct
  let userData = await dbQuery(`
    SELECT *  FROM users WHERE email=?
  `, [req.body.email])

  try {
    var isValidUser = bcrypt.compareSync(req.body.password, userData.results[0].password);

    if (isValidUser) {
      var token = jwt.sign({ id: userData.results[0].id }, process.env.SECRET, {
        expiresIn: 86400 // expires in 24 hours
      });
      res.status(200).json({ auth: true, token })
    }
    else {
      throw "invalid email or password"
    }

  }
  catch (err) {
    throw err
  }
}

exports.sendFriendRequest = async (req, res, next) => {

  let action_user_id = req.body.decoded.id

  /* checking if the user with these info exits */
  let userData = await dbQuery(`
    SELECT * FROM users WHERE email=? LIMIT 1
  `, [req.body.email])

  if (userData.results.length === 0) {
    res.status(400).json({ message: "no such user found!" })
    return
  }

  /* rejecting the request if user is trying to send request to themself*/
  if (userData.results[0].id === req.body.decoded.id) {
    res.status(403).json({ message: "forbidden!" })
  }

  /* checking if there already exist relationship between two users*/
  let relationshipData = await dbQuery(`
    SELECT * FROM users_relationship WHERE user_one_id=? AND user_two_id=?
    UNION 
    SELECT * FROM users_relationship WHERE user_one_id=? AND user_two_id=?
    LIMIT 1
  `, [req.body.decoded.id, userData.results[0].id, userData.results[0].id, req.body.decoded.id])

  /* if relationship exists ...*/
  if (relationshipData.results.length === 1) {
    switch (relationshipData.results[0].status) {
      case user_relationships.pending:
        res.status(400).json({ message: "already on pending!" })
        return
      case user_relationships.accepted:
        res.status(400).json({ message: "already friends!" })
        return
      case user_relationships.blocked:
        res.status(403).json({ message: "this user has been blocked by the fellow user!" })
        return
      case user_relationships.declined:
        /* updating the existing relationship to pending only if the relation is previously declined */
        let sendRequestData = await dbQuery(`
          UPDATE users_relationship SET status=?,action_user_id=?,user_one_id=?,user_two_id=?
          WHERE id=?
        `, [user_relationships.pending, action_user_id, req.body.decoded.id, userData.results[0].id, relationshipData.results[0].id])

        res.status(200).json({ message: "friend request sent!" })
        return
    }
  }
  else {
    /* if realtionship doesn't exist create a new one and set status to pending */
    try {
      let sendRequestData = await dbQuery(`
      INSERT INTO users_relationship(user_one_id,user_two_id,status,action_user_id)
      VALUES(?,?,?,?)
    `, [req.body.decoded.id, userData.results[0].id, user_relationships.pending, req.body.decoded.id])
      res.status(200).json({ message: "friend request sent!" })
      return
    }
    catch (err) {
      throw err
    }
  }


}

exports.updateUsersRelationShip = async (req, res, next) => {

  let action_user_id = req.body.decoded.id
  /* retrieving the already existing relationship between two users */
  let relationshipData = await dbQuery(`
    SELECT * FROM users_relationship WHERE user_one_id=? AND user_two_id=?
    UNION 
    SELECT * FROM users_relationship WHERE user_one_id=? AND user_two_id=?
  `, [req.body.decoded.id, req.body.userId, req.body.userId, req.body.decoded.id])

  if (relationshipData.results.length === 0) {
    res.status(400).json({ message: "no such relation exist!" })
    return
  }

  /* if the user who sent the update request has been blocked by second user then he can't perform any action.
     But the second user can change the status from blocked to other types
  */

  if (relationshipData.results[0].status === user_relationships.blocked && relationshipData.results[0].action_user_id !== req.body.decoded.id) {
    res.status(403).json({ message: "this user has been blocked by the fellow user!" })
    return
  }

  let statusNumber = null
  /* getting appropriate status number for given actions */
  switch (req.body.action) {
    case "declined":
      statusNumber = user_relationships.declined
      break
    case "accepted":
      /*only the recipient(user_two_id) is allowed to accept the request not the sender(user_one_id)*/
      if (relationshipData.results[0].user_one_id === req.body.decoded.id) {
        res.status(403).json({ message: "only users who recieved the request can accept it!" })
        return
      }
      statusNumber = user_relationships.accepted
      break
    case "blocked":
      statusNumber = user_relationships.blocked
      break
  }

  if (statusNumber === null) {
    res.status(403).json({ message: "proper action required!" })
    return
  }

  /* updating the relationship */
  try {
    let updateRelationShipData = await dbQuery(`
    UPDATE users_relationship SET status=?,action_user_id=?
    WHERE id=?
  `, [statusNumber, action_user_id, relationshipData.results[0].id])

    res.status(200).json({ message: "updated user relationship!" })
    return
  }
  catch (err) {
    throw err
  }
}

exports.getFriendsList = async (req, res) => {

  let friendsData = await dbQuery(`
    SELECT users.first_name,users.last_name,users.id,users.email,users.phone_number,users.is_active 
    FROM (
      SELECT UR1.user_one_id as userId 
      FROM (
        SELECT user_one_id FROM users_relationship
        WHERE (user_one_id=? OR user_two_id=?)
        AND status=?
      ) as UR1 
    WHERE UR1.user_one_id!=?
    UNION
    SELECT UR2.user_two_id FROM (
        SELECT user_two_id FROM users_relationship
        WHERE (user_one_id=? OR user_two_id=?)
        AND status=?
    ) as UR2 
    WHERE UR2.user_two_id!=?) as friendlist
    JOIN users ON users.id=friendlist.userId
  `, [req.body.decoded.id, req.body.decoded.id, user_relationships.accepted, req.body.decoded.id, req.body.decoded.id, req.body.decoded.id, user_relationships.accepted, req.body.decoded.id])

  res.status(200).json({ data: friendsData.results })

}

