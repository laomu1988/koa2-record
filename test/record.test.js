var koa = require('koa');
var app = new koa();
var record = require('../lib/record.js');
var remote = require('koa2-remote');
record.config(__dirname + '/record/');

// 清空记录
record.clean();

function onRecord(ctx, info) {
  console.log('req:', ctx.request.url);
}


app.use(record.callback(onRecord));

app.use(function (ctx, next) {
  ctx.request.header.host = 'laomu1988.github.io';
  return next();
});


app.use(remote());

app.listen(3000, function (err) {
  err && console.log(err) || console.log('start server at http://localhost:3000/');
});
hasRecord();
function hasRecord() {
  var list = record.getList();
  console.log('list:', list);
  if (list && list.length > 0) {
    record.getInfo(list[0]).then(console.log, console.error);
  }
}