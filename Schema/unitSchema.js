const { type } = require('express/lib/response')
const {Schema,model} =  require('mongoose')

const Unit = Schema({
    tenant_id:{
        type:Schema.Types.ObjectId,
        ref:"Tenant"
    },
    property_id:{
        type:Schema.Types.ObjectId,
        ref:"Property"},
    unit:{
        type:String
    },
    rentAmount:{
        type:Number
    }
    
})

module.exports.Unit = model('Unit', Unit)