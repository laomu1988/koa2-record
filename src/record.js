/**
 * 记录网路请求到本地
 **/
require("babel-core/register");
require("babel-polyfill");
var fs = require('fs');
var readFile = Promisify(fs.readFile, fs);
var writeFile = Promisify(fs.writeFile, fs);
var path = require('path');
var mkdir = require('mk-dir');


var dir = path.dirname(require.main.filename) + '/record/';
var count = 10000;

/**
 * 配置
 * */
module.exports.config = function (_dir) {
  dir = path.resolve(path.dirname(require.main.filename), _dir);
};

/**
 * 清除记录的数据
 * */
module.exports.clean = function () {

};

/**
 * 取得所有文件列表
 * */
module.exports.getList = function () {

};

/**
 * 取得文件
 */
module.exports.getInfo = function (id, callback) {
  var info = null, body = null;
  return readFile(dir + '/' + id + '.json').then(function (data) {
    info = JSON.stringify(data);
    if (info.response) {
      return readFile(dir + '/' + id + '-response-body.data', info.response.bodyType === 'string' ? 'utf8' : {});
    }
  }).then(function (data) {

  }, function () {

  });
};

/**
 * koa使用的记录数据中间件
 * */
module.exports.callback = function (callback) {
  mkdir(path.dirname(dir));
  return async function (ctx, next) {
    console.log('start:', ctx.url);
    count += 1;
    var req = ctx.request;
    var id = req.host.replace(/[\/\\:\.]/g, '_') + '_' + count + '-' + Date.now();
    var info = {
      record_id: id,
      startTime: Date.now(),
      request: {
        url: req.url,
        host: req.host,
        protocol: req.protocol,
        header: req.header
      }
    };
    if (req.body) {
      info.request.body = req.body;
    }
    ctx.record_info = info;
    typeof callback === 'function' && callback(ctx, info);
    console.log('before:', ctx.url);
    await next();
    console.log('after:', ctx.url);
    var res = ctx.response;
    info.endTime = Date.now();
    info.response = {
      statusCode: res.status,
      statusString: res.statusString,
      header: res.header,
      bodyType: typeof res.body
    };
    typeof callback === 'function' && callback(ctx, info);
    writeFile(dir + id + '.json', JSON.stringify(info, null, '    '), 'utf8').then(function () {
      if (typeof ctx.response.body == 'string') {
        return writeFile(dir + id + '-response-body.data', ctx.response.body, 'utf8');
      } else {
        return writeFile(dir + id + '-response-body.data', ctx.response.body);
      }
    }).then(function (data, err) {
      if (err) throw err;
      return data;
    }).catch(function (err) {
      console.log(err);
    })
  }
};


function Promisify(func, obj) {
  return function () {
    var args = Array.prototype.slice.call(arguments, 0);
    return new Promise(function (resolve, reject) {
      args = Array.prototype.concat(args, function (err, data) {
        if (err) return reject(err);
        resolve(data);
      });
      // console.log('argus:', args);
      func.apply(obj, args);
    });
  }
}