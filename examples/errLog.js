module.exports = function (err) {
    'use strict';
    if (err) {
        console.log('ERR: ', err.stack);
    }
};