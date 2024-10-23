const jwt = require('jsonwebtoken')

const  verifyRole = async (request, response, next)=>{
try{
    const token = request.headers["auth-token"]

    //check if token
    if(!token)
    {
        return response.status(400).json({result:false, message: 'Please login', login:false})
    }

    
    //verify token
    const tokenobject = jwt.verify(token, process.env.JWT)
    request.body.userId = tokenobject.id
    return next()
    }
catch(error)
    {
        return response.status(400).json({result:false, message: 'Please login', login:false})
    }
}

module.exports = verifyRole;