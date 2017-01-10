# record request and response
记录请求和响应数据

## install
```
npm install koa2-record
```

## usage
```
var koa = require('koa');
var app = new koa();
var record = require('../lib/record.js');
var remote = require('koa2-remote');

app.use(record.callback());

app.use(function (ctx, next) {
  // 修改header的host,后面将从该host处加载数据 
  ctx.request.header.host = 'laomu1988.github.io';
  return next();
});


app.use(remote());  // 从远程加载数据

app.listen(3000, function (err) {
  err && console.log(err) || console.log('start server at http://localhost:3000/');
});

```


## todo
* [ ] 清理数据
* [ ] api列表
* [ ] 获取列表
