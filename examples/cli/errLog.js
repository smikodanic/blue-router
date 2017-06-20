module.exports = function (err) {
    'use strict';
    if (err) {
        console.log('errLog: ', err.stack);
    }
};