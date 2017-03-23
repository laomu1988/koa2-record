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
var record = require('koa2-record');
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



## api
* `config(dir)`  配置记录存放目录
* `config({dir, callback})` 配置存放目录和有记录时的回调地址
* `clean()`      清空记录数据
* `callback(onRecord)` 生成koa@next的中间件,当有新的请求或者响应返回时调用onRecord
* `getInfo(id,[callback])` 获取记录的详细情况,返回promise
* `getBody(id,[encode],[callback])` 获取记录的返回数据,返回promise
* `getPath(id)` 获取记录信息位置和body存放路径,返回{info:'info_path',body: 'body_path'}
* `getList()`    文件夹内获取所有的记录id



## info介绍
    onRecord和config配置中的callback触发时将有两个参数,ctx和info,其中ctx为koa@next中的ctx对象,info部分数据和ctx保持一致,info对象有如下属性

- id: 记录id
- startTime: 请求开始时间
- endTime: 请求结束时间
- request: 请求内容
    - url
    - host
    - protocol
    - method
    - header
    - body
- response  响应内容(请求阶段时未定义)
    - status
    - statusString
    - header

## todo
* [x] 清理数据
* [x] 请求内容是否被修改过
* [x] 响应的body类型
* [x] 获取列表


## history
- v1.0.3
    * 增加method,record_id修改为id
- v1.0.2
    * 增加getPath,获取存放info和response body的路径
- v1.0.1
    * 清理文件clean
    * getBody增加参数编码getBody(record_id,[encode],[callback])
- v1.0.0
    * 记录请求
