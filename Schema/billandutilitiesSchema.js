const {Schema,model} =  require('mongoose')

const BillsAndUtilities = Schema({
    type:{
        type:String,
        enum:["Electricity", "Water","Property Tax", "Management Fee", "Insurance", "Other"]
    }
    ,
    property:{
         type:Schema.Types.ObjectId,
        ref:'Property'
    },
    admin:{
         type:Schema.Types.ObjectId,
        ref:'User'
    },
    dueDate:{
        type:Date
    },
    amount:{
        type:Number
    },
    status:{
        type:String,
        enum:["Overdue", "Upcoming"]
    },
},{timestamps:true})

module.exports.BillsAndUtilities = model('BillsAndUtilities',BillsAndUtilities)