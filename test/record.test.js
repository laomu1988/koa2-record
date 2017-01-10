var koa = require('koa');
var app = new koa();
var record = require('../lib/record.js');
var remote = require('koa2-remote');

app.use(record.callback());

app.use(function (ctx, next) {
  ctx.request.header.host = 'laomu1988.github.io';
  return next();
});


app.use(remote());

app.listen(3000, function (err) {
  err && console.log(err) || console.log('start server at http://localhost:3000/');
});