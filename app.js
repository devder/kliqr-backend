const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');
const errorHandler = require('./controllers/error');
const cors = require('cors');


const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const transactionsRouter = require('./routes/transactions');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


// set local variables middleware
app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.hostName = req.headers.host;
  res.locals.title = 'KliQr Assessment';
  // continue on to next function in middleware chain
  next();
});

app.use('/api/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/transactions', transactionsRouter,)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// error handler
app.use(errorHandler)

module.exports = app;
