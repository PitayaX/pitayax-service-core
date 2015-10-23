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
        return new Promise((resolve, reject) => {
            if (err) reject(err);
            resolve(val);
        });
    }

    static call(target, func, arg1, arg2, arg3, arg4)
    {
        if (!target) target = this;

        return new Promise((resolve, reject) => {

            let callback = (err, data) => {
                if (err) reject(err);
                resolve(data);
            }

            let length = 0;
            if (arg1 !== undefined){

                length++;
                if (arg2 !== undefined) {

                    length++;
                    if (arg3 !== undefined) {

                        length++;
                        if (arg4 !== undefined) length++;
                    }
                }
            }

            switch(length){
                case 1:
                    return func.call(target, arg1, callback);
                case 2:
                    return func.call(target, arg1, arg2, callback);
                case 3:
                    return func.call(target, arg1, arg2, arg3, callback);
                case 4:
                    return func.call(target, arg1, arg2, arg3, arg4, callback);
                default:
                    reject(new Error('invaild parameters'));
                    break;
            }
        });
    }

    static apply(target, func, parameters)
    {
        if (!target) target = this;

        return new Promise((resolve, reject) => {

            parameters.push((err, data) => {

                if (err) reject(err);
                resolve(data);
            });

            return func.apply(target, parameters);
        });
    }

    static invoke(func, parameters)
    {

        let that = this;

        return new Promise((resolve, reject) => {

            setTimeout(() => {

                try {
                    resolve(func.apply(that, parameters));
                }
                catch(err) {
                    reject(err);
                }

            }, 0);
        });
    }

    static bind(func)
    {
        let that = this;

        return new Promise((resolve, reject) => {

            try {
                resolve(func());
            }
            catch(err) {
                reject(err);
            }
        });
    }

    static binds(funcs)
    {
        if (funcs.length == 0) return aq.Q(0);

        return co.wrap(function* (funcs){
            if (Array.isArray(funcs)) {
                return yield funcs.map(func => aq.bind(func));
            }
            else {
                return aq.bind(funcs);
            }

        })(funcs);
    }

    static bindQ(func, arg1, arg2, arg3, arg4)
    {
        let that = this;

        return new Promise((resolve, reject) => {

            let callback = (err, data) => {
                if (err) reject(err);
                resolve(data);
            }

            let length = 0;
            if (arg1 !== undefined){

                length++;
                if (arg2 !== undefined) {

                    length++;
                    if (arg3 !== undefined) {

                        length++;
                        if (arg4 !== undefined) length++;
                    }
                }
            }

            switch(length){
                case 1:
                    return func.bind(that, arg1, callback);
                case 2:
                    return func.bind(null, arg1, arg2, callback);
                case 3:
                    return func.bind(that, arg1, arg2, arg3, callback);
                case 4:
                    return func.bind(that, arg1, arg2, arg3, arg4, callback);
                default:
                    reject(new Error('invaild parameters'));
                    break;
            }
        });
    }

    static bindQs(funcs)
    {
        let ps = funcs.map(func => func());
        return aq.parallel(ps);
    }

    static parallel(promises)
    {
        if (promises.length === 0) return aq.Q(null);

        return co.wrap(function* (promises) {
            return yield promises;
        })(promises);
    }

    static readFile(fileName, options)
    {
        let fs = require('fs');

        return new Promise((resolve, reject) => {

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

        return new Promise((resolve, reject) => {
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
