const {Schema,model} =  require('mongoose')


const Transaction = Schema({
    amount:{
        type:Number
    },
    payment_method:{
        type:String,
        enum:["bank transfer", "credit card", "cash", "debit card"],
        required:true
    },
    tenantId:{
        type:Schema.Types.ObjectId,
        ref:'Tenant'
    }
    ,
    balance:{
        type:Number
    },
    user:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    type:{
        type:String,
        enum:["Rent","Maintenance","Deposit","Refund",'PropertyTax','ManagementFee','Insurance','Utilities']
    },
    propertyId:{
        type:Schema.Types.ObjectId,
        ref:'Property'
    },
    status:{
        type:String,
        enum:["Completed","Pending", "Failed"]
    },
    admin:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    StartDate: {
        type: Date, // You can change this to another type if needed (e.g., String for custom formats)
      },
    EndDate: {
        type: Date,
      },
    paymentType:{
        type:String,
        enum:["debit", "credit"]
    },
    paymentTrendsData:{
        type:String,
        enum:["late", "ontime"]
    }
    
},{timestamps:true})

module.exports.Transaction = model("Transaction", Transaction)