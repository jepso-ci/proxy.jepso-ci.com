var Q = require('q');
var gethub = require('gethub');
var jproxy = require('jproxy');
var getConfig = require('jepso-ci-config').loadLocal;
var join = require('path').join;
var fs = require('fs');
var install = require('./lib/npm-install')
var rimraf = require('rimraf');


var express = require('express');
var app = express();

app.use(express.favicon(join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(join(__dirname, 'public')));

var cache = {};
var clearing = {};

var pattern = /^\/([a-zA-Z0-9][a-zA-Z0-9-]*)\/([a-zA-Z0-9_\-\.]+)\/([^ \/]+)(\/.*)?$/i;
app.use(function (req, res, next) {
  var match;
  if (match = pattern.exec(req.path)) {
    var user = match[1];
    var repo = match[2];
    var tag = match[3];
    var file = match[4];
    Q(clearing[user + '/' + repo + '/' + tag])
      .then(function () {
        return getRepoProxy(user, repo, tag);
      })
      .then(function (proxy) {
        if (!file) return next();
        proxy(file, res, next);
      })
      .done(null, next);

  } else return next();
});

function getRepoProxy(user, repo, tag) {
  var id = user + '/' + repo + '/' + tag;
  if (cache[id]) return cache[id];
  console.log('Downloading ' + id);
  return cache[id] = gethub(user, repo, tag, join(__dirname, 'cache', user, repo, tag))
    .then(function () {
      console.log('Installing ' + id);
      return Q.nfbind(fs.stat)(join(__dirname, 'cache', user, repo, tag, 'package.json'))
        .then(function () {
          return install(join(__dirname, 'cache', user, repo, tag));
        }, function () {});
    }, function (err) {
      throw new Error('Failed to find ' + user + '/' + repo + '/' + tag);
    })
    .then(function () {
      console.log('Getting Config ' + id);
      return Q(getConfig(join(__dirname, 'cache', user, repo, tag)))
        .then(function (res) {
          if (res.proxy) return res.proxy;
          else throw new Error('no config');
        })
        .then(null, function () {
          return Q.nfbind(jproxy.config)(join(__dirname, 'cache', user, repo, tag));
        })
        .then(null, function () {
          return {};
        })
        .then(function (config) {
          console.log('Generating Proxy ' + id);
          return jproxy(join(__dirname, 'cache', user, repo, tag), config);
        });
    })
    .then(function (proxy) {
      Q.delay(300000)//5 minutes
        .done(function () {
          clearing[id] = Q.nfbind(rimraf)(join(__dirname, 'cache', user, repo, tag))
            .then(function () {
              cache[id] = null;
            });
        });
      return proxy;
    }, function (err) {
      cache[id] = null;
      return Q.nfbind(rimraf)(join(__dirname, 'cache', user, repo, tag))
        .thenReject(err);
    });

}

app.get('/:user/:repo', function (req, res) {
  res.redirect('/' + req.params.user + '/' + req.params.repo + '/master');
});
app.get('/:user/:repo/:tag', function (req, res, next) {
  Q(getConfig(join(__dirname, 'cache', req.params.user, req.params.repo, req.params.tag)))
    .done(function (config) {
      res.redirect(req.path + config.url);
    }, function () {
      next();
    });
});

app.get('/status', function (req, res) {
  res.json('"good"');
});

app.use(function (req, res, next) {
  if (!/^\/.+\/.+/.test(req.path)) return next();
  res.statusCode = 404;
  express.directory(join(__dirname, 'cache'))(req, res, next);
});
express.errorHandler.title = 'jProxy';
app.use(express.errorHandler());

app.listen(3000);