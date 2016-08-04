var fs = require('fs');
var async = require('async');

var fileNames = [ 'file1.txt', 'file2.txt', 'file3.txt' ];
async.map(fileNames,
    function (fileName, callback) {
        fs.readFile(fileName, { encoding: 'utf8' }, callback);
    },
    // Process the result
    function (error, textArray) {
        if (error) {
            console.log(error);
            return;
        }
        console.log('TEXTS:\n' + textArray.join('\n----\n'));
    });