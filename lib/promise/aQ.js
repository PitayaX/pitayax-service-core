'use strict';

let co = require('co')

class aq extends co
{
    constructor(args)
    {
        super(args);
    }

    static Q(val, err)
    {
        return new Promise(function(resolve, reject) {
            if (err) reject(err);
            resolve(val);
        });
    }

    static apply(func, parameters) {

        let that = this;

        return new Promise(function (resolve, reject) {

            parameters.push(function(err, data) {

                if (err) reject(err);
                resolve(data);
            });

            return func.apply(that, parameters);
        });
    }

    static invoke(func, parameters) {

        let that = this;

        return new Promise(function (resolve, reject) {

            setTimeout(function() {

                try {
                    let result = func.apply(that, parameters);

                    resolve(result);
                }
                catch(err) {
                    reject(err);
                }

            }, 1);
        });
    }

    static bind(func) {

        let that = this;

        return new Promise(function (resolve, reject) {

            setTimeout(function() {

                try {
                    let result = func();

                    resolve(result);
                }
                catch(err) {
                    reject(err);
                }

            }, 1);
        });
    }


    static parallel(promises)
    {
        if (promises.length === 0) return [];

        return co.wrap(function* (promises) {
            return yield promises;
        })(promises);
    }

    static binds(funs)
    {
        if (funs.length == 0) return aQ.Q(0);

        return co.wrap(function* (funs){
            if (Array.isArray(funs)) {

                let rs = [];

                for(let i = 0; i < funs.length; i++) {
                    let r = yield aq.bind(funs[i]);
                    rs.push(r);
                }

                return rs;
            }
            else {
                return yield aq.bind(funs);
            }

        })(funs);
    }

    static readFile(fileName, options)
    {
        let fs = require('fs');

        return new Promise(function (resolve, reject) {

          fs.readFile(fileName, options, function(error, data) {

              if (error) reject(error);
              resolve(data);
          });
        });
    }

    static rest(url, method, headers, body, options)
    {
        let request = require('request');
        if (method) method = 'GET';
        if (!headers) headers = {};
        if (!body) body = '';

        return new Promise(function (resolve, reject) {
            let reqOptions = {
                'url': url,
                'headers': headers,
                'method': method,
                'body': body,
            };

            if (options) {
                Object.keys(options)
                    .forEach(function(key) {
                        reqOptions[key] = options[key];
                });
            }

            request(reqOptions, function(err, res, body) {
                if (err) reject(err);
                else resolve(JSON.parse(body));
            });
        });
    }
}


module.exports = aq;
