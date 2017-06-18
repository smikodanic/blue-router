# Blue Router
> Blue Router is universal router powered by [Bluebird](http://bluebirdjs.com/docs/getting-started.html) promises.
Blue Router can be used in NodeJS HTTP server, TCP server, UDP server, Redis PUB/SUB, browser side ...etc.
It's really universal and very fast.


## Installation
`npm install blue-router --save`


## Dependencies
The only dependency is Bluebird Promises.
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


## Examples

### NodeJS server (HTTP, TCP, UDP, Redis channel)

```javascript
/*
 * TCP server example
 */
const br = require('blue-router');

//cmd value can be changed dynamically by the TCP server
var input = {cmd: '/register/john', 'data': {name: 'John', age: 37}};

var context = {
    uri: input.cmd,
    req: {
        body: input.data
    },
    res: {
        socket: socket
    }
};

// br(context) is Bluebird promise . context is the same as ctx object.
br(context).when('/register/:name/:age')
    .then(function (ctx) {
        console.log('ctx.req.query: ', ctx.req.query);
        console.log('ctx.req.params: ', ctx.req.params);
        
        ctx.res.socket.write('Message to TCP client.');
    })
    .catch(function (err) {
        console.error(err);
    });

br(context).when('/users/list').then(func1).catch(logErr);
br(context).when('/users/:id').then(func2).catch(logErr);
```
*Explanation:*
br(context).when() is creating Bluebird promise and after that you can use all [API methods](http://bluebirdjs.com/docs/api-reference.html).
URI 'context.uri' can be fetched dynamically from browser's URL, HTTP/TCP/UDP server request or from command line.


## Chaining
Use Bluebird *then()* to serially connect functions into chain.
**br(context),then(func11).then(func12).then(func13).catch(logErr)**


## Licence
*Copyright (c) 2016 Saša Mikodanić*
Licensed under [MIT](https://github.com/smikodanic/angular-form-validator/blob/master/LICENSE) .
*(Freely you received, freely give. , Mt10:8)*
