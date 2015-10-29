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

        //get entity with body
        let model = that.getModel(name);
        let entity = that.getModelWithBody(name, body);
        let schema =  that.getSchema(name);

        //get wrapper and convert to entity
        let wrapper = that.getWrapper(name);
        if (wrapper && wrapper.to) $model = wrapper.to($model);

        let autoIncrement = (schema.options && schema.options.autoIncrement)
                        ? schema.options.autoIncrement
                        : undefined;

        if (autoIncrement === undefined) {

            //invoke create method if there is no auto increment field.
            return that.invokeResolve(
                        that.createPromise(
                            entity,
                            wrapper,
                            (model, resolver) => that._create(model, resolver)
                        ),
                        undefined,
                        callback);
        }
        else {
            //invoke createw with increase method if there is auto increment field.

            return that.invokeResolve(
                        that._increaseValue(
                            model,
                            entity,
                            autoIncrement,
                            wrapper,
                            that._increaseValue,
                            (model, resolver) => that._create(model, resolver)
                        ),
                        undefined,
                        callback);
        }
    }

    _create(model, resolver)
    {
        NotSupportError('_create');
    }

    _increaseValue(model, entity, autoIncrement, wrapper, pending, callback)
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

        let $model = that.getModel(name);
        let wrapper = that.getWrapper(name);

        return that.invokeResolve(
                    that.createPromise(
                        $model,
                        (wrapper && wrapper.from) ? wrapper.from : undefined,
                        (model, resolver) => {

                            if (!options) options = {};

                            //get method name from options
                            let method = (options["method"]) ? options["method"] : 'find';

                            //check method
                            if (!model[method] || typeof(model[method]) !== 'function') {
                                throw new Error(`Can't find method: ${method}`);
                            }

                            if (!options.filter) options.filter = filter;

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

        let $model = that.getModel(name);
        let wrapper = that.getWrapper(name);

        return that.invokeResolve(
                    that.createPromise(
                        $model,
                        (wrapper && wrapper.from) ? wrapper.from : undefined,
                        (model, resolver) => {
                            let modifiedKey = Object.keys(modifier);

                            if (wrapper && wrapper.to) {
                                wrapper.to(model, modifiedKey);
                            }

                            that._update(model, resolver, filter, modifier);
                        }
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
