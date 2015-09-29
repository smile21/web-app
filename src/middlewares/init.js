'use strict';

var views = require('co-views');
var parse = require('co-body');

module.exports = function (options) {
  var render = views(options.viewsPath, {
    map: { html: 'swig' }
  });

  return function *(next) {
    this._render = render;
    this._parse = parse;
    yield next;
  };
};
