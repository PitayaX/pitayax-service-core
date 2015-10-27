'use strict';

let path = require('path');
let fs = require('fs');
let aq = require('../../').aq;
let gq = require('../../').gq;
let fake = require('../../').fake;

let Parser = gq.Parser;
let Engine = gq.Engine;

let that = this;
let port = 1388;
let fakedHTTP = new fake.http(port);

let start = () => fakedHTTP.start();
let done = (message) => {

    if (message) {
        console.log(JSON.stringify(message, null, 2));
    }

    fakedHTTP.stop();
}

let conf = {"Conf": {"port": port}};
let script = undefined;
let args = [];


for(let i = 0; i < process.argv.length; i++) {
    if (i == 2) script = process.argv[i];
    if (i > 2) args.push(process.argv[i]);
}

if (script) {

    let scriptFile = path.join(__dirname, script);
    if (fs.existsSync(scriptFile)){
        Parser.parse(scriptFile)
            .then(script => {
                start();
                return Engine.invoke(script, args, conf);
            })
            .then(data => done(data))
            .catch(err => done(`exec script failed, details: ${err.message}`))
    }
    else {
        console.log(`Can't find script file: "${scriptFile}"`);
    }
}
else {
    console.log('Can\'t find script argument.');
}
