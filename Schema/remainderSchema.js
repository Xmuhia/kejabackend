const {Schema,model} =  require('mongoose')

const Reminder = Schema({
    tenantId:{
        type:Schema.Types.ObjectId,
        ref:"Tenant"
    },
    propertyId:{
        type:Schema.Types.ObjectId,
        ref:"Property"},
    unitNumber:{
        type:String
    },
    amount:{
        type:Number
    },
    type:{
        type:String
    },
    propertyName:{
        type:String
    },
    tenantName:{
        type:String
    },
    dueDate:{
        type:Date
    },
    email:{
        type:String
    },
    admin:{
        type: Schema.Types.ObjectId,
       ref: 'Users'
    },
    status:{
        type:String 
    },
    message:{
        type:String
    }
},{timestamps:true})

module.exports.Reminder  = model('Reminder ', Reminder )