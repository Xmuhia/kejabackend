const { Receipt } = require('../../Schema/receiptSchema')
const {Tenant} = require('../../Schema/tenantSchema')
const mongoose = require('mongoose')
const sendEmail = require('../../Email/Email')
const { adminAccess } = require('../AccountManagement/AdminController')

const getReceiptList = async(request, response)=>{
    try{
        const {userId, } = request.body
        const id = await adminAccess(userId)
        const Data = await Tenant.aggregate([
            {
                // Match completed rent transactions
                $match: {
                    status: { $in: ["paid", "incomplete"] },
                    admin: id                        // Match where coAdmin includes id
                }
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
              $lookup: {
                from: 'watermeters', // Lookup from WaterMeter collection
                localField: 'waterMeter',
                foreignField: '_id',
                as: 'waterMeterDetails'
              }
            },
            {
                // Use $arrayElemAt to get the first element from the waterMeterDetails array
                $addFields: {
                  firstWaterMeter: { $arrayElemAt: ['$waterMeterDetails', 0] }
                }
              },
            {
                $lookup: {
                  from: 'garbages', // Lookup from WaterMeter collection
                  localField: 'garbage',
                  foreignField: '_id',
                  as: 'garbage'
                }
              },
              {
                // Use $arrayElemAt to get the first element from the waterMeterDetails array
                $addFields: {
                    garbage: { $arrayElemAt: ['$garbage', 0] }
                }
              }
         ,
            {
              $project: {
                _id: 0,
                id: '$_id',
                propertyName: '$property.name',
                tenantName: '$tenant.name',
                unitNumber: '$unit',
                email:"$tenant.email",
                rentAmount:1,
                status:1,
                tenantId: 1,
                paymentDate:1,
                propertyId:1,
                // Include the first water meter's details
                previousReading: { $ifNull: ['$firstWaterMeter.previousReading', 0] },
                currentReading: { $ifNull: ['$firstWaterMeter.currentReading', 0] },
                garbage:{ $ifNull: ['$garbage.amount', 0] },
                water:{ $ifNull: ['$firstWaterMeter.amount', 0] },
                amount: {
                    $add: [
                      '$rentAmount',
                      { $ifNull: ['$garbage.amount', 0] },
                      { $ifNull: ['$firstWaterMeter.amount', 0] }
                    ]
                  }
              }
            }
        ])

          return response.status(200).json({result:true, data:Data})
    }
    catch(error)
    {
        return response.status(403).json({result:false, message:`${error}`})
    }
}

//Creaating Receipt
const createReceipt = async (request, response)=>{
try{
  const {tenantId, propertyId, unitNumber, amount, rentAmount,email, water, garbage, previousBalance, previousReading, currentReading,tenantName,propertyName, paymentDate, userId} = request.body
      // Check if an Receipt with the same details already exists
      const id = await adminAccess(userId)
  const existingReceipt = await Receipt.findOne({
    tenantId,
    propertyName,
    propertyId,
    unitNumber,
    tenantName,
    amount,
    rentAmount,
    water,
    garbage,
    previousBalance,
    previousReading,
    currentReading,
    paymentDate,
    email,
   admin: id,
    status:'Processed'
  });
  
      // If Receipt already exists, return it
  if (existingReceipt) {
        return response.status(200).json({
          result: true,
          message: "Receipt already generated",
          data: existingReceipt
        });
  }

  const Receiptdata = await Receipt.create({
    tenantId,
    propertyName,
    propertyId,
    unitNumber,
    tenantName,
    amount,
    rentAmount,
    water,
    garbage,
    previousBalance,
    previousReading,
    currentReading,
    paymentDate,
    email,
    admin:id,
    status:'Processed'
  })

  await Receiptdata.save()
  if(Receiptdata)
  {
  return response.status(200).json({result:true, message:"Receipt generated", data:Receiptdata})
  }

  return response.status(200).json({result:false, message:"Somethng went wrong"})

}
catch(error)
{
    console.log(error)
  response.json({result:false, message:"Receipt not generated"})

}
}


const sendEmailReceipt = async(request, response)=>{
    try{
      let emailContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
      <p>Hello,</p>
      <b>Rent receipt attached to this email</b>
      <br>
      <p>Keja Team</p>
      </div>
    `;
      const {email} = request.body
      const doc = request.file
     const result = sendEmail({userEmail:email,emailTitle:"Rent Receipt",emailContent:emailContent,filename:"Rent Receipt",file:doc})
     if(result)
     {
     return response.status(200).json({result:true})
     }
     return response.status(403).json({result:false})
    
    }
    catch(error)
    {
      return response.status(403).json({result:false, message:`${error}`})
    }
    }

module.exports = {getReceiptList, createReceipt, sendEmailReceipt}