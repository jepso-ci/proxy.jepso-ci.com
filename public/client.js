var user = $('user-input');
var repo = $('repo-input');
var tag = $('tag-input');
var go = $('go');

function validUser(user) {
  return typeof user === 'string' && user
    && /^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(user);
}
function validRepo(repo) {
  return typeof repo === 'string' && repo
    && /^[a-zA-Z0-9_\-\.]+$/.test(repo);
}
function validTag(tag) {
  if (tag)
    return typeof tag === 'string'
      && /^[^ ]+$/.test(tag);
  else
    return true;
}

go.addEventListener('click', function (e) {
  e.preventDefault();
  if (!validUser(user.value) || !validRepo(repo.value) || !validTag(tag.value)) {
    if (!validUser(user.value)) user.setAttribute('class', 'error');
    if (!validRepo(repo.value)) repo.setAttribute('class', 'error');
    if (!validTag(tag.value)) tag.setAttribute('class', 'error');
    return;
  }
  location.assign('/' + user.value + '/' + repo.value + '/' + (tag.value || 'master'));
});

user.addEventListener('keyup', function () {
  if (validUser(user.value)) user.setAttribute('class', '');
  if (!enabled) return;
  $('test-result').innerHTML = '';
  $('test-result').setAttribute('class', '');
});
repo.addEventListener('keyup', function () {
  if (validRepo(repo.value)) repo.setAttribute('class', '');
  if (!enabled) return;
  $('test-result').innerHTML = '';
  $('test-result').setAttribute('class', '');
});
tag.addEventListener('keyup', function () {
  if (validTag(tag.value)) tag.setAttribute('class', '');
  if (!enabled) return;
  $('test-result').innerHTML = '';
  $('test-result').setAttribute('class', '');
});

function $(id) {
  return document.getElementById(id);
}