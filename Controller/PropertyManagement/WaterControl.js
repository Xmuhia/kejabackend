const {WaterMeter} = require('../../Schema/waterMeterSchema')
const mongoose = require('mongoose')
const {Tenant} = require('../../Schema/tenantSchema')
const { adminAccess } = require('../AccountManagement/AdminController')
//Create WaterMeter



const getTenantWaterMeter = async(request, response)=>{
    try
    {
        const {userId, } = request.body
        const {name,page} = request.query
       
        const id = await adminAccess(userId)
        const limit = 5
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
          { $limit: limit },
          
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
                from: 'WaterMeter', // Lookup from WaterMeter collection
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
              $project: {
                _id: 0,
                id: '$_id',
                admin: 1,
                propertyName: '$property.name',
                tenantName: '$tenant.name',
                unitNumber: '$unit',
                tenantId: 1,
                propertyId: '$property._id',
                // Include the first water meter's details
                previousReading: { $ifNull: ['$firstWaterMeter.previousReading', 0] },
                currentReading: { $ifNull: ['$firstWaterMeter.currentReading', 0] },
                readingDate: { $ifNull: ['$firstWaterMeter.readingDate', new Date()] },
              }
            }]}}
          ]);

    const totalCount = Data[0].totalCount.length > 0 ? Data[0].totalCount[0].count : 0;
    const resultData = Data[0].data;
    const totalPage = Math.ceil(totalCount/limit)

          return response.status(200).json({result:true, data:resultData, totalPage:totalPage})
    }
    catch(error)
    {
      console.log(error)
        return response.status(500).json({result:false, message:`${error}`})
    }
}


module.exports = {getTenantWaterMeter}