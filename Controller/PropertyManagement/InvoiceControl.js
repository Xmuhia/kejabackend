const mongoose = require('mongoose');
const {Tenant} = require('../../Schema/tenantSchema');
const { Transaction } = require('../../Schema/transactionSchema');
const {Invoice} = require('../../Schema/invoiceSchema')
const sendEmail = require('../../Email/Email');
const { adminAccess } = require('../AccountManagement/AdminController');

const totalAmount = async (id) =>{
    const Data = await Tenant.aggregate([
      {
        $match: { admin: id },        // Match where admin is equal to id

      },
        {
          $lookup: {
            from: 'watermeters',
            localField: 'waterMeter',
            foreignField: '_id',
            as: 'waterMeterDetails'
          }
        },
        {
          $addFields: {
            firstWaterMeter: { $arrayElemAt: ['$waterMeterDetails', 0] } // Get first water meter details
          }
        },
        {
          $lookup: {
            from: 'garbages',
            localField: 'garbage',
            foreignField: '_id',
            as: 'garbage'
          }
        },
        {
          $addFields: {
            garbage: { $arrayElemAt: ['$garbage', 0] } // Get first garbage entry
          }
        },
        {
          $project: {
            garbageAmount: { $ifNull: ['$garbage.amount', 0] }, // Garbage amount
            rentAmount: { $ifNull: ['$rentAmount', 0] }, // Rent amount
            waterAmount: { $ifNull: ['$firstWaterMeter.amount', 0] }, // Water meter amount
            month: { $month: '$createdAt' } // Extract month from createdAt
          }
        },
        {
          $group: {
            _id: '$month', // Group by month
            totalGarbage: { $sum: '$garbageAmount' }, // Total garbage per month
            totalRentAmount: { $sum: '$rentAmount' }, // Total rent per month
            totalWaterAmount: { $sum: '$waterAmount' } // Total water amount per month
          }
        },
        {
          $sort: { _id: 1 } // Sort by month (1 = January, 12 = December)
        },
        {
          $group: {
            _id: null,
            totals: {
              $push: {
                month: '$_id',
                totalGarbage: '$totalGarbage',
                totalRentAmount: '$totalRentAmount',
                totalWaterAmount: '$totalWaterAmount'
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalsgarbage: {
              $map: {
                input: { $range: [1, 13] }, // Iterate over months 1 to 12
                as: 'month',
                in: {
                  $let: {
                    vars: {
                      matchingMonth: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$totals',
                              as: 't',
                              cond: { $eq: ['$$t.month', '$$month'] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      $ifNull: ['$$matchingMonth.totalGarbage', 0] // Default to 0 if no data
                    }
                  }
                }
              }
            },
            totalRentAmount: {
              $map: {
                input: { $range: [1, 13] }, // Iterate over months 1 to 12
                as: 'month',
                in: {
                  $let: {
                    vars: {
                      matchingMonth: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$totals',
                              as: 't',
                              cond: { $eq: ['$$t.month', '$$month'] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      $ifNull: ['$$matchingMonth.totalRentAmount', 0] // Default to 0 if no data
                    }
                  }
                }
              }
            },
            totalswater: {
              $map: {
                input: { $range: [1, 13] }, // Iterate over months 1 to 12
                as: 'month',
                in: {
                  $let: {
                    vars: {
                      matchingMonth: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$totals',
                              as: 't',
                              cond: { $eq: ['$$t.month', '$$month'] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      $ifNull: ['$$matchingMonth.totalWaterAmount', 0] // Default to 0 if no data
                    }
                  }
                }
              }
            }
          }
        }
      ]);
      
      return Data
}

const getTenantInvoice = async(request, response)=>{
    try
    {
          const {userId, } = request.body
          const id = await adminAccess(userId)

          const total = await totalAmount(id)

          return response.status(200).json({result:true, display:total[0]})
    }
    catch(error)
    {
        return response.status(403).json({result:false, message:`${error}`})
    }
}


//Get Receipt
const getRecipt = async(request, response)=>{

  try{
    const {userId, } = request.body
    const id = await adminAccess(userId)
    const Data = await Transaction.aggregate([
      {
        $match: {
          type: "rent",
          status: "Completed",
           admin: id        // Match where admin is equal to id
        }
      },
      {
        // Group by year and month using createdAt
        $group: {
          _id: { 
            year: { $year: "$createdAt" }, 
            month: { $month: "$createdAt" }
          },
          totalAmount: { $sum: "$amount" }
        }
      },
      {
        // Sort by year and month
        $sort: {
          "_id.year": 1,
          "_id.month": 1
        }
      },
      {
        // Create an array with total amounts for each month
        $group: {
          _id: "$_id.year", // Group by year (or remove if you want for all years)
          monthlyTotals: {
            $push: {
              month: "$_id.month",
              totalAmount: "$totalAmount"
            }
          }
        }
      },
      {
        // Format the result to get amounts for each month (1-12), filling missing months with 0
        $project: {
          totals: {
            $map: {
              input: { $range: [ 1, 13 ] }, // Range from 1 (January) to 12 (December)
              as: "month",
              in: {
                $let: {
                  vars: {
                    matched: { 
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$monthlyTotals",
                            as: "entry",
                            cond: { $eq: [ "$$entry.month", "$$month" ] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: { 
                    $ifNull: [ "$$matched.totalAmount", 0 ] // Return 0 if no matching month found
                  }
                }
              }
            }
          }
        }
      }
    ]);
    
    let data;
    if(Data.length == 0)
    {
      data = [0,0,0,0,0,0,0,0,0,0,0,0]
    }
    else{
      data = Data
    }

    return response.status(200).json({result:true, data})
    
  }
  catch(error)
  {
    return response.status(403).json({result:false, message:`${error}`})
  }
}

const sendEmailInvoice = async(request, response)=>{
try{
  let emailContent = `
  <div style="font-family: Arial, sans-serif; color: #333;">
  <p>Hello,</p>
  <b>Rent invoice attached to this email</b>
  <br>
  <p>Keja Team</p>
  </div>
`;
  const {email} = request.body
  const doc = request.file
 const result = sendEmail({userEmail:email,emailTitle:"Rent Invoice",emailContent:emailContent,filename:"Rent Invoice",file:doc})
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

const createInvoice = async (request, response)=>{
try{
  const {tenantId, propertyId, unitNumber, amount, status, rentAmount,email, water, garbage, previousBalance, previousReading, currentReading,tenantName,propertyName, leaseEndDate, userId} = request.body
  const id = await adminAccess(userId)

      // Check if an invoice with the same details already exists
  const existingInvoice = await Invoice.findOne({
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
    leaseEndDate,
    email,
    admin:id,
    status
  });
  
      // If invoice already exists, return it
  if (existingInvoice) {
        return response.status(200).json({
          result: true,
          message: "Invoice already generated",
          data: existingInvoice
        });
  }

  const Invoicedata = await Invoice.create({
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
    leaseEndDate,
    email,
    admin:id,
    status
  })

  await Invoicedata.save()
  if(Invoicedata)
  {
  return response.status(200).json({result:true, message:"Invoice generated", data:Invoicedata})
  }

  return response.status(200).json({result:false, message:"Somethng went wrong"})

}
catch(error)
{
  return response.status(403).json({result:false, message:"Invoice not generated"})

}
}


const getTenantInvoiceSearch = async(request, response)=>{
  try{
    const {userId, } = request.body
    const {name,page} = request.query
    const limit = 5

    const id = await adminAccess(userId)
    const Data = await Tenant.aggregate([
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
        $match: {
          $and: [
            { admin: id },         // Match where admin is equal to id
            { 'tenant.name': { $regex: name, $options: 'i' } }  // Case-insensitive search for tenant name
          ]
        }
      },
      {
        $facet: {
          totalCount: [
            { $count: 'count' }  // Count total documents matching the filter
          ],
          data: [
            { $skip: (page - 1) * limit },  // Pagination: skip based on page number
            { $limit: limit },              // Limit to the desired number of documents
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
                from: 'watermeters',
                localField: 'waterMeter',
                foreignField: '_id',
                as: 'waterMeterDetails'
              }
            },
            {
              $addFields: {
                firstWaterMeter: { $arrayElemAt: ['$waterMeterDetails', 0] }
              }
            },
            {
              $lookup: {
                from: 'garbages',
                localField: 'garbage',
                foreignField: '_id',
                as: 'garbage'
              }
            },
            {
              $addFields: {
                garbage: { $arrayElemAt: ['$garbage', 0] }
              }
            },
            {
              $project: {
                _id: 0,
                id: '$_id',
                propertyName: '$property.name',
                tenantName: '$tenant.name',
                phone: '$tenant.phone',
                unitNumber: '$unit',
                email: '$tenant.email',
                rentAmount: 1,
                status: 1,
                tenantId: 1,
                leaseEndDate: 1,
                propertyId: 1,
                previousReading: { $ifNull: ['$firstWaterMeter.previousReading', 0] },
                currentReading: { $ifNull: ['$firstWaterMeter.currentReading', 0] },
                garbage: { $ifNull: ['$garbage.amount', 0] },
                water: { $ifNull: ['$firstWaterMeter.amount', 0] },
                amount: {
                  $add: [
                    '$rentAmount',
                    { $ifNull: ['$garbage.amount', 0] },
                    { $ifNull: ['$firstWaterMeter.amount', 0] }
                  ]
                }
              }
            }
          ]
        }
      }
    ]);
    const totalCount = Data[0].totalCount.length > 0 ? Data[0].totalCount[0].count : 0;
    const resultData = Data[0].data;
    const totalPage = Math.ceil(totalCount/limit)
    return response.status(200).json({result:true, data:resultData, totalCount:totalPage})
    
  }
  catch(error){
   return response.status(403).json({result:false, message:"Search Failed"})
  }
}


module.exports = {getTenantInvoice,getRecipt, sendEmailInvoice, createInvoice, getTenantInvoiceSearch}