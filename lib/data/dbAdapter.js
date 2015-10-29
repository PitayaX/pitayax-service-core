'use strict';

let EventEmitter = require('events').EventEmitter;

const NotSupportError = ((method) => {throw new Error(`The current ${method} wasn't supportted by abstract class.`)});

//support CRUD opetions for one database
class DbAdapter extends EventEmitter
{
    constructor()
    {
        super();
    }

    create(name, body, callback)
    {
        let that = this;

        //get instance of model by name
        let $model = that.getModel(name);

        //get instance of schema by name
        let $schema =  that.getSchema(name);

        body = (typeof body == 'string') ? JSON.parse(body) : body;

        //get wrapper and process data before save
        let wrapper = that.getWrapper(name);
        if (wrapper && wrapper.to) {
            body = wrapper.to(body);
        }

        let autoIncrement = ($schema.options && $schema.options.autoIncrement)
                        ? $schema.options.autoIncrement
                        : undefined;

        if (autoIncrement === undefined) {

            //invoke create method if there is no auto increment field.
            return that.invokeResolve(
                        that.createPromise(
                            $model,
                            wrapper,
                            (model, resolver) => that._create(model, body, resolver)
                        ),
                        undefined,
                        callback);
        }
        else {
            //invoke createw with increase method if there is auto increment field.
            return that.invokeResolve(
                        that._createWithIncrement(
                            $model,
                            body,
                            autoIncrement,
                            wrapper,
                            that._createWithIncrement,
                            (model, resolver) => that._create(model, body, resolver)
                        ),
                        undefined,
                        callback);
        }
    }

    _create(model, body, resolver)
    {
        NotSupportError('_create');
    }

    _createWithIncrement(model, entity, autoIncrement, wrapper, pending, callback)
    {
        NotSupportError('_increaseValue');
    }

    count(name, filter, callback)
    {
        let that = this;

        return that.retrieve(name, fitler, {"countOnly": true}, callback);
    }

    retrieve(name, filter, options, callback)
    {
        let that = this;

        //get instance of model by name
        let $model = that.getModel(name);

        //convert string to object if argument is string
        filter = (typeof(filter)  === 'string') ? JSON.parse(filter) : filter;
        options = (typeof(options) === 'string') ? JSON.parse(options) : options;

        //get options
        if (!options) options = {};
        if (!options.filter) options.filter = filter;

        //get method from options if it exist, other wise use default one
        let method = (options["method"]) ? options["method"] : 'find';

        let wrapper = that.getWrapper(name);

        return that.invokeResolve(
                    that.createPromise(
                        $model,
                        wrapper,
                        (model, resolver) => {

                            //check method
                            if (!model[method] || typeof(model[method]) !== 'function') {
                                throw new Error(`Can't find method: ${method}`);
                            }

                            //invoke method with options
                            that._retrieve(model, method, resolver, options);
                        }
                    ),
                    undefined,
                    callback);
    }

    _retrieve(model, method, resolver, options)
    {
        NotSupportError('_retrieve');
    }

    update(name, filter, modifier, callback)
    {
        let that = this;

        filter = (typeof filter === 'string') ? JSON.parse(filter) : filter;
        modifier = (typeof modifier === 'string') ? JSON.parse(modifier) : modifier;

        //get instance of model by name
        let $model = that.getModel(name);

        //get wrapper and process data before save
        let wrapper = that.getWrapper(name);
        if (wrapper && wrapper.to) {
            //get modified keys
            let modifiedKey = Object.keys(modifier);

            //wrap values before save
            modifier = wrapper.to(modifier, modifiedKey);
        }

        return that.invokeResolve(
                    that.createPromise(
                        $model,
                        wrapper,
                        (model, resolver) => that._update(model, resolver, filter, modifier)
                    ),
                    undefined,
                    callback);
    }

    _update(model, resolver, filter, modifier)
    {
        NotSupportError('_update');
    }

    delete(name, filter, callback)
    {
        let that = this;

        filter = (typeof filter === 'string') ? JSON.parse(filter) : filter;

        let $model = that.getModel(name);
        return that.invokeResolve(
                    that.createPromise(
                        $model,
                        null,
                        (model, resolver) => that._delete(model, resolver, filter)
                    ),
                    data => (data.result) ? data.result : data,
                    callback);
    }

    _delete(model, resolver, filter)
    {
        NotSupportError('_update');
    }

    createPromise(model, wrapper, callback)
    {
        //reassign
        let that = this;

        return new Promise((resolve, reject) => {

            callback(model, (err, data) => {

                //reject error
                if (err) reject(err);

                //wrapper data
                if (wrapper) {
                    if (wrapper.from) data = wrapper.from(data);
                }

                //resolve data
                return resolve(data);
            })
        });
    }

    invokeResolve(promise, wrapperData, callback)
    {
        return promise
                .then( data => (wrapperData) ? wrapperData(data) : data )
                .then( data => (callback) ? callback(null, data) : data )
                .catch( err => {
                    if (callback) callback(err, null);
                    throw err;
                });
    }

    createModel(name)
    {
        NotSupportError('createModel');
    }

    getModel(name)
    {
        NotSupportError('getModel');
    }

    getModelWithBody(name, body)
    {
        let that = this;

        let Model = that.getModel(name);
        let model = new Model(body);

        return model;
    }

    getSchema(name)
    {
        NotSupportError('getSchema');
    }

    getWrapper(name)
    {
        return {"from": null, "to": null};
    }
}

module.exports = DbAdapter;
