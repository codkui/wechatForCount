const DEMO=require("../data/models/demo")
const FormData = require("form-data");


async function test(args){
    //这里处理逻辑业务,如果返回数据，则机器人会将该消息回复
}

function actionCheck(str){
    /**
     * 解析语法是否合法，并输出对应指令 指令构成 {act,args},支持解析多指令
     * 
     * */
    let acts=[]
    //微信解析
   

    let keys={
        "命令":{act:"对应函数",args:{}},
    }
    if(keys[str]){
        return [keys[str]]
    }

    const wxReg=/[A-z]+\d*/
    let wx=wxReg.exec(str)
    if(!wx){return false}
    wx=wx[0]
    //统计数据
    const clientAddReg=/(累计)[^\d]*(\d+)/
    let res=clientAddReg.exec(str)
    if(res){
        acts.push({act:"test",args:{user:wx,num:res[2]}})
    }

    return acts
}

async function router(msg){
    let str=msg.text().trim()
    let acts=actionCheck(str)
    let end=[]
    if(!acts || acts.length==0){
        return false
    }

    let actions={
        test:test
    }

    for(let i=0;i<acts.length;i++){
        let res=await actions[acts[i].act](acts[i].args)
        if(res!=null){
            end.push(res)
        }
    }
    if(end.length>0){
        msg.say(end.join("\n"))
    }
    return end.length>0?true:false

}

module.exports ={
    actionCheck,
    router,
}