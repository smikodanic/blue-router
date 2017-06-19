# Blue Router
> Blue Router is router powered by [Bluebird](http://bluebirdjs.com/docs/getting-started.html) promises.
Routing is process that determines which function will be executed on the fly. Decision depends on URI. For example:
context.uri = '/user/register' will execute user registration function.

Blue Router can be used in NodeJS HTTP server, TCP server, UDP server, Redis PUB/SUB, browser side ...etc.

It's really universal and very fast.


## Installation
`npm install blue-router --save`


## Dependencies
The only dependency is Bluebird package. The advantage is in rich [Bluebird API](http://bluebirdjs.com/docs/api-reference.html) methods.
```javascript
const Promise = require('bluebird') //NodeJS
<script src="bluebird.min.js"></script> //Browser (client side)
```


## Integration
```javascript
//NodeJS or browserify (client side)
const br = require('blue-router');

//Browser (client side)
<script src="bluebird.min.js"></script>
<script src="/blue-router/index.js"></script>
```


## Methods
- **br(context).when(route)** when 'context.uri' is matched against 'route' then function is executed
- **br(context).final()** always put this method at the end (apply this for Error 404: Not found)

when() and final() returns bluebird promise and after that you can use any of bluebird methods (then, spread, catch ...)


## Slashes
Trailing and ending slashes can be ignored so all of these URIs will be valid:
```javascript
/cli/register/john/23/true?x=123&y=abc&z=false
/cli/register/john/23/true/?x=123&y=abc&z=false
cli/register/john/23/true?x=123&y=abc&z=false
cli/register/john/23/true/?x=123&y=abc&z=false
```

## Parameters
Variables in Blue Router are named simmilar to ExpressJS:
- **ctx.req.body** for example *context.req.body = {name: 'Peter'}*
- **ctx.req.params** for example */user/:id*  and */user/23* will return *{id: 23}*
- **ctx.req.query** for example *?username=john&password=as1234* will return *{username: 'john', password: 'as1234'}*


## Chaining
Use Bluebird *then()* to serially connect functions into chain.
**br(context),then(func11).then(func12).then(func13).catch(logErr)**

## Error 404
To output error when route is not found put at the end:
```javascript
br(context).final().catch(function () {console.log('Error 404: NOT FOUND');})
```


## Debugging
To activate debugging set **context.opts.debug: true**



## Usage

### NodeJS server (HTTP, TCP, UDP, Redis channel)

```javascript
/*
 * TCP server example
 */
const br = require('blue-router');

//cmd value can be changed dynamically by TCP server
var input = {cmd: '/register/john/45', data: {company: 'Cloud LLC', employers: 257}};

var context = {
    uri: input.cmd,
    req: {
        body: input.data
    },
    res: {
        socket: socket
    }
};

// br(context).when() is Bluebird promise
// 'ctx' is 'context' object with added req.query and req.params properties
br(context).when('/register/:name/:age')
    .then(function (ctx) {
        console.log('ctx.req.query: ', ctx.req.query); //undefined
        console.log('ctx.req.params: ', ctx.req.params); //{name: 'John', age: 45}
        console.log('ctx.req.body: ', ctx.req.body); //{company: 'Cloud LLC', employers: 257}
        
        ctx.res.socket.write('Message to TCP client.');
    })
    .catch(function (err) {
        console.error(err);
    });

```
*Explanation:*
br(context).when() makes Bluebird promise and after that you can use all bluebird's API methods.
URI 'context.uri' can be fetched dynamically from browser's URL, HTTP/TCP/UDP server request or from command line (CLI).



## Examples

- Command Line examples [CLI](https://github.com/smikodanic/blue-router/examples/cli.js)

```javascript
/*
 * CLI (Command Line) Example
 */
const br = require('../index.js');
var errLog = require('./errLog.js');

//input from console - cli input ($node cli.js {"cmd":"/cli/register/john/23/true","data":{}})
var input = process.argv[2];

//converting a string to object
try {
    input = JSON.parse(input); //convert string to object
} catch (err) {
    console.log(err.stack);
}

//context object which define router behaviour
var context = {
    uri: input.cmd,
    req: {
        body: input.data
    },
    res: {
        cl: console.log
    },
    opts: {
        debug: false
    }
};


///////////// R O U T E S /////////////////////

///// EXACT MATCH

//node cli.js '{"cmd": "/cli/list", "data": [{"id": 12}, {"id": 13}, {"id": 14}]}'
//node cli.js '{"cmd": "/cli/list/", "data": [{"id": 12}, {"id": 13}, {"id": 14}]}'
//node cli.js '{"cmd": "cli/list", "data": [{"id": 12}, {"id": 13}, {"id": 14}]}'
//node cli.js '{"cmd": "cli/list/", "data": [{"id": 12}, {"id": 13}, {"id": 14}]}'
br(context).when('/cli/list').then(require('./match_exact.js').list).catch(errLog);

//node cli.js '{"cmd": "/cli/getname/firstname", "data": {"name": "Sasa"}}'
//node cli.js '{"cmd": "/cli/getname/firstname/", "data": {"name": "Sasa"}}'
//node cli.js '{"cmd": "cli/getname/firstname", "data": {"name": "Sasa"}}'
//node cli.js '{"cmd": "cli/getname/firstname/", "data": {"name": "Sasa"}}'
br(context).when('/cli/getname/firstname/').then(require('./match_exact.js').getname).catch(errLog);

////examples with uri query string
//node cli.js '{"cmd": "/cli/login?username=peter&password=pan", "data": {}}'
//node cli.js '{"cmd": "/cli/login/?username=peter&password=pan", "data": {}}'
//node cli.js '{"cmd": "cli/login?username=peter&password=pan", "data": {}}'
//node cli.js '{"cmd": "cli/login/?username=peter&password=pan", "data": {}}'
br(context).when('/cli/login').then(require('./match_exact.js').login).catch(errLog);


///// PARAM MATCH

//node cli.js '{"cmd": "/cli/users/55", "data": [{"id": 33, "name": "Peter"}, {"id": 55, "name": "Dean"}]}'
//node cli.js '{"cmd": "/cli/users/55/", "data": [{"id": 33, "name": "Peter"}, {"id": 55, "name": "Dean"}]}'
//node cli.js '{"cmd": "cli/users/55", "data": [{"id": 33, "name": "Peter"}, {"id": 55, "name": "Dean"}]}'
//node cli.js '{"cmd": "cli/users/55/", "data": [{"id": 33, "name": "Peter"}, {"id": 55, "name": "Dean"}]}'
br(context).when('/cli/users/:id').then(require('./match_param.js').get_user_by_id).catch(errLog);

//node cli.js '{"cmd": "/cli/register/john/23/true", "data": {"nick": "johnny"}}'
//node cli.js '{"cmd": "/cli/register/john/23/true/", "data": {"nick": "johnny"}}'
//node cli.js '{"cmd": "cli/register/john/23/true", "data": {"nick": "johnny"}}'
//node cli.js '{"cmd": "cli/register/john/23/true/", "data": {"nick": "johnny"}}'
//
//examples with uri query string
//node cli.js '{"cmd": "/cli/register/john/23/true?x=123&y=abc&z=false", "data": {"nick": "johnny"}}'
//node cli.js '{"cmd": "/cli/register/john/23/true/?x=123&y=abc&z=false", "data": {"nick": "johnny"}}'
//node cli.js '{"cmd": "cli/register/john/23/true?x=123&y=abc&z=false", "data": {"nick": "johnny"}}'
//node cli.js '{"cmd": "cli/register/john/23/true/?x=123&y=abc&z=false", "data": {"nick": "johnny"}}'
br(context).when('/cli/register/:name/:year/:employed').then(require('./match_param.js').register).catch(errLog);


///// NO MATCH (bad uri - Error 404)
//node cli.js '{"cmd": "", "data": {}}'
//node cli.js '{"cmd": "/", "data": {}}'
//node cli.js '{"cmd": "/cli", "data": {}}'
//node cli.js '{"cmd": "/cli/", "data": {}}'
//node cli.js '{"cmd": "/cli/lis", "data": {}}'
//node cli.js '{"cmd": "/cli/lista", "data": {}}'
//node cli.js '{"cmd": "/cli/list/bad", "data": {}}'
br(context).final().catch(require('./notfound.js'));
```





## Licence
*Copyright (c) 2017 Saša Mikodanić*
Licensed under [MIT](https://github.com/smikodanic/angular-form-validator/blob/master/LICENSE) .
