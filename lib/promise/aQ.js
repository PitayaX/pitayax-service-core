'use strict';

let co = require('co')

class aQ extends co
{
    constructor()
    {
        super();
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

    static apply(method, parameters) {

        let that = this;

        return new Promise(function (resolve, reject) {

            parameters.push(function(err, data) {

                if (err) reject(err);
                resolve(data);
            });

            method.apply(that, parameters);
        });
    }

    static invoke(method, parameters) {

        let that = this;

        return new Promise(function (resolve, reject) {

            setTimeout(function() {

                try {
                    let result = method.apply(that, parameters);

                    resolve(result);
                }
                catch(err) {
                    reject(err);
                }

            }, 10);
        });
    }


    static parallel(promises)
    {
        if (promises.length === 0) return [];

        return co.wrap(function* (promises) {
            return yield promises;
        })(promises);
    }
}

module.exports = aQ;
