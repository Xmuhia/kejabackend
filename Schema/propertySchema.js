const {Schema,model} =  require('mongoose')


// Tenant Subschema with timestamps
const TenantSchema = new Schema({
    tenant: { 
        type: Schema.Types.ObjectId, 
        ref: 'Tenant' 
    }
}, { timestamps: true });

const Property = Schema({
    name:{
        type:String
    },
    location:{
        type:String
    },
    description:{
        type:String
    },
    units:{
        type:Number
    },
    rentAmount:{
        type:Number,
        default:0
    },
    admin:{
        type: Schema.Types.ObjectId,
       ref: 'Users'
   },
   managers:[
    {
        name:{type:String},
        phone:{type:String}
    }
   ],
   tenants: [TenantSchema],
    maintenanceRequest:[{  
        type:Schema.Types.ObjectId,
        ref:'Maintenance' }],

    transactions:[{ type:Schema.Types.ObjectId,
        ref:'Transaction'}],

    unitIds:[{ type: Schema.Types.ObjectId,
        ref: 'Unit' }],
        
    parkingSpace:{
        type:String
    },
    type:{
        type:String,
        enum:["Apartment","House","Commercial","Condominium","Townhouse","SingleFamily"]
    },
    acquisitionDate:{
        type:Date
    },
    description:{
        type:String
    },
    image:{
        type:String
    },
    amenities:[{
        type:String
    }],
    nearbyFacilities:[{
        type:String
    }],
    estimatedPropertyValue:{
        type:Number,
        default:0
    },
    leaseTerms:{
        type:String
    },
    utilities:[
        {
            name:{type:String},
            cost:{type:Number}
        }
    ],
    garbageFee:{
        type:Number
    },
    tenantsReminder:[{
        type: Schema.Types.ObjectId, 
        ref: 'Tenant' 
    }],
},{timestamps:true})

module.exports.Property = model("Property", Property)