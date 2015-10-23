{
    "version":"2.0.0",
    "arguments": {
        "arg1": "datetime",
        "arg2": "array[string]"
    },
    "parts": {
            "body": function(ctx) {
                let args = ctx.args;
                return {
                    "result": "t",
                    "arg1": args.arg1,
                    "arg2": args.arg2
                }
            }
    }
};
