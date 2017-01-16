/**
 * 记录网路请求到本地
 **/
// require("babel-core/register");
require("babel-polyfill");
const bodyAppend = '-response-body.data';
var filter = require('filter-files');
var fs = require('fs');
var readFile = Promisify(fs.readFile, fs);
var writeFile = Promisify(fs.writeFile, fs);
var path = require('path');
var mkdir = require('mk-dir');
var _ = require('lodash');


var dir = './koa2_record_data/';

var onRecord = function () {
};
var count = 10000;


/**
 * 配置文件存放目录
 * */
module.exports.config = function (_dir) {
  if (typeof _dir === 'string') {
    dir = _dir;
    mkdir(dir);
  } else if (_.isPlainObject(_dir)) {
    if (typeof _dir.dir === 'string') {
      dir = _dir;
      mkdir(dir);
    }
    if (typeof _dir.callback === 'function') {
      onRecord = _dir.callback;
    }
  }
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
module.exports.getBody = function (id, encode, callback) {
  if (typeof encode === 'function') {
    callback = encode;
    encode = undefined;
  }
  return readFile(dir + '/' + id + bodyAppend, encode).then(function (data) {
    (typeof callback === 'function') && callback(null, data);
    return data;
  }, function (err) {
    (typeof callback === 'function') && callback(err);
    throw err;
  });
};

module.exports.getPath = function (id) {
  return {
    info: dir + id + '.json',
    body: dir + id + bodyAppend
  }
};
/**
 * koa使用的记录数据中间件
 * */
module.exports.callback = function (callback) {
  mkdir(dir);
  return async function (ctx, next) {
    // console.log('start:', ctx.url);
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
        header: _.clone(req.header)
      }
    };
    if (req.body) {
      info.request.body = req.body;
    }
    ctx.record_info = info;
    onRecord(ctx, info);
    (typeof callback === 'function') && callback(ctx, info);
    // console.log('before:', ctx.url);
    await next();
    // console.log('after:', ctx.url);
    var res = ctx.response;
    info.endTime = Date.now();
    info.response = {
      status: res.status,
      statusString: res.statusString,
      header: res.header
    };
    var infoReq = info.request;
    var changed = {};
    if (infoReq.url != req.url)  changed.url = req.url;
    if (infoReq.host != req.host)  changed.host = req.host;
    if (infoReq.protocol != req.protocol)  changed.protocol = req.protocol;
    if (JSON.stringify(infoReq.header) !== JSON.stringify(req.header)) {
      var header = req.header;
      var oldHeader = infoReq.header;
      var changedHeader = {}, attrs = {};
      for (var attr in header) {
        attrs[attr] = true;
        if (header[attr] !== oldHeader[attr]) {
          changedHeader[attr] = header[attr];
        }
      }
      for (var attr2 in oldHeader) {
        if (!attrs[attr2]) changedHeader[attr2] = '';
      }
      changed.header = changedHeader;
    }
    if (JSON.stringify(changed).length > 3) {
      info.changed = changed;
    }
    onRecord(ctx, info);
    (typeof callback === 'function') && callback(ctx, info);
    writeFile(dir + id + '.json', JSON.stringify(info, null, '    '), 'utf8').then(function () {
      return writeFile(dir + id + bodyAppend, ctx.response.body);
    }).catch(function (err) {
      console.error(err);
    });
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
      try {
        func.apply(obj, args);
      }
      catch (e) {
        reject(e);
      }
    });
  }
}