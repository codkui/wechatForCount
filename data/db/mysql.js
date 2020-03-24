const mysql = require('mysql');
const config = require('./config.json');
const asyncFun = require("async")
const pool = mysql.createPool(Object.assign({connectionLimit:100},config.mysql) );

let trans = async function(sqls){
  let sqlparamsEntities=sqls
  return new Promise((rel,rex)=>{
    pool.getConnection(function (err, connection) {
      if (err) {
          rex(false);
          return;
          return callback(err, null);
      }
      connection.beginTransaction(function (err) {
          if (err) {
            rex(false);
            return;
              return callback(err, null);
          }
          // console.log("开始执行transaction，共执行" + sqlparamsEntities.length + "条数据");
          var funcAry = [];
          sqlparamsEntities.forEach(function (sql_param) {
              var temp = function (cb) {
                  var sql = sql_param.sql;
                  var param = sql_param.params;
                  // console.log(sql)
                  // console.log(param)
                  connection.query(sql, param, function (tErr, rows, fields) {
                      if (tErr) {
                          connection.rollback(function () {
                              // console.log("事务失败，" + sql_param + "，ERROR：" + tErr);
                              //rex(false);return;
                              throw tErr;
                          });
                      } else {
                        //rel(true);
                        //return;
                          return cb(null, 'ok');
                      }
                  })
              };
              funcAry.push(temp);
          });

          asyncFun.series(funcAry, function (err, result) {
              // console.log("transaction error: " + err);
              if (err) {
                  connection.rollback(function (err) {
                      // console.log("transaction error: " + err);
                      connection.release();
                      rex(false);return;
                      return callback(err, null);
                  });
              } else {
                  connection.commit(function (err, info) {
                      // console.log("transaction info: " + JSON.stringify(info));
                      if (err) {
                          // console.log("执行事务失败，" + err);
                          connection.rollback(function (err) {
                              // console.log("transaction error: " + err);
                              connection.release();
                              rex(false);return;
                              return callback(err, null);
                          });
                      } else {
                          connection.release();
                          rel(true);return;
                          return callback(null, info);
                      }
                  })
              }
          })
      });
  });
  })

}

let queryDB = function(sql, values) {
    return new Promise((resolve, reject) => {
      pool.getConnection(function(err, connection) {
        if(err) {
          pool.getConnection(function(err, connection) {
            if(err) {
              pool.getConnection(function(err, connection) {
                if(err) {
                  resolve(err);
                } else {
                  connection.query(sql, values, (err, rows) => {
                    if(err) {
                      console.log(err)
                      reject(err);
                    } else {
                      resolve(rows)
                    }
                    connection.release();
                  })
                }
              })
            } else {
              connection.query(sql, values, (err, rows) => {
                if(err) {
                  console.log(err)
                  reject(err);
                } else {
                  resolve(rows)
                }
                connection.release();
              })
            }
          })
        } else {
          connection.query(sql, values, (err, rows) => {
            if(err) {
              console.log(err)
              reject(err);
            } else {
              resolve(rows)
            }
            connection.release();
          })
        }
      })
    })
  };

let makeSQL=function(select,where,order,limit){
  let selectStr=""
  if(select==undefined || select.length==0){
    selectStr="*"
  }else{
    selectStr='`'+select.join("`,`")+'`'
  }

  let whereStr=""
  let whereValue=[]
  // console.log(where)
  if(where.length==0){
      whereStr=""
  }else{
    let keys=Object.keys(where)
    
    for(let i=0;i<keys.length;i++){
      let flag
      // console.log(keys[i])
      // console.log(where[keys[i]])
      // console.log(typeof where[keys[i]] =="string")
      if(typeof where[keys[i]] =="string"){
        flag=where[keys[i]].substring(0,2)
      }else{
        flag=false
      }
      // console.log(flag)
      switch(flag){
        case "> ":
          whereValue.push(where[keys[i]].substring(2))
          keys[i]='`'+keys[i]+'`'
          keys[i]+=">?"
        break;
        case "? ":
          whereValue.push(`%${where[keys[i]].substring(2)}%`)
          keys[i]=' `'+keys[i]+'` '
          keys[i]+="like ?"
        break;
        case "< ":
          whereValue.push(where[keys[i]].substring(2))
          keys[i]='`'+keys[i]+'`'
          keys[i]+="<?"
        break;
        case "! ":
          whereValue.push(where[keys[i]].substring(2))
          keys[i]='`'+keys[i]+'`'
          keys[i]+="<>?"
        break;
        case "^ ":
          let valuess=where[keys[i]].substring(2)
          valuess=valuess.split(",")
          whereValue.push(valuess[0])
          whereValue.push(valuess[1])
          keys[i]='(`'+keys[i]+'` between ? and ?)'
          // keys[i]+=">?"
        break;
        case "= ":
        whereValue.push(where[keys[i]].substring(2))
        keys[i]='`'+keys[i]+'`'
        keys[i]+="=?"
        break;
        default:
        whereValue.push(where[keys[i]])
        keys[i]='`'+keys[i]+'`'
        keys[i]+="=?"
        break
      }
      // whereValue.push(where[keys[i]])
      // keys[i]='`'+keys[i]+'`'
      // keys[i]+="=?"
    }

    whereStr=keys.join(" and ")
  }

  let orderStr=[]
  for(let i in order){
    orderStr.push('`'+i+"` "+(order[i]==1?"asc":"desc"))
  }
  orderStr=orderStr.join(",")

  let limitStr=""
  if(limit){
    limit.page=limit.page>0?limit.page:1
    limit.num=(limit.num>0 && limit.num<999999)?limit.num:20
    limitStr=(limit.page-1)*limit.num+ ","+limit.num
  }

  return [selectStr,whereStr,orderStr,limitStr,whereValue]
}

let find = async function(table,select,where,order,limit,countflag){
  countflag=countflag===undefined?true:false
  let selectStr=""
  if(select==undefined || select.length==0){
    selectStr="*"
  }else{
    selectStr='`'+select.join("`,`")+'`'
  }

  let whereStr=""
  let whereValue=[]
  // console.log(where)
  if(where.length==0){
      whereStr=""
  }else{
    let keys=Object.keys(where)
    
    for(let i=0;i<keys.length;i++){
      let flag
      // console.log(keys[i])
      // console.log(where[keys[i]])
      // console.log(typeof where[keys[i]] =="string")
      if(typeof where[keys[i]] =="string"){
        flag=where[keys[i]].substring(0,2)
      }else{
        flag=false
      }

      if(where[keys[i]] instanceof Array){
        // console.log(where[keys[i]])
        let tmpKey='`'+keys[i]+"` in ("
        // keys[i]=
        // let hads=[]
        let keyss=[]
        for(let x=0;x<where[keys[i]].length;x++){
          keyss.push("?")
          whereValue.push(where[keys[i]][x])
        }
        tmpKey+=keyss.join(",")+") "
        keys[i]=tmpKey
        continue
        // keyss.push()
      }
      // console.log(flag)
      switch(flag){
        case "> ":
          whereValue.push(where[keys[i]].substring(2))
          keys[i]='`'+keys[i]+'`'
          keys[i]+=">?"
        break;
        case "? ":
          whereValue.push(`%${where[keys[i]].substring(2)}%`)
          keys[i]=' `'+keys[i]+'` '
          keys[i]+="like ?"
        break;

        case "< ":
          whereValue.push(where[keys[i]].substring(2))
          keys[i]='`'+keys[i]+'`'
          keys[i]+="<?"
        break;
        case "! ":
          whereValue.push(where[keys[i]].substring(2))
          keys[i]='`'+keys[i]+'`'
          keys[i]+="<>?"
        break;
        case "^ ":
          let valuess=where[keys[i]].substring(2)
          valuess=valuess.split(",")
          whereValue.push(valuess[0])
          whereValue.push(valuess[1])
          keys[i]='(`'+keys[i]+'` between ? and ?)'
          // keys[i]+=">?"
        break;
        case "= ":
        whereValue.push(where[keys[i]].substring(2))
        keys[i]='`'+keys[i]+'`'
        keys[i]+="=?"
        break;
        default:
        whereValue.push(where[keys[i]])
        keys[i]='`'+keys[i]+'`'
        keys[i]+="=?"
        break
      }
      // whereValue.push(where[keys[i]])
      // keys[i]='`'+keys[i]+'`'
      // keys[i]+="=?"
    }

    whereStr=keys.join(" and ")
  }

  let orderStr=[]
  for(let i in order){
    orderStr.push('`'+i+"` "+(order[i]==1?"asc":"desc"))
  }
  orderStr=orderStr.join(",")

  let limitStr=""
  if(limit){
    limit.page=limit.page>0?limit.page:1
    limit.num=(limit.num>0 && limit.num<9999999999)?limit.num:20
    limitStr=(limit.page-1)*limit.num+ ","+limit.num
  }

  let _sql=`select ${selectStr} from ${table} `
  let allNumSql= `select count(1) as allNum from ${table} `
  if(whereStr){
    _sql+=`where ${whereStr} `
    allNumSql+=`where ${whereStr} `
  }
  if(orderStr){
    _sql+=`order by ${orderStr} `
  }

  if(limitStr){
    _sql+=`limit ${limitStr}`
  }
  // console.log("查询语句")
  // console.log(_sql)
  // console.log(whereValue)
  let allNum= null
  if(countflag){
    allNum= await queryDB(allNumSql,whereValue)
    allNum=allNum.length>0? allNum[0].allNum:0
  }else{
    allNum=9999
  }
  
  let datas= await queryDB(_sql,whereValue)
  return {
    allNum:allNum,
    page:limit.page,
    num:limit.num,
    data:datas
  }
  

}

let findOne= async function(table,select,where,order){
  order=order?order:{}
  let res=await find(table,select,where,order,{page:1,num:1})
  return res.data.length>0?res.data[0]:null
}


  let insertExpect = function(keys,value) {
    let _sql = "insert into users(name,pass) values(?,?);";
    return queryDB(_sql, value);
  };

  let del=async function(table,where){
    let whereStr=""
    let whereValue=[]
    // console.log(where)
    if(where.length==0){
        whereStr=""
    }else{
      let keys=Object.keys(where)
      
      for(let i=0;i<keys.length;i++){
        whereValue.push(where[keys[i]])
        keys[i]='`'+keys[i]+'`'
        keys[i]+="=?"
      }

      whereStr=keys.join(",")
    }
    let _sql = `delete from ${table} where ${whereStr}`
    let res=await queryDB(_sql,whereValue)
    // console.log(res)
    return (res &&res.changedRows!=0)?true:false
  }

  let createList = function(keys,values){
    //[[],[],[]]
    if(values==undefined || values.length==0){
        return false
    }
    let datas=[]
    let keyStrOne=""
    let keyStr=[]
    for(let i=0;i<keys.length;i++){
        keyStrOne+="?,"
    }
    keyStrOne=keyStrOne.substring(0,keyStrOne.length-1)
    keyStrOne="("+keyStrOne+")"
    for(let i=0;i<values.length;i++){
        keyStr.push(keyStrOne)
        for(let n=0;n<values[i].length;n++){
            datas.push(values[i][n])
        }
    }
    // console.log([keyStr.join(","),datas])
    return [keyStr.join(","),datas]
  }

  let insertList = function(table,keys,values){
      let list=createList(keys,values)
      let _sql = "insert into "+table+" ("+keys.join(",")+") values "+list[0]
      return queryDB(_sql,list[1])
  }

  let insert = async function(table,data){
    if(data instanceof Array == false){
      data=[data]
    }

    let keys=[]
    let values=[]
    let valuesDef=[]
    let valuesStr=[]
    if(data.length==0){
      return
    }
    for(let i in data[0]){
      if(i=="gps"){
        valuesDef.push("ST_GeomFromText(?)")
      }else{
        valuesDef.push("?")
      }
      
      keys.push(i)
    }
    valuesDef="("+valuesDef+")"
    for(let i=0;i<data.length;i++){
      valuesStr.push(valuesDef)
      // console.log("外层")
      // let tmpOne=[]
      for(let n in keys){
        // console.log(keys[n])
        // console.lo
        if(keys[n]=="gps"){
          values.push("POINT("+data[i][keys[n]].join(" ")+")")
        }else{
          values.push(data[i][keys[n]])
        }
        
      }
    }
    valuesStr=valuesStr.join(",")
    // let res=createList(data)
    let _sql = "insert into "+table+"(`"+keys.join("`,`")+"`) values "+valuesStr
    // console.log(_sql)
    // console.log(values)
    let res=await queryDB(_sql,values)
    // console.log(res)
    return res?res.insertId:false
  }

  let checkData = function(){}

  let update = async function(table,select,data){
    let selectStr=[]
    let dataStr=[]
    let datas=[]
    // console.log(data)
    if(data==undefined || data==false ||JSON.stringify(data)=="{}" ){
      return false
    }
    
    for(let i in data){
      
      if(i=="gps"){
        dataStr.push(" "+i+"=ST_GeomFromText(?) ")
        // datas.push(data[i])
        datas.push("POINT("+data[i].join(" ")+")")
      }else{
        dataStr.push(" `"+i+"`=? ")
        datas.push(data[i])
      }
      // datas.push(data[i])
    }
    for(let i in select){
      if(select[i] instanceof Array){
        selectStr.push(" "+i+" in("+select[i].join(",")+") ")
      }else{
        selectStr.push(" "+i+"=? ")
        datas.push(select[i])
      }
      
    }
    let _sql = "update "+table+" set "+dataStr.join(",")+" where "+selectStr.join("and")
    // console.log(_sql)
    // console.log(datas)
    let res= await queryDB(_sql,datas)
    // console.log(res)
    return res?true:false
  }

  let info = async function(table,select){
    let selectStr=[]
    for(let i in select){
      selectStr.push(" "+i+"="+select[i]+" ")
    }
    let _sql = "select * from "+table+" where "+selectStr.join("and")
    // console.log(_sql)
    return await queryDB(_sql)
  }

  module.exports={
      queryDB,
      insertList,
      insert,
      find,
      findOne,
      update,
      info,
      trans,
      del,
      makeSQL
  }