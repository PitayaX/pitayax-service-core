{
    "type": "report",
    "version":"2.0.0",
    "hash":"",
    "arguments": {
        "arg1": "abc",
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
