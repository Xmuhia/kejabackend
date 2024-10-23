const { BillsAndUtilities } = require("../../Schema/billandutilitiesSchema");
const { Property } = require("../../Schema/propertySchema");
const { adminAccess } = require("../AccountManagement/AdminController");

const createBU = async (request, response) =>{
    try{
        const {userId, type, dueDate, amount, property} = await request.body
        const id = await adminAccess(userId)
        const currentDate = new Date();
        const parsedDueDate = new Date(dueDate);
        let status;
        if (parsedDueDate < currentDate) {
            status = 'Overdue';
            } else {
            status = 'Upcoming';
        }

        const create = await BillsAndUtilities.create({
            type,
            amount,
            dueDate,
            status,
            admin:id,
            property
        })
        await create.save()
        const propertyName = await Property.findOne({_id:property}).select('name')
        const name = propertyName.name
        const data ={
            type,
            amount,
            dueDate:create.dueDate,
            status:create.status,
            admin:id,
            property:name,
            _id:create._id
        }
        return response.status(200).json({result:true, data:data})

        
    }
    catch(error){
        return response.status(500).json({result:false})
    }
}



const getBills = async (request, response) =>{
    try{
        const {userId} = request.body
        const id = await adminAccess(userId)
        const data = await BillsAndUtilities.aggregate([
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

const  getGraphCosts = async(id)=>{
    const result = await BillsAndUtilities.aggregate([
        {
          $match: {
            admin:id,
            type: { 
              $in: ["Electricity", "Water", "Property Tax", "Management Fee", "Insurance", "Other"]
            }
          }
        },
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amount" }
          }
        },
        {
          $addFields: {
            type: "$_id"
          }
        },
        {
          $project: {
            _id: 0,
            type: 1,
            totalAmount: 1
          }
        }
      ]);
      
      // Transform the result into the desired format
      const types = ["Electricity", "Water", "Property Tax", "Management Fee", "Insurance", "Other"];
      const totals = types.map(type => {
        const match = result.find(r => r.type === type);
        return match ? match.totalAmount : 0;
      });

      return totals
}

const getBillData = async (request, response) =>{
    try{
        const {userId} = request.body
        const id = await adminAccess(userId)

        const totalCosts = await BillsAndUtilities.aggregate([
            {
                $match: {
                    admin: id,
                },
            },
            {
                $group: {
                    _id: null,
                    totalCost: { $sum: "$amount" }, 
                },
            }
        ]);

        const OverdueBills = await BillsAndUtilities.countDocuments({
            admin: id,
            status: "Overdue",
        });
        const  UpcomingBills = await BillsAndUtilities.countDocuments({
            admin:id,
            status: "Upcoming",
        });

        const getGraphData = await getGraphCosts(id)

        const result = {
            totalBillCosts: totalCosts.length > 0 ? totalCosts[0].totalCost : 0,
            totalOverdueBills:  OverdueBills,
            totalUpcomingBills:  UpcomingBills,
            getGraphData
        };

        return response.status(200).json({result:true, data:result})

    }
    catch(error)
    {
        return response.status(500).json({result:false}) 

    }
}

const billDelete = async(request, response) =>{
    try{
        const dataId = request.query.id
        const {userId} = request.body
        const id = await adminAccess(userId)
        await BillsAndUtilities.findByIdAndDelete({_id:dataId, admin:id})
        return response.status(200).json({result:true})
    }
    catch(error)
    {
        return response.status(500).json({result:false}) 
    }
}
module.exports = {createBU, getBills , getBillData, billDelete}