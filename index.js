/*For browser side scripting include <script src="bluebird.js"></script>*/
const BPromise = require('bluebird') || Promise;


/**
 * Blue Route debugger.
 * @param  {Boolean} optsDebug - true | false
 * @param  {String} msg        - debug message
 * @return {Void}
 */
var bluedebug = function (optsDebug, msg) {
    'use strict';
    if (optsDebug) {
        console.log(msg);
    }
};


/**
 * URI parser
 * @param  {String} uri - /register/john?x=abc&y=123
 * @return {Object} - {path: '/register/john', querystring: 'x=abc&y=123'}
 */
var uriParser = function (uri) {
    'use strict';
    var uriDivided = uri.split('?');
    var uriParsed = {
        path: uriDivided[0],
        querystring: uriDivided[1]
    };
    return uriParsed;
};


/**
 * get route without parameter part. For example /register/:name/:age -> /register
 * @param  {String} route  - /register/:name/:age
 * @return {String}       - /register
 */
var extractRouteBase = function (route) {
    'use strict';

    var routeParts = route.split('/'); // [ '', register', ':name', ':age' ]

    var routeBaseArr = routeParts.map(function (routePart) {
        if (routePart.indexOf(':') === -1) {
            return routePart;
        }
    });

    //remove empty elements from array
    routeBaseArr = routeBaseArr.filter(function (elem) {
        return !!elem;
    });

    var routeBase = routeBaseArr.join('/'); // /register/

    return routeBase;
};


/**
 * Create query object of querystring. x=abc&y=123&z=true -> {x: 'abc', y: 123, z: true}
 * @param  {String} querystring - x=abc&y=123&z=true
 * @return {Object}             - {x: 'abc', y: 123, z: true}
 */
var getQuery = function (querystring) {
    'use strict';
    var queryArr = querystring.split('&');
    var queryObj = {};
    var qs, property, value;
    queryArr.forEach(function (elem) {
        qs = elem.split('=');
        property = qs[0];
        value = qs[1];

        //convert string into number
        if (!isNaN(value) && value.indexOf('.') === -1) { //integer 12
            value = parseInt(value, 10);
        } else if (!isNaN(value) && value.indexOf('.') !== -1) { //float 12.35
            value = parseFloat(value);
        }

        //convert string into boolean
        if (value === 'true' || value === 'false') {
            value = JSON.parse(value);
        }

        queryObj[property] = value;
    });

    return queryObj;
};


/**
 * Create parameters object. For example /register/:name AND /register/john -> {name: 'john'}
 * @param  {String} uriPath  - /register/john
 * @param  {String} route - /register/:name
 * @return {Object} - parameters
 */
var getParameters = function (uriPath, route) {
    'use strict';
    var routeParts = route.split('/'); // ['', 'register', ':name']
    var uriPathParts = uriPath.split('/'); // ['', 'register', 'john']

    var params = {};

    routeParts.forEach(function (routePart, index) {
        if (routePart.indexOf(':') === 0) {
            routePart = routePart.slice(1); //remove :

            var value = uriPathParts[index];

            //convert string into number
            if (!isNaN(value) && value.indexOf('.') === -1) { //integer 12
                value = parseInt(value, 10);
            } else if (!isNaN(value) && value.indexOf('.') !== -1) { //float 12.35
                value = parseFloat(value);
            }

            //convert string into boolean
            if (value === 'true' || value === 'false') {
                value = JSON.parse(value);
            }
            params[routePart] = value;
        }
    });

    return params;
};



var router = function (ctx) {
    'use strict';

    //array of promises
    var promises = [];

    return {

        when: function (route) {
            bluedebug(ctx.opts.debug, '+++++++uri: ' + ctx.uri + '\n+++++route: ' + route);

            if (!ctx.req) {
                ctx.req = {};
            }

            //add trailing slash if doesnt exist  ( register/john -> /register/john )
            if (route.indexOf('/') !== 0) {
                route = '/' + route;
            }
            if (ctx.uri.indexOf('/') !== 0) {
                ctx.uri = '/' + ctx.uri;
            }

            //remove ending slash if exist  ( /register/john/ -> /register/john )
            //because we want to match route='/register/john' and uri='/register/john/'
            if (ctx.uri.lastIndexOf('/') === ctx.uri.length - 1) {
                ctx.uri = ctx.uri.slice(0, -1);
            }
            if (route.lastIndexOf('/') === route.length - 1) {
                route = route.slice(0, -1);
            }

            //parse uri {path: '/register/john', querystring: 'x=abc&y=123'}
            var uriParsed = uriParser(ctx.uri);
            if (uriParsed.path.lastIndexOf('/') === uriParsed.path.length - 1) {
                uriParsed.path = uriParsed.path.slice(0, -1); //remove ending slash
            }
            bluedebug(ctx.opts.debug, '+uriParsed: ' + uriParsed.path + ' AND ' + uriParsed.querystring);

            //get route base /register/:name/:age -> /register/
            var routeBase = extractRouteBase(route);
            bluedebug(ctx.opts.debug, '+routeBase: ' + routeBase);


            //get number of uri and route parts
            var numUriPathParts = uriParsed.path.split('/').length;
            var numRouteParts = route.split('/').length;

            //matching uri and route
            var promis;
            if (route === uriParsed.path) { //exact match '/register/john' === '/register/john'
                bluedebug(ctx.opts.debug, '+EXACT MATCH\n');

                //get query object x=abc&y=123&z=true -> {x: 'abc', y: 123, z: true}
                if (!!uriParsed.querystring) {
                    ctx.req.query = getQuery(uriParsed.querystring);
                }

                //debug
                bluedebug(ctx.opts.debug, '++ctx.req.body: ' + JSON.stringify(ctx.req.body));
                bluedebug(ctx.opts.debug, '++ctx.req.params: ' + JSON.stringify(ctx.req.params));
                bluedebug(ctx.opts.debug, '++ctx.req.query: ' + JSON.stringify(ctx.req.query));

                promis = BPromise.resolve(ctx);
                promises.push(promis);

            } else if (route.indexOf('/:') !== -1 && numUriPathParts === numRouteParts && uriParsed.path.indexOf(routeBase) !== -1) { //param match '/register/john' === '/register/:name'
                bluedebug(ctx.opts.debug, '+PARAM MATCH\n');

                //get query object x=abc&y=123&z=true -> {x: 'abc', y: 123, z: true}
                if (!!uriParsed.querystring) {
                    ctx.req.query = getQuery(uriParsed.querystring);
                }

                //get param object /register/:name AND /register/john -> {name: 'john'}
                var params = getParameters(uriParsed.path, route);
                ctx.req.params = params;

                //debug
                bluedebug(ctx.opts.debug, '++ctx.req.body: ' + JSON.stringify(ctx.req.body));
                bluedebug(ctx.opts.debug, '++ctx.req.params: ' + JSON.stringify(ctx.req.params));
                bluedebug(ctx.opts.debug, '++ctx.req.query: ' + JSON.stringify(ctx.req.query));
                bluedebug(ctx.opts.debug, '\n');

                promis = BPromise.resolve(ctx);
                promises.push(promis);

            } else { //no match
                bluedebug(ctx.opts.debug, '+NO MATCH\n');
                promis = BPromise.reject();
                promises.push(promis);
            }

            return promis;
        }

    };

};

//browser (global var)
blue_router = router;

//nodejs or browserify
module.exports = router;