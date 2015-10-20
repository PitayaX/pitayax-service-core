{
    "type": "report",
    "version":"2.0.0",
    "hash":"",
    "arguments": {
        "arg1": "string",
        "arg2": {
            "type": "number",
            "default": 1
        }
    },
    "beforeEach": function(ctx, args){
        return args;
    },
    "parts":[
        {
            "before": function(ctx, args) {
                ctx['test'] = '123';
                return args;
            },
            "headers":{
                "type": "query"
            },
            "body": {
                "$query": {}
            },
            "parts":[
                {
                    "body":{"$test":"b"}
                }
            ],
            "after": function(ctx, data) {

                console.log('ctx:' + ctx['test'])
                return data;
            }
        },
        {
            "body":{
                "$type": "query",
                "$query": {}
            }
        }
    ],
};
