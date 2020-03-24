const {find,findOne,insert,insertList,update,info,trans,del} = require("../db/mysql")
// const UserModel=require("./user")
// const AdminModel=require("./admin")
class ROOT{
    // tableName=""
    constructor(){
        this.tableName=""
    }
    async inserts(keys,values){
        if(!values ||values.length==0){
            return false
        }
        return await insertList(this.tableName,keys,values)
    }
    async find(select,where,order,limit){
        select=select?select:[]
        where=where?where:{}
        order=order?order:{}
        limit=limit?limit:{page:1,num:20}
        // console.log(limit)
        let res=await find(this.tableName,select,where,order,limit)
        for(let i=0;i<res.data.length;i++){
            if(res.data[i].uid!=undefined &&this.tableName!="admin"){
                let userInfo=await info("user",{id:res.data[i].uid})
                res.data[i].uname=userInfo.length>0? userInfo[0].username:""
                res.data[i].ubalance=userInfo.length>0? userInfo[0].balance:"0"
                // console.log(`添加用户名显示${res.data[i].uid}  ${userInfo.username}`)
                // console.log(userInfo)
            }
            if(res.data[i].aff_uid!=undefined){
                let userInfo=await info("user",{id:res.data[i].aff_uid})
                res.data[i].aff_uname=userInfo.length>0? userInfo[0].username:""
            }
            if(res.data[i].admin_uid!=undefined){
                let userInfo=await info("admin",{id:res.data[i].admin_uid})
                res.data[i].adminName=userInfo.length>0? userInfo[0].name:""
              
            }
        }
        return res
    }
    async findOne(select,where,order){
        return await findOne(this.tableName,select,where,order)
    }
    async add(data){
        return await insert(this.tableName,data)
    }
    
    async up(id,data){
        // console.log("update statst")
        // console.log(data)
        return await update(this.tableName,{id:id},data)
    }

    async ups(select,data){
        return await update(this.tableName,select,data)
    }
    
    async del(id){
        return await del(this.tableName,{id:id})
    }

    async info(id){
        let res = await info(this.tableName,{id:id})
        for(let i=0;i<res.length;i++){
            if(res[i].uid!=undefined &&this.tableName!="admin"){
                let userInfo=await info("user",{id:res[i].uid})
                res[i].uname=userInfo.length>0? userInfo[0].username:""
            }
            if(res[i].aff_uid!=undefined){
                let userInfo=await info("user",{id:res[i].aff_uid})
                res[i].aff_uname=userInfo.length>0? userInfo[0].username:""
            }
            if(res[i].admin_uid!=undefined){
                let userInfo=await info("admin",{id:res[i].admin_uid})
                res[i].adminName=userInfo.length>0? userInfo[0].username:""
            }
        }
        return (res==undefined || res.length==0)?null:res[0]
    }

    async trans(_sqls){
        return await trans(_sqls)
    }
}

module.exports=ROOT