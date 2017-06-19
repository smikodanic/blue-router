module.exports.list = function (ctx) {
    'use strict';
    var users = ctx.req.body;

    users.forEach(function (user) {
        console.log(user.id);
    });
};


module.exports.getname = function (ctx) {
    'use strict';
    console.log(ctx.req.body.name);
};


module.exports.login = function (ctx) {
    'use strict';
    console.log('USERNAME: ' + ctx.req.query.username);
    console.log('PASSWORD: ' + ctx.req.query.password);
};