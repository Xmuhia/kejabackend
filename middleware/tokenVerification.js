const jwt = require('jsonwebtoken')
const {User} = require('../Schema/userSchema') 

const tokenVerification = async (request, response, next)=>{
try{
    const token = request.headers["auth-token"]
    
    //check if token
    if(!token)
    {
        return response.status(403).json({result:false, message: 'Please login', login:false})
    }

    
    //verify token
    const tokenobject = jwt.verify(token, process.env.JWT)
    const id = tokenobject.id
   
    //find user
    const getUser = await User.findOne({_id:id})
    if(!getUser)
        {
            return response.status(403).json({result:false, message:  "User doesnt exist", redirect:true})
        }
    if(getUser?.role == "none")
    {
        return response.status(403).json({result:false, message:  'Route not allowed', redirect:true})
    }
   
    request.body.userId = tokenobject.id
    return next()
    }
catch(error)
    {
        return response.status(400).json({result:false, message: 'Please login', login:false})
    }
}

module.exports = tokenVerification;