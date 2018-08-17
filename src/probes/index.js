const fs = require('fs');
const path = require('path');

const appmetricsDir = path.dirname(require.resolve('appmetrics'));
const target = path.resolve(appmetricsDir, 'probes');


const files = fs.readdirSync(__dirname)
    .filter(f => !/^index\./.test(f));

if (files.length > 0)
    console.log('Installing custom probes into appmetrics: ' + files.join(', '));
else
    console.log('No custom appmetrics probes to install');

files.forEach(function(fileName) {
    var file = path.join(__dirname, fileName);
    var out = path.join(target, fileName);

    fs.copyFileSync(file, out);
});
