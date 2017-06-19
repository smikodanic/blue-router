module.exports.get_user_by_id = function (ctx) {
    'use strict';
    var users = ctx.req.body;
    var user_id = ctx.req.params.id;

    var userFilt = users.filter(function (userObj) {
        return userObj.id === user_id;
    });

    var user = userFilt[0];

    console.log('Selected user is: ' + user.name);

};


module.exports.register = function (ctx) {
    'use strict';
    console.log('QUERY: ', ctx.req.query);
    console.log('PARAMS: ', ctx.req.params);
    console.log('BODY: ', ctx.req.body);

};