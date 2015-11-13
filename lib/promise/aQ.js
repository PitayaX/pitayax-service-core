'use strict'

const co = require('co')

class aq extends co
{
    constructor(args)
    {
        super(args)
    }

    static Q(val, err)
    {
        return new Promise((resolve, reject) => {
            if (err) reject(err)
            resolve(val)
        })
    }

    static call(target, func, arg1, arg2, arg3, arg4)
    {
        if (!target) target = this

        return new Promise((resolve, reject) => {

            let callback = (err, data) => {
                if (err) reject(err)
                resolve(data)
            }

            let length = 0
            if (arg1 !== undefined){

                length++
                if (arg2 !== undefined) {

                    length++
                    if (arg3 !== undefined) {

                        length++
                        if (arg4 !== undefined) length++
                    }
                }
            }

            switch(length){
                case 1:
                    return func.call(target, arg1, callback)
                case 2:
                    return func.call(target, arg1, arg2, callback)
                case 3:
                    return func.call(target, arg1, arg2, arg3, callback)
                case 4:
                    return func.call(target, arg1, arg2, arg3, arg4, callback)
                default:
                    reject(new Error('invaild parameters'))
                    break
            }
        })
    }

    static apply(target, func, parameters)
    {
        if (!target) target = this

        return new Promise((resolve, reject) => {

            parameters.push((err, data) => {

                if (err) reject(err)
                resolve(data)
            })

            return func.apply(target, parameters)
        })
    }

    static invoke(func, parameters)
    {

        const that = this

        return new Promise((resolve, reject) => {

            setTimeout(() => {

                try {
                    resolve(func.apply(that, parameters))
                }
                catch(err) {
                    reject(err)
                }

            }, 0)
        })
    }

    static series(promises)
    {
        if (!promises || promises.length === 0) {
            return aq.Q(null)
        }

        return new Promise((resolve, reject) => {

            const p = (i => {

                promises[i]
                    .then( data => {
                        return (i < promises.length - 1) ? p(i + 1) : resolve(data)
                    })
                    .catch(err => reject(err))
            })

            p(0)
        })
    }

    static parallel(promises)
    {
        if (!promises || promises.length === 0) {
            return aq.Q(null)
        }

        return co.wrap(function* (promises) {
            return yield promises
        })(promises)
    }

    static readFile(fileName, options)
    {
        const fs = require('fs')

        return new Promise((resolve, reject) => {

          fs.readFile(fileName, options, function(error, data) {

              if (error) reject(error)
              resolve(data)
          })
        })
    }

    static rest(url, method, headers, body, options)
    {
      if (!method) method = 'GET'
      if (!headers) headers = {}
      if (!body) body = ''

      if (typeof body === 'object') body = JSON.stringify(body)

      return new Promise((resolve, reject) => {
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json'
        }

        method = method.toUpperCase()

        const reqOptions = {
          'url': url,
          'headers': headers,
          'method': method,
          'body': body,
        }

        if (method.toUpperCase() === 'GET') {
          reqOptions['body'] = undefined
        }

        if (options) {
          Object.keys(options)
            .forEach(function(key) {
              reqOptions[key] = options[key]
          })
        }

        try{
          const request = require('request')

          request(reqOptions, function(err, res, body) {

            if (err) reject(err)
            else {

              try
              {
                const data = JSON.parse(body)

                if (data.error)
                  reject(data.error)
                else resolve(data)
              }
              catch(err)
              {
                if (res.statusCode == 200)
                  resolve(body)
                else reject( (err && err.message) ? err : body)
              }
            }
          })
        }
        catch(err){
          reject(err)
        }
      })
    }

    static get(url, headers, body, options)
    {
      return aq.rest(url, 'GET', headers, body, options)
    }

    static post(url, headers, body, options)
    {
      return aq.rest(url, 'POST', headers, body, options)
    }

    static put(url, headers, body, options)
    {
      return aq.rest(url, 'PUT', headers, body, options)
    }

    static delete(url, headers, body, options)
    {
      return aq.rest(url, 'DELETE', headers, body, options)
    }
}


module.exports = aq
