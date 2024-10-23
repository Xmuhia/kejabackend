const { default: mongoose } = require("mongoose")
const { Transaction } = require("../../Schema/transactionSchema")
const { Invoice } = require("../../Schema/invoiceSchema")
const { Receipt } = require("../../Schema/receiptSchema")
const { Reminder } = require("../../Schema/remainderSchema")
const { adminAccess } = require("../AccountManagement/AdminController")
const { getMonthlyStartData } = require("./TenantController")



//GetData
const getInvoice = async (request, response)=>{
 try{
    const {userId} = request.body
    const id = await adminAccess(userId)

    const query = { admin: id }

    const {word, page = 1} = request.query
    const limit = 5
    if (word) {
        query.tenantName = { $regex: word, $options: 'i' };
      }

    const skip = (page - 1) * limit;
    const totalCount = await Invoice.countDocuments(query);

     
     const data = await Invoice.find(query).skip(skip).limit(limit);
    return response.status(200).json({result:true, data:data, totalPages: Math.ceil(totalCount / limit)})
 }
 catch(error)
 {
    return response.status(404).json({result:false})
 }
}

const getReceipt = async (request, response)=>{
    try{
      const {userId} = request.body
      const id = await adminAccess(userId)
  
      const query = { admin: id }
  
      const {word, page = 1} = request.query
      const limit = 5
      if (word) {
          query.tenantName = { $regex: word, $options: 'i' };
        }
  
      const skip = (page - 1) * limit;
      const totalCount = await Receipt.countDocuments(query);
        const data = await Receipt.find(query).skip(skip).limit(limit);
       return response.status(200).json({result:true, data:data,  totalPages: Math.ceil(totalCount / limit)})
    }
    catch(error)
    {
       return response.status(404).json({result:false})
    }
   }

//
const getReminder = async (request, response) =>{
    try{
      const {userId} = request.body
      const id = await adminAccess(userId)
  
      const query = { admin: id }
  
      const {word, page = 1} = request.query
      const limit = 5
      if (word) {
          query.tenantName = { $regex: word, $options: 'i' };
        }
  
      const skip = (page - 1) * limit;
      const totalCount = await Reminder.countDocuments(query);
      const data = await Reminder.find(query).skip(skip).limit(limit);
      
      return response.status(200).json({ result: true, data: data, totalPages: Math.ceil(totalCount / limit) });
     }
     catch(error)
     {
        return response.status(500).json({result:false})
     }
}

//Monthly revenue
const monthlyRevenue = async(request, response)=>{
 try{
    const {userId} = request.body
    const id = await adminAccess(userId)
    const data = await Transaction.aggregate([
    {
        $match: {
            $and: [
                  { admin: id },            
              { type: { $in: ["rent", "deposit"] } }, 
            ],
          }
    },
    {
        $group: {
            _id: { $month: "$createdAt" }, 
            totalAmount: { $sum: "$amount" } 
        }
    },
    {
        $sort: { "_id": 1 } // Sort by month
    }
    ]);
    const result = new Array(12).fill(0);

    const invoices = await Invoice.countDocuments({admin:id})
    const receipts = await Receipt.countDocuments({admin:id})
    const reminders = await Reminder.countDocuments({admin:id})

    const documentCounts ={
        invoices,
        receipts,
        reminders
    }

// Update the result array with the totals from the aggregation result
    if (data.length > 0) {
    data.forEach(item => {
        // Adjust index for 0-based array
        result[item._id - 1] = item.totalAmount; 
    });

        return response.status(200).json({result:true, data:data, documentCounts})

    } else {
        return response.status(200).json({result:true, data:result, documentCounts})
    }

 }
 catch(error)
 {
    return response.status(404).json({result:false})
}
}

const TransactionMonthly = async(id) =>{ 
    const result  = await Transaction.aggregate([
                {
                  $match: {
                    $and: [
                        { admin: id },
                        { paymentType: "credit" },]
                  }
                },
                {
                  $group: {
                    _id: { 
                      year: { $year: "$createdAt" }, 
                      month: { $month: "$createdAt" } 
                    },
                    totalAmount: { $sum: "$amount" } 
                  }
                },
                {
                  $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                  }
                },
                {
                  $project: {
                    _id: 0, // Exclude the `_id` field
                    year: "$_id.year",
                    month: "$_id.month",
                    totalAmount: 1
                  }
                }
              ])

    const monthlyTotals = new Array(12).fill(0);
    result.forEach(item => {
        const monthIndex = item.month - 1; // Months are 1-12, array is 0-indexed
        monthlyTotals[monthIndex] = item.totalAmount;
      });    

   return monthlyTotals 
}

const getOccupancyImpact = async(request, response) =>{
try{
const {userId} = request.body
const id = await adminAccess(userId)

const {monthlyOccupants, monthlyUnits, monthlyRent} = await getMonthlyStartData(id)
const occupancyRates = monthlyOccupants.map((occupants, index) => {
    const units = monthlyUnits[index] || 0; // Fallback to 0 if units are not available
    const occupancyRate = units > 0 ? (occupants / units) * 100 : 0; 
    return Math.round(occupancyRate);
  });
const revenue = await TransactionMonthly(id)
return response.status(200).json({result:true, data:{
    monthlyRevenue:revenue,
    monthlyOccupants:occupancyRates,
    expectedRevenue:monthlyRent
}})

}
catch(error)
{
    return response.status(500).json({result:false})

}
}

const Revenue = async(id)=>{
    const result  = await Transaction.aggregate([
        {
          $match: {
            $and: [
                { admin: id },
                { paymentType: "credit" },]
          }
        },
        {
          $group: {
            _id: { 
              year: { $year: "$createdAt" }, 
              month: { $month: "$createdAt" } 
            },
            totalAmount: { $sum: "$amount" } 
          }
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1
          }
        },
        {
          $project: {
            _id: 0, // Exclude the `_id` field
            year: "$_id.year",
            month: "$_id.month",
            totalAmount: 1
          }
        }
      ])

const monthlyTotals = new Array(12).fill(0);
result.forEach(item => {
const monthIndex = item.month - 1; // Months are 1-12, array is 0-indexed
monthlyTotals[monthIndex] = item.totalAmount;
});    

return monthlyTotals 
}

const paymentTrend = async (request, response) =>{
    try{
        const {userId} = request.body
        const id = await adminAccess(userId)

        const paymentTrends = await Revenue(id)
          const late = new Array(12).fill(0); 
        const ontime = new Array(12).fill(0);

        paymentTrends.forEach(item => {
            const monthIndex = item.month - 1;
            late[monthIndex] = item.lateCount;
            ontime[monthIndex] = item.ontimeCount;
          });
        
          return response.status(200).json({result:true, data:{
           late:late,ontime:ontime
        }})
    }
    catch(error){
        return response.status(500).json({result:false}) 
    }
}

const Expanses = async(id)=>{
    const result  = await Transaction.aggregate([
        {
          $match: {
            $and: [
                { admin: id },
                { paymentType: "debit" },]
          }
        },
        {
          $group: {
            _id: { 
              year: { $year: "$createdAt" }, 
              month: { $month: "$createdAt" } 
            },
            totalAmount: { $sum: "$amount" } 
          }
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1
          }
        },
        {
          $project: {
            _id: 0, // Exclude the `_id` field
            year: "$_id.year",
            month: "$_id.month",
            totalAmount: 1
          }
        }
      ])

const monthlyTotals = new Array(12).fill(0);
result.forEach(item => {
const monthIndex = item.month - 1; // Months are 1-12, array is 0-indexed
monthlyTotals[monthIndex] = item.totalAmount;
});    

return monthlyTotals 


}

const getIncome = async(request, response )  =>{
    try{
        const {userId} = request.body
        const id = await adminAccess(userId)
        const income = await Revenue(id)
        const expense = await Expanses(id)

        const data = {
            expense:expense,
            income:income
        }

        return response.status(200).json({result:true, data})
    }
    catch(error)
    {
        return response.status(500).json({result:false}) 
    }
}

const expenseBreakdown = async(request, response ) =>{
  try{
    const {userId} = request.body
    const id = await adminAccess(userId)
    const transactionTypes = ["Maintenance", "PropertyTax", "ManagementFee", "Insurance", "Utilities"];;

   const result =  await Transaction.aggregate([
      {
        $match: {
          admin: id,
          paymentType:'debit'
        }
      },
      {
        $group: {
          _id: "$type",
          totalAmount: {      
            $sum: "$amount"
          }
        }
      },
      {
        $sort: {
          totalAmount: -1
        }
      }
    ])

    const totalsByType = transactionTypes.reduce((acc, type) => {
      const found = result.find(r => r._id === type);
      acc[type] = found ? found.totalAmount : 0; // If not found, default to 0
      return acc;
    }, {});

    return response.status(200).json({result:true, data:totalsByType})

  }
  catch(error)
  {
    return response.status(500).json({result:false}) 

  }
}

module.exports = {monthlyRevenue, getInvoice,getReceipt, getReminder, getOccupancyImpact, paymentTrend, getIncome, expenseBreakdown }