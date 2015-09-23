'use strict';

let co = require('co')

class aQ extends co
{
    constructor()
    {
        super()
        console.log('a');
    }

    static readFile(fileName, options)
    {
        let fs = require('fs');

        return new Promise(function (resolve, reject){
          fs.readFile(fileName, options, function(error, data){
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

        return new Promise(function (resolve, reject){
            let reqOptions = {
                'url': url,
                'headers': headers,
                'method': method,
                'body': body,
            };

            if (options){
                Object.keys(options)
                    .forEach(function(key){
                        reqOptions[key] = options[key];
                });
            }

            request(reqOptions, function(err, res, body){
                if (err) reject(err);
                else resolve(JSON.parse(body));
            })
        });
    }

    static invoke(method, parameters) {

        return new Promise(function (resolve, reject){

            switch(parameters.length){
                case 1:
                    method.call(this, parameters[0], function(err, data) {
                        if (err) reject(err);
                        resolve(data);
                      });
                    break;
                case 2:
                    method.call(this, parameters[0], parameters[1], function(err, data) {
                        if (err) reject(err);
                        resolve(data);
                      });
                    break;
                case 3:
                    method.call(this, parameters[0], parameters[1], parameters[2], function(err, data) {
                        if (err) reject(err);
                        resolve(data);
                      });
                    break;
                default:
                    method.call(this, parameters, function(err, data) {
                        if (err) reject(err);
                        resolve(data);
                      });
                    break;
            }
        });
    }

    static callback(target, callback) {

        return new Promise(function (resolve, reject) {

            callback(target, function(err, result) {
                if (err) reject(err);
                else resolve(result);

            })
        });
    }

    static oneByOne(promises)
    {
        return co.wrap(function* (promises){
            let rs = [];

            for(let promise of promises){
                rs.push(yield promise);
            }

            return rs;
        })(promises);
    }
}

module.exports = aQ;
