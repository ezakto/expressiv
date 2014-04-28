var fs        = require('fs'),
    path      = require('path'),
    expressiv = require('../lib/expressiv');

var tests = fs.readdirSync(path.join(__dirname, 'tests'))
    .filter(function(file){
        return !/\.html$/.test(file);
    });

var p = e = 0;

tests.forEach(function(file){
    var test     = path.basename(file, '.x'), expected, result;
    
    try {
        expected = fs.readFileSync(path.join(__dirname, 'tests', test + '.html'), { encoding: 'utf8' }).replace(/\s+/g, '');
        result = expressiv(fs.readFileSync(path.join(__dirname, 'tests', file), { encoding: 'utf8' })).replace(/\s+/g, '');
        if (result !== expected) throw new Error();
        console.log('\u2713', "Test", test);
        p++;
    } catch (error) {
        console.log('\u2717', "Test", test);
        if (typeof result === 'string') {
            console.log('  Expected output:');
            console.log('  ' + expected);
            console.log('');
            console.log('  Given output:');
            console.log('  ' + result);
            for (a = '  ', i = 0, l = result.length; i < l; i++) {
                if (result[i] === expected[i]) {
                    a += '-';
                    continue;
                }
                a += '^';
                break;
            }
            console.log(a);
        } else {
            console.log('  ' + error);
        }
        console.log('');
        e++;
    }

});

console.log('');
console.log('Passed tests:', p);
console.log('Failed tests:', e);