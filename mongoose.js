const mongo = require('mongoose')

const mongoosedb = async()=>{
    try{
        //connecting to database
        const connection = await mongo.connect(process.env.MONGO,{
            dbName:"kejadata",
            bufferCommands:true
        })
        console.log(`Mongo Connect: ${connection.connection.host}`)
    }
    catch(error)
    {
        console.log(error)
    }
}
module.exports = mongoosedb