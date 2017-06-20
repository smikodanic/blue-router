const br = require('../index.js');
var errLog = require('./cli/errLog.js');

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
br(context).when('/cli/list').then(require('./cli/match_exact.js').list).catch(errLog);

/// redirection
//node cli.js '{"cmd": "/cli/listall", "data": [{"id": 12}, {"id": 13}, {"id": 14}]}'
//node cli.js '{"cmd": "/cli/listall/", "data": [{"id": 12}, {"id": 13}, {"id": 14}]}'
//node cli.js '{"cmd": "cli/listall", "data": [{"id": 12}, {"id": 13}, {"id": 14}]}'
//node cli.js '{"cmd": "cli/listall/", "data": [{"id": 12}, {"id": 13}, {"id": 14}]}'
br(context).when('/cli/listall').redirect('/cli/list').then(require('./cli/match_exact.js').list).catch(errLog);

//node cli.js '{"cmd": "/cli/getname/firstname", "data": {"name": "Sasa"}}'
//node cli.js '{"cmd": "/cli/getname/firstname/", "data": {"name": "Sasa"}}'
//node cli.js '{"cmd": "cli/getname/firstname", "data": {"name": "Sasa"}}'
//node cli.js '{"cmd": "cli/getname/firstname/", "data": {"name": "Sasa"}}'
br(context).when('/cli/getname/firstname/').then(require('./cli/match_exact.js').getname).catch(errLog);


////examples with uri query string
//node cli.js '{"cmd": "/cli/login?username=peter&password=pan", "data": {}}'
//node cli.js '{"cmd": "/cli/login/?username=peter&password=pan", "data": {}}'
//node cli.js '{"cmd": "cli/login?username=peter&password=pan", "data": {}}'
//node cli.js '{"cmd": "cli/login/?username=peter&password=pan", "data": {}}'
br(context).when('/cli/login').then(require('./cli/match_exact.js').login).catch(errLog);



///// PARAM MATCH

//node cli.js '{"cmd": "/cli/users/55", "data": [{"id": 33, "name": "Peter"}, {"id": 55, "name": "Dean"}]}'
//node cli.js '{"cmd": "/cli/users/55/", "data": [{"id": 33, "name": "Peter"}, {"id": 55, "name": "Dean"}]}'
//node cli.js '{"cmd": "cli/users/55", "data": [{"id": 33, "name": "Peter"}, {"id": 55, "name": "Dean"}]}'
//node cli.js '{"cmd": "cli/users/55/", "data": [{"id": 33, "name": "Peter"}, {"id": 55, "name": "Dean"}]}'
br(context).when('/cli/users/:id').then(require('./cli/match_param.js').get_user_by_id).catch(errLog);

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
br(context).when('/cli/register/:name/:year/:employed').then(require('./cli/match_param.js').register).catch(errLog);




///// NO MATCH (bad uri - Error 404)
//node cli.js '{"cmd": "", "data": {}}'
//node cli.js '{"cmd": "/", "data": {}}'
//node cli.js '{"cmd": "/cli", "data": {}}'
//node cli.js '{"cmd": "/cli/", "data": {}}'
//node cli.js '{"cmd": "/cli/lis", "data": {}}'
//node cli.js '{"cmd": "/cli/lista", "data": {}}'
//node cli.js '{"cmd": "/cli/list/bad", "data": {}}'
br(context).final().then(require('./cli/notfound.js')).catch(errLog);