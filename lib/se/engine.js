'use strict';
//require('script')

class Engine
{
    constructor(script)
    {
        this.script = script;
    }

    execute(args, callback)
    {
        let that = this;

        try{
            that.fillArgumsnts(args);
            that.checkArguments(args);

            let $$ = that.script;
            let $args = args;
            let $datas = []

            if ($$.beforeEach){
                $args = $$.beforeEach($args);
            }

            if (Array.isArray($$.parts)){
                $$.parts.forEach(function($part) {
                })
            }
            else {
            }

            if ($$.afterEach) {
                $data = $$.afterEach($data);
            }

            callback(null, $data);
        }
        catch(err){
            callback(err, null);
        }
    }

    fillArgumsnts(args)
    {
        let that = this;
        let $arg = that.Arguments;
    }

    checkArguments(args)
    {
        return args;
    }
}
