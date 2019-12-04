const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

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
