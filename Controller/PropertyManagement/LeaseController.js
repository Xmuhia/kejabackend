const mongoose = require('mongoose');
const { leaseSchema } = require('../../Schema/leaseSchema');
const { adminAccess } = require('../AccountManagement/AdminController');


//Create lease function

const createLease = async(request, response)=>{
    try{
    const {userId, property, unit, tenantName, startDate, endDate, rentAmount} = request.body
    const id = await adminAccess(userId)

    const lease = await leaseSchema.create({
        admin:id,
        property,
        unit,
        tenantName,
        startDate,
        endDate,
        rentAmount
    })

    await lease.save()
    return response.status(200).json({result:true, message:"lease created"})
}
catch(error)
{
    return response.status(403).json({result:false, message:`${error}`})

}
}


module.exports = {createLease}