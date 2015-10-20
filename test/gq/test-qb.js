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
    "beforeEach": function(args){
        return args;
    },
    "parts":[
        {
            "before": function(args) {
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
            "after": function(data) {
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
