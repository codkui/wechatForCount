async function sleep(sec){
    return new Promise((resolve, reject) =>{
        setTimeout(()=>{
            resolve(true)
        },sec*1000)
    })
}

module.exports ={sleep}