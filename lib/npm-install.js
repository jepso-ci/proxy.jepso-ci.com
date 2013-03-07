var Q = require('q');
var npm = require('npm');
var join = require('path').join;

var installNPM = function (args) {
  return Q.nfbind(npm.commands.install)(args);
}

var queue = Q.nfbind(npm.load)({});

module.exports = install;
function install(dir) {
  var temp;
  return temp = (queue = queue
    .then(null, function () {})
    .then(function () {
      npm.prefix = dir;
      return installNPM([]);
    }))
    .then(function (res) {
      if (temp === queue) {
        queue = Q(null);
      }
      return res;
    });
}