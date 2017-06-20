module.exports = function (ctx) {
    'use strict';
    console.log('Executed on each URI request. ctx: ', JSON.stringify(ctx));
};