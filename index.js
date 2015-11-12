/**
 * Created by glickm on 11/10/15.
 */
var express = require('express');
var bodyParser = require('body-parser');


var app = express();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.post('/create', require('./lib/services/create').create);
app.post('/calculate', require('./lib/services/calculate').calculate);

var port = process.env.PORT || 4000;

app.listen(port);
console.log('Server started! At http://localhost:' + port);