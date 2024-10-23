const {Schema,model} =  require('mongoose')


const Receipt = Schema({
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
    }
    ,
    rentAmount:{
        type:Number
    },
    water:{
        type:Number
    },
    garbage:{
        type:Number
    },
    previousBalance:{
        type:Number
    },
    previousReading:{
        type:Number
    },
    currentReading:{
        type:Number
    },
    propertyName:{
        type:String
    },
    tenantName:{
        type:String
    },
    paymentDate:{
        type:Date
    },
    email:{
        type:String
    },
    status:{
        type:String
    },
    admin:{
        type: Schema.Types.ObjectId,
       ref: 'Users'
    }
})

module.exports.Receipt = model('Receipt', Receipt)