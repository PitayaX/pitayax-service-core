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

      const callback = (err, data) => {
        if (err) reject(err)
        resolve(data)
      }

      let length = 0
      if (arg1 !== undefined)
      {

        length++
        if (arg2 !== undefined)
        {

          length++
          if (arg3 !== undefined)
          {

            length++
            if (arg4 !== undefined) length++
          }
        }
      }

      switch(length)
      {
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

        try
        {
          resolve(func.apply(that, parameters))
        }
        catch(err)
        {
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
    if (!promises || promises.length === 0)
    {
      return aq.Q(null)
    }

    return co.wrap( function* (promises) {
      return yield promises
    })(promises)
  }

  static readFile(fileName, options)
  {
    const fs = require('fs')

    return new Promise( (resolve, reject) => {

      fs.readFile(fileName, options, (error, data) => {

        if (error) reject(error)
        resolve(data)
      })
    })
  }

  static rest(url, method, headers, body, options)
  {
    //set default values
    if (!method) method = 'GET'
    if (!headers) headers = {}
    if (!body) body = ''

    //convert body to string, it looks request only use string
    if (typeof body === 'object') body = JSON.stringify(body)

    //create new instance of Promise
    return new Promise((resolve, reject) => {

      //const strict = (options && options.strict === undefined) ? options.strict : false

      //append content-type to header
      if (!(headers['Content-Type'] || headers['content-type'])) {
        headers['Content-Type'] = 'application/json'
      }

      //convert method
      method = method.toUpperCase()

      const reqOptions = {
        'url': url,
        'headers': headers,
        'method': method,
        'body': body,
      }

      //remove for GET method
      if (method.toUpperCase() === 'GET')
        reqOptions['body'] = undefined

      if (options)
      {
        Object
          .keys(options)
          .forEach( (key) => {
            reqOptions[key] = options[key]
          })
      }

      try
      {
        const request = require('request')

        request(reqOptions, function(err, res, body) {

          if (err) reject(err)
          else
          {
            try
            {
              const contentType = res.headers['content-type']
              const data = (contentType === 'application/json') ? JSON.parse(body) : body

              if (res.statusCode >= 200 && res.statusCode < 400)
              {
                if (data && data.error)
                  reject(data.error)   //reject if data includes error node
                else resolve(data)     //accept the data
              }
              else
              {
                if (data) {
                  //append status code to result
                  if (typeof(data) === 'object') {
                    if (data.error)
                      data.error.statusCode = res.statusCode
                    else data.statusCode = res.statusCode
                  }
                }

                //reject(new Error('Handle error status code: ' + res.statusCode + 'message: ' + body))
                reject(data)
              }
            }
            catch(err)
            {
              reject((err && err.message) ? err : body) //parse body failed
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
