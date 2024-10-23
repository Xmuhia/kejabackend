const {Schema,model} =  require('mongoose')



//Tenant Schema
const Tenant = Schema({

    tenantId:{
        type:Schema.Types.ObjectId,
        ref:'Users'
    },
    rentAmount:{
        type:Number
    },
    tenant_score:{
        type:Number
    },
    propertyId:{
        type:Schema.Types.ObjectId,
        ref:'Property'
    },
    numberOfOccupants:{
        type:Number
    },
    pets:{
        type:Boolean
    },
    payment_history:[{type:Schema.Types.ObjectId,
        ref:'Transaction'}],
    maintenance_request:[{ 
        type:Schema.Types.ObjectId,
        ref:'Maintenance'}],

    leaseStartDate: {
            type: Date, // You can change this to another type if needed (e.g., String for custom formats)
            required: true // Assuming you want this field to be mandatory
          },
    leaseEndDate: {
            type: Date,
            required: true // Optional, depending on your use case
          },
  
    securityDeposit:{
        type:Number
    },
    unit:{
        type:String
    },
    parkingSpace:{
        type:Number
    },
    status:{
        type:String,
        enum:["Overdue","Unpaid","Paid"],
        default:"Unpaid"
    },
    statusDate:{
        type:Date
    }
    ,
    admin:{
        type:Schema.Types.ObjectId,
        ref:'Users'
    },
    waterMeter:[{
        type:Schema.Types.ObjectId,
        ref:'WaterMeter'
    }],
    garbage:[{
         type:Schema.Types.ObjectId,
        ref:'Garbage'
    }],
    paymentDate:{
        type:Date
    }
},{timestamps:true})

module.exports.Tenant = model('Tenant', Tenant)