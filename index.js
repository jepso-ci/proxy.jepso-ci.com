var Q = require('q');
var npm = require('npm');
var join = require('path').join;

var installNPM = function (args) {
  return Q.nfbind(npm.commands.install)(args);
}

var queue = Q.nfbind(npm.load)({});
function install(dir) {
  return queue = queue
    .then(function () {
      npm.prefix = dir;
      return installNPM([]);
    });
}
install(join(__dirname, 'demo')).done();