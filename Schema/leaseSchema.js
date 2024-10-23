const {Schema,model} =  require('mongoose')

const leaseSchema = new Schema({
    property:{
        type: Schema.Types.ObjectId, 
        ref: 'Property' 
    },
    unit:{
        type:String
    },
    tenantName:{
        type:String
    },
    startDate:{
        type:Date
    },
    endDate:{
        type:Date
    },
    rentAmount:{
        type:Number
    },
    admin:{
         type:Schema.Types.ObjectId,
        ref:'User'
    }
},{timestamps:true})

module.exports.leaseSchema = model("leaseSchema", leaseSchema)