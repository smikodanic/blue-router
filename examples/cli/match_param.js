module.exports.get_user_by_id = function (ctx) {
    'use strict';
    var users = ctx.req.body;
    var user_id = ctx.req.params.id;

    var userFilt = users.filter(function (userObj) {
        return userObj.id === user_id;
    });

    var user = userFilt[0];

    ctx.res.cl('Selected user is: ' + user.name);

};


module.exports.register = function (ctx) {
    'use strict';
    console.log('REGISTER');
    console.log('QUERY: ', ctx.req.query);
    console.log('PARAMS: ', ctx.req.params);
    console.log('BODY: ', ctx.req.body);

};


module.exports.shop = function (ctx) {
    'use strict';
    ctx.res.cl('Shop name is: ' + ctx.req.params.name + ' year: ' + ctx.req.params.year);

    if (ctx.req.params.color) {
        ctx.res.cl('Color: ' + ctx.req.params.color);
    }

};