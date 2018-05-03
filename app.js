const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');
const Joi = require('joi');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const app = express();

const contentSchema = {
  id: Joi.date().timestamp(),
  url: Joi.string().uri().required(),
  delay: Joi.number().integer().positive().required(),
  caption: Joi.string().required().allow('').default('')
};

const contentBodySchema = {
  contents: Joi.array().items({
    id: Joi.date().timestamp(),
    url: Joi.string().uri().required(),
    delay: Joi.number().integer().positive().required(),
    order: Joi.number().integer().positive().required(),
    caption: Joi.string().required().allow('').default('')
  })
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  //res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req, res) => {
  res.send('I&Co TV Content Management');
});

app.get('/api', (req, res) => {
  res.status(404).send('Not Found')
});

app.get('/api/contents', (req, res) => {
  fs.readFile('contents.json', (err, data) => {
    if (err) {
      res.status(404).send(err)
    }
    else {
      let contents = JSON.parse(data);
      res.json(contents);
    }
  });
});

app.post('/api/contents', (req, res) => {
  const joiRes = Joi.validate(req.body, contentSchema);

  if (joiRes.error) {
    res.status(400).send(joiRes.error);
    return;
  }

  let newContent = joiRes.value;
  newContent['id'] = Date.now();

  fs.readFile('contents.json', (err, data) => {
    let fileContents = {
      contents: []
    };

    if (!err) {
      fileContents = JSON.parse(data);
    }

    fileContents.contents.push(newContent);
    let json = JSON.stringify(fileContents);

    fs.writeFile('contents.json', json, (err) => {
      if (err) {
        res.status(400).send(err);
        return;
      }
      res.json(json);
    });
  });
});

app.post('/api/contents/all', (req, res) => {
  const joiRes = Joi.validate(req.body, contentBodySchema);

  if (joiRes.error) {
    res.status(400).send(joiRes.error);
    return;
  }

  let json = JSON.stringify(joiRes.value);

  fs.writeFile('contents.json', json, (err) => {
    if (err) {
      res.status(400).send(err);
      return;
    }
    res.json(json);
  });
});

app.put('/api/contents/:id', (req, res) => {
  res.status(400).send('No support for update!');
});

app.delete('/api/contents/:id', (req, res) => {
  let id = req.params.id;

  console.log('id: ' + id);

  fs.readFile('contents.json', (err, data) => {
    if (err) {
      res.status(500).send(err);
      return;
    }

    let fileContents = JSON.parse(data);

    let content = fileContents.contents.find(c => c.id == id);
    if (!content) {
      res.status(404).send('Content not found!');
      return;
    }

    const index = fileContents.contents.indexOf(content);

    fileContents.contents.splice(index, 1);
    let json = JSON.stringify(fileContents);

    fs.writeFile('contents.json', json, (err) => {
      if (err) {
        res.status(400).send(err);
        return;
      }
      res.json(json);
    });
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
