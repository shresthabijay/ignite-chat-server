const express = require("express");
const { developmentErrors, productionErrors } = require("./handlers/errorHandlers")

const app = express();

//Enable Cors
app.use(require("cors")());

//Add JSON Support
app.use(express.json());

//Add Body To Requests
app.use(express.urlencoded({ extended: false }));

//Bring in the routes
app.use("/users", require("./routes/users"))

// 404 Error
app.use(function (req, res, next) {
  res
    .json({
      message: "404 Not Found"
    })
});


if (process.env.MODE === "PRODUCTION") {
  //Use Production Errors
  app.use(productionErrors);
} else {
  //Use Development Errors
  app.use(developmentErrors);
}


module.exports = app;