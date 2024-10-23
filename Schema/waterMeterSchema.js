const {Schema,model} =  require('mongoose')

const WaterMeter = Schema({
    property:{
        type:Schema.Types.ObjectId,
        ref:'Property'
    },
    amount:{
        type:Number
    }
    ,
    tenant:{
        type:Schema.Types.ObjectId,
        ref:'Tenant'
    },
    admin:{
         type:Schema.Types.ObjectId,
         ref:'User'
    },
    previousReading:{
        type:Number,
    },
    currentReading:{
        type:Number,
    }
    ,
    readingDate:{
        type:Date
    },
    unit:{
        type:String
    },
    previousImage:{
        type:String
    },
    currentImage:{
        type:String
    }
},{timestamps:true})

module.exports.WaterMeter = model('WaterMeter', WaterMeter)