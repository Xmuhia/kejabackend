const {User} = require("../../Schema/userSchema")


//choose role

const roleConfiguration = async (request, response)=>{
try{
    const {role, id} = request.body
    //get and update user
    const updateResult = await User.findOneAndUpdate({_id:id},{
        $set:{
            role
        }
    })
    // Check if the update was successful
    if (updateResult) {
        return response.status(200).json({ result: true, message: "Role updated successfully" });
    } else {
        return response.status(404).json({ result: false, message: "User not found" });
    }
}
catch(error)
{
    console.log(error)
}

}
module.exports = {
roleConfiguration
}