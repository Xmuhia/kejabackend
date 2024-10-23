const { Property } = require("../../Schema/propertySchema")
const {Tenant} = require("../../Schema/tenantSchema")
const {User} = require('../../Schema/userSchema')
const bcrypt = require("bcrypt")
const JWT = require("jsonwebtoken")
const verifyEmail = require("../../Email/signupEmail")
const {registrationSchema} = require("../ValidationSchema/Schema")
const { startOfMonth, endOfMonth } = require('date-fns');
const { Transaction } = require('../../Schema/transactionSchema');
const { Maintenance } = require('../../Schema/maintenanceSchema');
const { adminAccess } = require('../AccountManagement/AdminController');





const RentTotalCollected = async (id) =>{
  const result = await Transaction.aggregate([
    {
      $match: {
            $and: [
              { admin: id },           // Match where admin is equal to id
              { type: "Rent" },                
              
            ]
          
        
      }
    },
    {$group:{
    _id:null,
    amount:{$sum:"$amount"}
    }}
  ])
  const totalAmount = result.length > 0 ? result[0].amount : 0;
  return totalAmount
}


async function getMonthlyStartData(adminId) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();  // Get current month (0: Jan, 1: Feb, ..., 11: Dec)
  const currentYear = currentDate.getFullYear();

  const monthlyOccupants = new Array(12).fill(0); 
  const monthlyUnits = new Array(12).fill(0); 
  const monthlyRent = new Array(12).fill(0);
  
  for (let i = 0; i < 12; i++) {
    if (i > currentMonth) {
      monthlyOccupants[i] = 0;
      monthlyUnits[i] = 0;
      monthlyRent[i] = 0;
      continue; 
    }

    const start = startOfMonth(new Date(currentYear, i, 1)); 
    const end = endOfMonth(start); 

    const occupantsResult = await Tenant.aggregate([
      {
        $match: {
          admin: adminId,
          createdAt: { $lte: end }
        }
      },
      { $count: "totalTenants" }
    ]);

    const unitsResult = await Property.aggregate([
      {
        $match: {
          admin: adminId,
          createdAt: { $lte: end } 
        }
      },
      {
        $group: {
          _id: null,
          totalUnits: { $sum: { $ifNull: ["$units", 0] } },
          totalUnitsRent: { 
            $sum: { 
              $multiply: [
                { $ifNull: [{ $size: { $ifNull: ["$tenants", []] } }, 0] },
                { $ifNull: ["$rentAmount", 0] }  // If `rentAmount` is null, default to 0
              ] 
            }
          }
        }
      }
    ]);

    monthlyOccupants[i] = occupantsResult.length > 0 ? occupantsResult[0].totalTenants : 0;
    monthlyUnits[i] = unitsResult.length > 0 ? unitsResult[0].totalUnits : 0;
    monthlyRent[i] = unitsResult.length > 0 ? unitsResult[0].totalUnitsRent : 0;
  }

  return { monthlyOccupants, monthlyUnits, monthlyRent };
}


//Monthly Units 
async function getMonthlyData(adminId) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
  
    const monthlyOccupants = new Array(12).fill(0); 
    const monthlyUnits = new Array(12).fill(0); 
    const monthlyRent = new Array(12).fill(0);
  
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - i, 1); 
      const end = endOfMonth(date);

      const occupantsResult = await Tenant.aggregate([
       {$match: {
          admin: adminId,
          $and: [
            { createdAt: { $lte: end } },
          ]
        }
      },
      { $count: "totalTenants" }

      ]);
  
      const unitsResult = await Property.aggregate([
        {
          $match: {
            admin: adminId,
            createdAt: { $lte: end } 
          }
        },
        {
          $group: {
            _id: null,
            totalUnits: { $sum: { $ifNull: ["$units", 0] } },
            totalUnitsRent: { 
              $sum: { 
                $multiply: [
                  { $ifNull: [{ $size: { $ifNull: ["$tenants", []] } }, 0] },
                  { $ifNull: ["$rentAmount", 0] }  // If `rentAmount` is null, default to 0
                ] 
              } 
            }
          }
        }
      ]);
  
      monthlyOccupants[11 - i] = occupantsResult.length > 0 ? occupantsResult[0].totalTenants : 0;
      monthlyUnits[11 - i] = unitsResult.length > 0 ? unitsResult[0].totalUnits : 0;
      monthlyRent[11 - i] = unitsResult.length > 0 ? unitsResult[0].totalUnitsRent : 0;

    }
  
    return { monthlyOccupants, monthlyUnits, monthlyRent };
  }


const TenantCreation = async(tenantId,response, propertyId,unit, securityDeposit, leaseStartDate, parkingSpace, pets, id,leaseEndDate, numberOfOccupants,rentAmount)=>{

    const property = await Tenant.find({propertyId:propertyId, tenantId:tenantId})
    if(property.length > 0)
    {
        return response.status(200).json({
            result: false,
            message: "Tenant already created in property"
                }) 
    }

    const newUser = await Tenant.create({
        tenantId,
        propertyId,
        rentAmount,
        unit,
        pets,
        securityDeposit,
        leaseStartDate,
        leaseEndDate,
        parkingSpace,
        numberOfOccupants,
        admin:id,
        })

    await newUser.save();

    const tenantid = newUser._id;

    await Property.findByIdAndUpdate(
        propertyId, 
        { $push: { tenants: tenantid } },
        { new: true, useFindAndModify: false }
    );

    return response.status(200).json({
        result: true,
        message: "Tenant created"
    })

}

const createTenant = async (request, response)=>{
    try{
        const {propertyId, email, name, unit, securityDeposit, leaseStartDate, parkingSpace, pets, userId,leaseEndDate, numberOfOccupants,rentAmount, phone, idPassportNumber} = request.body
        const check ={
            email,name, password:idPassportNumber, role:'tenant'
        }

        const id = await adminAccess(userId)
        //validate object
        await registrationSchema.validate(check); 

        //create tenant user
        const Cap_email = email.toUpperCase()
        //encrypt password
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(idPassportNumber, salt)
    
        //check if email exist
        const emailExist = await User.find({email:Cap_email})
        if(emailExist.length > 0)
        {
            const tenantId = emailExist[0]._id
            TenantCreation(tenantId,response, propertyId,unit, securityDeposit, leaseStartDate, parkingSpace, pets, id,leaseEndDate, numberOfOccupants,rentAmount)

        }
        else{
     //create user
        const newUser = await User.create({
        name,
        password:hashPassword,
        email:Cap_email,
        role:"tenant",
        phone
        })

        await newUser.save();
        const tenantId = newUser._id;
         //email token creation
        // const emailtoken = JWT.sign({Cap_email}, process.env.EMAIL_TOKEN, {expiresIn: '24h'})


//     //email comtent
//     let emailContent = `
//     <div style="font-family: Arial, sans-serif; color: #333;">
//     <p>Hello,</p>
//     <b>Please verify your Keja account by clicking the button below</b>
//     <br/><br/>
//     <a href="https://gitkeja.vercel.app/auth/activation/${emailtoken}" 
//        style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
//        Activate email
//     </a>
//     <br/>
//     <p style="color: #ff0000;"><b>Note:</b> This link is only valid for 24 hour.</p>
//     <p>Best regards,<br/>Keja Team</p>
//     </div>
// `;

//         //email title
//         const emailTitle = "Verify Keja Account"
//          //send activation link
//         verifyEmail({
//         userEmail:Cap_email,
//         emailContent,
//         emailTitle
//         })
        TenantCreation(tenantId,response, propertyId,unit, securityDeposit, leaseStartDate, parkingSpace, pets, id,leaseEndDate, numberOfOccupants,rentAmount )
    }


    }
    catch(error)
    {
        return response.status(403).json({result:false, message:`${error}`})
    }
}



const getTenents = async(request, response) =>{
    try{
        const {userId} = request.body
        const id = await adminAccess(userId)
        const Data = await Tenant.aggregate([
            { $match: { admin: id },            // Match where admin is equal to id
             },
            { $limit: 10 },
             {
              $lookup: {
                from: 'users',
                localField: 'tenantId',
                foreignField: '_id',
                as: 'tenant'
              }
            },
            { $unwind: '$tenant' },
            {
              $lookup: {
                from: 'properties',
                localField: 'propertyId',
                foreignField: '_id',
                as: 'property'
              }
            },
            { $unwind: '$property' },
            {
              $project: {
                _id:0,
                id: '$_id',
                admin: 1,
                propertyName: '$property.name',
                tenantName: '$tenant.name',
                occupancyStartDate:'$leaseStartDate',
                occupancyEndDate:'$leaseEndDate',
                status:1,
                rentAmount:1,
                unitNumber:'$unit',
                email:"$tenant.email",
                avatar:"$tenant.profile_image",
                phone:"$tenant.phone",
                name:"$tenant.name",
                tenantId:1,
                propertyId:"$property._id"
              }
            }
          ]);
          
        return response.status(200).json({result:true, data:Data})

    }
    catch(error)
    {
        console.log(error)
        return response.status(500).json({result:false, message:`${error}`})
    }

}


const getOccupancyRate = async(request, response) =>{
    try{
        const {userId} = request.body
        const id = await adminAccess(userId)
        
        //find property
        const Data = await Property.aggregate([
            { $match:
              { admin: id } 
             }, 
            { 
              $project: {
                totalunits: { $ifNull: ["$units", 0] },
                occupancy: { $size: { $ifNull: ["$tenants", []] } },
              }
            },
            {
              $group: {
                _id: null,  
                totalProperties: { $sum: 1 }, 
                totalunits: { $sum: "$totalunits" }, 
                totalOccupancy: { $sum: "$occupancy" } 
              }
            },
            {
              $project: {
                _id: 0,  // Exclude the _id field from the result
                totalProperties: 1,
                totalunits: 1,
                totalOccupancy: 1,
                averageOccupancyRate: {
                  $round: [
                    {
                      $cond: { 
                        if: { $eq: ["$totalunits", 0] },  // Avoid division by zero
                        then: 0,
                        else: { 
                          $multiply: [
                            { $divide: ["$totalOccupancy", "$totalunits"] }, 
                            100 
                          ]
                        }
                      }
                    },
                    2 // Rounds to the nearest integer
                  ]
                }
              }
            }
          ]);

          const totalRentCollected = await RentTotalCollected(id)
          const {monthlyOccupants, monthlyUnits} = await  getMonthlyData(id)
          const occupancyRates = monthlyOccupants.map((occupants, index) => {
            const units = monthlyUnits[index] || 0; // Fallback to 0 if units are not available
            const occupancyRate = units > 0 ? (occupants / units) * 100 : 0; 
            return Math.round(occupancyRate);
          });

         if(Data && Data.length > 0)
        {
            Data[0].totalRentCollected = totalRentCollected
            Data[0].occupancyRatesMonthly = occupancyRates
        }
        
        return response.status(200).json({result:true,  data:Data[0]})

    }
    catch(error)
    {
      console.log(error)
        return response.status(500).json({result:false, message:`${error}`})

    }

}

//Get tenant by id
const getTenantById = async( request, response)=>{
  try{
  const id = request.query.id
  const Data = await Tenant.findOne({tenantId:id}).populate({path:'tenantId', select:'name profile_image phone email'})
  if(!Data)
  {
    return response.status(403).json({result:false, message:'User doesnt exist'})
  }
  const Payment = await Transaction.findOne({user:id})
  const Maintenanc =  await Maintenance.find({user:id})
  const data = {
    id:id,
    avatar:Data?.tenantId?.profile_image,
    email:Data?.tenantId?.email,
    phone:Data?.tenantId?.phone,
    name:Data?.tenantId?.name,
    unitNumber:Data?.unit,
    leaseInfo:{
      startDate:Data?.leaseStartDate,
      endDate:Data?.leaseEndDate,
      rentAmount:Data?.rentAmount,
      securityDeposit:Data?.securityDeposit
    },
    paymentHistory:Payment ||  {},
    occupants: Data.numberOfOccupants,
    pets:Data.pets,
    maintenanceRequests:  Maintenanc
  }

  return response.status(200).json({result:true, data:data})
  }
  catch(error)
  {
    console.log(error)
  }

}

module.exports = {createTenant, getOccupancyRate, getTenents, getTenantById, getMonthlyData, getMonthlyStartData}