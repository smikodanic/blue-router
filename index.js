/**
 ************ BLUE ROUTER - Roter powered by Bluebird promises. **************
 * Basic synatx:
 * const br = require('blue-router');
 * var context = {uri: '/register/john?x=abc&y=123'};
 * var route = '/register/:name';
 * br(context).when(route).then().catch();
 */


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
 * @param  {String} uri - /register/john?x=abc&y=123  (uri === context.uri)
 * @return {Object} - {path: '/register/john', pathBase: '/register', querystring: 'x=abc&y=123'}
 *
 * Notice:
 * 1. When route is '/register/:name/:age' and uri is /register/john/23?x=abc&y=123 then uriParsed = {path: '/register/john/23', pathBase: '/register', querystring: 'x=abc&y=123'}
 * 2. When route is '/register/john/55' and uri is /register/john/55?x=abc&y=123 then uriParsed = {path: '/register/john/55', pathBase: '/register/john/55', querystring: 'x=abc&y=123'} (path == pathBase on EXACT MATCH)
 */
var uriParser = function (uri, route) {
    'use strict';
    var uriDivided = uri.split('?');

    var path = uriDivided[0];
    var querystring = uriDivided[1];

    //get pathBase
    var pathBase = '';
    if (route.indexOf('/:') !== -1) {//route has parameter definition /register/:name/:age
        var pathParts = path.split('/');
        var routeParts = route.split('/');

        // console.log('--pathParts: ', pathParts);
        // console.log('--routeParts: ', routeParts);

        //find how many parameters route has
        var routeParameters = routeParts.filter(function (routePart) {
            return (routePart.indexOf(':') === 0); // ':name'
        });

        //remove parameter parts from pathParts
        // console.log('--routeParameters.length', routeParameters.length);
        pathParts.splice(-routeParameters.length, routeParameters.length); //removing last routeParameters.length elements and result is ['', 'register']

        // console.log('--pathParts: ', pathParts);

        pathBase = pathParts.join('/');

    } else {
        pathBase = path;
    }

    var uriParsed = {
        path: path,
        pathBase: pathBase,
        querystring: querystring
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

    return '/' + routeBase;
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


//array of promises
var promises = [];


var router = function (ctx) {
    'use strict';

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

            //get route base /register/:name/:age -> /register/
            var routeBase = extractRouteBase(route);
            bluedebug(ctx.opts.debug, '+routeBase: ' + routeBase);

            //parse uri {path: '/register/john', querystring: 'x=abc&y=123'}
            var uriParsed = uriParser(ctx.uri, route);
            if (uriParsed.path.lastIndexOf('/') === uriParsed.path.length - 1) {
                uriParsed.path = uriParsed.path.slice(0, -1); //remove ending slash
            }
            bluedebug(ctx.opts.debug, '+uriParsed.path: ' + uriParsed.path + ' +uriParsed.pathBase: ' + uriParsed.pathBase + ' +uriParsed.querystring: ' + uriParsed.querystring);

            //get number of uri and route parts
            var numUriPathParts = uriParsed.path.split('/').length;
            var numRouteParts = route.split('/').length;

            //regular expression matching
            var routeBaseReg = new RegExp('^' + routeBase + '$', 'i');
            var regExpMatch = uriParsed.pathBase.match(routeBaseReg);
            bluedebug(ctx.opts.debug, '+routeBaseReg: ' + routeBaseReg + ' +uriParsed.pathBase: ' + uriParsed.pathBase + ' =====regExpMatch: ' + JSON.stringify(regExpMatch));


            //matching uri and route
            var promis;
            if ((route === uriParsed.path || !!regExpMatch) && route.indexOf('/:') === -1) { //exact match '/register/john' === '/register/john'
                !!regExpMatch
                    ? bluedebug(ctx.opts.debug, '+EXACT MATCH - REGEXP\n')
                    : bluedebug(ctx.opts.debug, '+EXACT MATCH\n');

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

            } else if ((uriParsed.path.indexOf(routeBase) !== -1 || !!regExpMatch) && route.indexOf('/:') !== -1 && numUriPathParts === numRouteParts) { //param match '/register/john' === '/register/:name'
                !!regExpMatch
                    ? bluedebug(ctx.opts.debug, '+PARAM MATCH - REGEXP\n')
                    : bluedebug(ctx.opts.debug, '+PARAM MATCH\n');

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
                promis = new BPromise(function(resolve, reject) {}); // retain promise in pending state
                promises.push(promis);
            }

            // console.log('\nroute:: ', route);
            // console.log('promis.isFulfilled():: ', promis.isFulfilled());
            // console.log('promis.isRejected():: ', promis.isRejected());
            // console.log('promis.isPending():: ', promis.isPending());
            // console.log('\n\n');

            return promis;
        }, //when

        /* Execute on each URI */
        do: function () {
            return BPromise.resolve(ctx);
        }, //do

        /* Execute when no URI matches against route */
        notfound: function () {

            //find is there any of promises fulfilled
            var tf = false;
            promises.forEach(function (promise) {
                tf = tf || promise.isFulfilled();
            });

            promises = []; //reset

            var p;
            if (!tf) {//if none of routes are not matched against URI
                bluedebug(ctx.opts.debug, '++NOTFOUND: ' + ctx.uri);
                p = BPromise.resolve(ctx);
            } else {//if one route (at least) is matched against URI
                p = new BPromise(function(resolve, reject) {}); // retain promise in pending state
            }
            return p;

        } //notfound

    };

};




/**
 * Add redirect function to bluebird promise.
 * @param  {String} newRoute - redirection route
 * @return {Promise}
 */
BPromise.prototype.redirect = function (newRoute) {
    'use strict';
    // console.log(promises); //all promises before redirect() usage

    var promisRedirection = BPromise.resolve(this)
        .then(function (ctx) {
            bluedebug(ctx.opts.debug, '++REDIRECT TO:' + newRoute);
            return BPromise.resolve(ctx);
        });

    return promisRedirection;
};




//browser (global var)
blue_router = router;

//nodejs or browserify
module.exports = router;
