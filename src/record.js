/**
 * 记录网路请求到本地
 **/
require("babel-core/register");
require("babel-polyfill");
var filter = require('filter-files');
var fs = require('fs');
var readFile = Promisify(fs.readFile, fs);
var writeFile = Promisify(fs.writeFile, fs);
var path = require('path');
var mkdir = require('mk-dir');


var dir = './koa2_record_data/';
var count = 10000;

/**
 * 配置文件存放目录
 * */
module.exports.config = function (_dir) {
  dir = _dir;
  mkdir(dir);
};

/**
 * 清除记录的数据
 * */
module.exports.clean = function () {
  if (!fs.existsSync(dir)) {
    return false;
  }
  var files = filter.sync(dir) || [];
  for (var i = 0; i < files.length; i++) {
    fs.unlinkSync(files[i]);
  }
};

/**
 * 取得所有文件列表
 * */
module.exports.getList = function () {
  var list = filter.sync(dir);
  return list.filter(file=> {
    return path.extname(file) === '.json'
  }).map(file => {
    return path.parse(file).name;
  }).sort(function (a, b) {
    return parseInt(a.substr(a.lastIndexOf('-') + 1)) - parseInt(b.substr(b.lastIndexOf('-') + 1));
  });
};

/**
 * 取得文件信息
 */
module.exports.getInfo = function (id, callback) {
  var info = null;
  return readFile(dir + '/' + id + '.json', 'utf8').then(function (data) {
    info = JSON.parse(data);
    (typeof callback === 'function') && callback(null, info);
    return info;
  }, function (err) {
    (typeof callback === 'function') && callback(err);
    throw err;
  });
};
/**
 * 取得相应body数据
 */
module.exports.getBody = function (id, callback) {
  return readFile(dir + '/' + id + '-response-body.data').then(function (data) {
    (typeof callback === 'function') && callback(null, data);
    return data;
  }, function (err) {
    (typeof callback === 'function') && callback(err);
    throw err;
  });
};

/**
 * koa使用的记录数据中间件
 * */
module.exports.callback = function (callback) {
  mkdir(dir);
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
    (typeof callback === 'function') && callback(ctx, info);
    // console.log('before:', ctx.url);
    await next();
    // console.log('after:', ctx.url);
    var res = ctx.response;
    info.endTime = Date.now();
    info.response = {
      statusCode: res.status,
      statusString: res.statusString,
      header: res.header,
      bodyType: typeof res.body
    };
    (typeof callback === 'function') && callback(ctx, info);
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