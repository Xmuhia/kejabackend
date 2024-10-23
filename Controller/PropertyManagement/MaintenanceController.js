const { Maintenance } = require("../../Schema/maintenanceSchema")
const { Property } = require("../../Schema/propertySchema")
const { Tenant } = require("../../Schema/tenantSchema")
const { adminAccess } = require("../AccountManagement/AdminController")


const createMaintenance = async(request, response) =>{
try{
    const {userId, cost, date, description, property, status, unit} = await request.body
    const id = await adminAccess(userId)
    const create = await Maintenance.create({
        cost,
        date,
        description,
        property,
        status,
        unit,
        admin:id
    })

    await create.save()
    const propertyName = await Property.findOne({_id:property}).select('name')
    const name = propertyName.name
    const newData ={
        cost,
        date:create.date,
        description,
        property:name,
        status,
        unit, 
        admin:id,
        _id:create._id
    }

   

    return response.status(200).json({result:true, data:newData})

}
catch(error)
{
    return response.status(500).json({result:false})

}
}

const getUnit = async (request, response) =>{
    try{
        const {userId} = request.body
        const id = await adminAccess(userId)
        const {property} = request.query
        const result = await Tenant.find({propertyId:property, admin:id}).select('unit')
        return response.status(200).json({result:true, data:result})

    }
    catch(error)
    {
        return response.status(500).json({result:false}) 
    }
}

//getMaintenance List
const getMaintenance = async (request, response) =>{
    try{
        const {userId} = request.body
        const id = await adminAccess(userId)
        const data = await Maintenance.aggregate([
            {
              $match: { admin: id } 
            },
            {
                $sort: { createdAt: -1 }
            },
            {
              $lookup: {
                from: 'properties',  
                localField: 'property', 
                foreignField: '_id',  
                as: 'property'  
              }
            },
            {
              $unwind: {
                path: '$property',   
                preserveNullAndEmptyArrays: true  
              }
            },
            {
              $addFields: {
                property: '$property.name'  
              }
            }
          ])

          return response.status(200).json({result:true, data:data})
       
    }
    catch(error)
    {
        return response.status(500).json({result:false}) 
    }
}


async function getMonthlyCosts(id) {
    const currentYear = new Date().getFullYear();
    const monthlyCosts = await Maintenance.aggregate([
        {
            $match: {
                admin:id,
                date: {
                    $gte: new Date(`${currentYear}-01-01`), 
                    $lt: new Date(`${currentYear + 1}-01-01`), 
                },
            },
        },
        {
            $group: {
                _id: { $month: "$date" }, 
                totalCost: { $sum: "$cost" }, 
            },
        },
        {
            $project: {
                month: "$_id",
                totalCost: "$totalCost",
                _id: 0,
            },
        },
        {
            $sort: { month: 1 },
        },
    ])

    const costsArray = Array(12).fill(0);
    monthlyCosts.forEach(item => {
        costsArray[item.month - 1] = item.totalCost; 
    });

    return costsArray;
}


const Maintenances = async(id)=>{
    const totalCosts = await Maintenance.aggregate([
        {
            $match: {
                admin: id,
            },
        },
        {
            $group: {
                _id: null,
                totalCost: { $sum: "$cost" }, 
            },
        }
    ]);

    const pendingRequests = await Maintenance.countDocuments({
        admin: id,
        status: "Pending",
    });
    const completedTasks = await Maintenance.countDocuments({
        admin:id,
        status: "Completed",
    });

    const InProgressTasks = await Maintenance.countDocuments({
        admin:id,
        status: "InProgress",
    });

    const totalMaintenance = pendingRequests + completedTasks + InProgressTasks

    return {totalCosts, pendingRequests, completedTasks,InProgressTasks, totalMaintenance }
}

const getMaintenanceData = async (request, response) =>{
    try{
        const {userId} = request.body
        const id = await adminAccess(userId)

        const {totalCosts, pendingRequests, completedTasks} = await Maintenances(id)

        const getMonthlyData = await getMonthlyCosts(id)

        const result = {
            totalMaintenanceCosts: totalCosts.length > 0 ? totalCosts[0].totalCost : 0,
            totalPendingRequests: pendingRequests,
            totalCompletedTasks: completedTasks,
            getMonthlyData
        };

        return response.status(200).json({result:true, data:result})

    }
    catch(error)
    {
        return response.status(500).json({result:false}) 

    }
}


module.exports = {getUnit, createMaintenance, getMaintenance, getMaintenanceData, Maintenances}