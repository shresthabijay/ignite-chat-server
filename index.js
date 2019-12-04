require("dotenv").config();
const jwt = require("jsonwebtoken")

var mysql = require('mysql');

var pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
});

pool.getConnection(function (err, connection) {
  if (err) throw err; // not connected!
  console.log("Database connected!")
});

dbQuery = async (queryString, values) => {
  return new Promise((resolve, reject) => {
    pool.query(queryString, values, (error, results, fields) => {
      if (error) reject(error)
      resolve({ results, fields })
    })
  })
}

const app = require("./app");
var server = require('http').Server(app);

server.listen(process.env.PORT, () => {
  console.log("Listening on port", process.env.PORT);
});

var io = require('socket.io')(server);

io.origins('*:*')

let users = []

io.
  use(function (socket, next) {
    if (socket.handshake.query && socket.handshake.query.token) {
      jwt.verify(socket.handshake.query.token, process.env.SECRET, function (err, decoded) {
        if (err) return next(new Error('connect_error'));
        socket.decoded = decoded;
        next();
      });
    } else {
      next(new Error('connect_error'));
    }
  }).on('connection', function (socket) {
    //** On Authenticated Socket Connections  **/
    users.push({ ...socket.decoded })
    console.log(users, socket.decoded)
    socket.broadcast.emit("onlineUsersList", { users })
    socket.on('send-message', function (data) {
      socket.broadcast.emit('recieve-message', { message: data.message });
    });

    socket.on('getOnlineUsers', () => {
      socket.emit("onlineUsersList", { users })
    })

    socket.on('disconnect', () => {
      users = users.filter((data) => {
        if (socket.decoded.id === data.id) {
          return false
        }

        return true
      })

      socket.broadcast.emit("onlineUsersList", { users })
    })
  });




