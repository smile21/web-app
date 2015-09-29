'use strict';

process.chdir(__dirname);

var compress = require('koa-compress');
var logger = require('koa-logger');
var serve = require('koa-static');
var route = require('koa-route');
var koa = require('koa');
var path = require('path');
var clap = require('tinyclap')();
var app = module.exports = koa();

var init = require('./middlewares/init');
var messages = require('./controllers/messages');

// Logger
app.use(logger());

// app init
app.use(init({viewsPath: path.join(__dirname, 'views')}));

// Serve static files
app.use(serve(path.join(__dirname, 'static')));

app.use(route.get('/', messages.home));
app.use(route.get('/messages', messages.list));
app.use(route.get('/messages/:id', messages.fetch));
app.use(route.post('/messages', messages.create));
app.use(route.get('/async', messages.delay));

// Compress
app.use(compress());

var PORT = clap.argv.P || clap.argv.port || 3000;

app.listen(PORT);
console.log(`listening on port ${PORT}`);
