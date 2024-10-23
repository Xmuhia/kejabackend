const mongoose = require('mongoose');
const {Transaction} = require("../../Schema/transactionSchema");
const { adminAccess } = require('../AccountManagement/AdminController');
const { getMonthlyData } = require('./TenantController');




//Get monthly return
const Getmonthly = async(request, response)=>{
    try{
    const {userId} = request.body
    const year = new Date().getFullYear(); // Gets the current year
    const id = await adminAccess(userId)

    const result  = await Transaction.aggregate([
        {
            $match: {
              $and: [
                { admin: id },         // Match where admin is userId
                { paymentType: "credit" },              // Match type "rent"
                {
                  createdAt: {
                    $gte: new Date(`${year}-01-01`),  // Start of the year
                    $lte: new Date(`${year}-12-31`)   // End of the year
                  }
                }
              ]
            }
          },
    {
        $group: {
          _id: { $month: "$createdAt" },  // Group by month (1=January, 12=December)
          totalAmount: { $sum: "$amount" }  // Sum the amount field
    }
    },
    {
        $sort: { "_id": 1 } 
    }
    ])
    // Prepare an array of 12 elements (one for each month) initialized with 0
    const monthlyTotals = Array(12).fill(0);

    // Fill the monthlyTotals array with the result from the aggregation
    result.forEach(item => {
                 monthlyTotals[item._id - 1] = item.totalAmount;  // _id is the month number (1 for January, 12 for December)
            });


    const {monthlyOccupants, monthlyUnits} = await getMonthlyData(id)

    const results = monthlyOccupants.map((occupants, index) => {
      const units = monthlyUnits[index] || 0; // Fallback to 0 if units are not available
      const occupancyRate = units > 0 ? (occupants / units) * 100 : 0; 
      return Math.round(occupancyRate);
    });

    console.log(results)

    response.status(200).json({rentalIncome:monthlyTotals, occupancyRates:results});
    }
    catch(error)
    {
    response.status(500).json({ error: "Something went wrong" });
    }

}

module.exports = {Getmonthly}