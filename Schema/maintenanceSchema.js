const {Schema,model} =  require('mongoose')

const Maintenance = Schema({
    description:{
        type:String
    },
    title:{
        type:String
    },
    status:{
        type:String,
        enum:["Pending", "InProgress","Completed"]
    },
    priority:{
        type:String,
        enum:["Low", "High","Medium"]
    }
    ,
    user:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    property:{
         type:Schema.Types.ObjectId,
        ref:'Property'
    },
    unit:{
        type:String
    },
    admin:{
         type:Schema.Types.ObjectId,
        ref:'User'
    },
    date:{
        type:Date
    },
    cost:{
        type:Number
    }
},{timestamps:true})

module.exports.Maintenance = model("Maintenance", Maintenance)