const { User } = require("../../Schema/userSchema");
const mongoose = require('mongoose');


const adminAccess = async (userId)=>{
try{
    const adminid = await User.findById({_id:userId}).select('admin')
    let id;
    if(adminid && adminid.admin)
    {
      id = new mongoose.Types.ObjectId(adminid.admin)
    }
    else{
      id = new mongoose.Types.ObjectId(userId)
    }

    return id
}
catch(error)
{console.log(error)}
}

const getadmin =  async(request, response) =>{
try{
  const {userId} = request.body
  const data =  await User.findOne({_id:userId}).select('coAdmin').populate({
    path: 'coAdmin',
    model: 'Users',
    select: 'name _id email role profile_image phone verified'
  });
  

  return response.status(200).json({result:true,data:data?.coAdmin})


}
catch(error)
{
  return response.status(500).json({result:false})
}
}

module.exports = {adminAccess, getadmin}