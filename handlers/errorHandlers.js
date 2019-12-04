const { validationResult } = require('express-validator');

exports.catchErrors = fn => {
  return function (req, res, next) {
    //Express Validator Error Handling
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    fn(req, res, next).catch(err => {
      //Validation Errors
      if (typeof err === "string") {
        res.status(401).json({
          message: err
        });
      } else {
        next(err);
      }
    });
  };
};

/*
  Development Error Handler
  In development we show good error messages so if we hit a syntax error or any other previously un-handled error, we can show good info on what happened
*/
exports.developmentErrors = (err, req, res, next) => {
  err.stack = err.stack || "";
  const errorDetails = {
    message: err.message,
    status: err.status,
    stack: err.stack
  };

  res.status(err.status || 500).json(errorDetails); // send JSON back
};

/*
  Production Error Handler
  No stacktraces and error details are leaked to user
*/
exports.productionErrors = (err, req, res, next) => {
  res.status(err.status || 500).json({
    error: "Internal Server Error"
  }); // send JSON back
};