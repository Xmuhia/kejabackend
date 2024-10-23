const {User} = require("../../Schema/userSchema")
const bcrypt = require("bcrypt")
const JWT = require("jsonwebtoken")
const verifyEmail = require("../../Email/signupEmail")
const {registrationSchema,loginSchema, SignupSchema} = require("../ValidationSchema/Schema")



//SignUp Function
const signUp = async(request, response)=>{
try{
    await registrationSchema.validate(request.body); 
    const {name,email,role, userId} = request.body
    const Cap_email = email.toUpperCase()

    const user = await User.findById(userId).select('coAdmin');
    if(!user)
    {
        return response.status(200).json({result:false, message:`Account Doesn't exist`})
    }
    if (user.coAdmin.length >= 2)
    {
        return response.status(200).json({result:false, message:`Co-Admin can't  be more than two`})
    }

    const emailExist = await User.findOne({ email: Cap_email }).select('_id');
    if(emailExist.role == "tenant")
    {
        return response.status(200).json({result:false, message:`User is a tenant, Use another email`})
    }

    if(emailExist.role == "superadmin")
        {
            return response.status(200).json({result:false, message:`User is a superadmin, Use another email`})
        }

    if(emailExist)
    {
        if (!user.coAdmin.includes(emailExist._id)) {
        user.coAdmin.push(emailExist._id);

        await user.save();
        emailExist.admin = userId
        await emailExist.save()
        return response.status(200).json({result:true, message: "Admin created"})
        }
        else{
            return response.status(200).json({result:false, message: "Admin already created"})
        }
    }

    const newUser = await User.create({
        name,
        email:Cap_email,
        role,
        admin:userId
    })

    await newUser.save();
    const newId = newUser._id
    user.coAdmin.push(newId);
    await user.save();

    //email token creation
    const emailtoken = JWT.sign({Cap_email}, process.env.EMAIL_TOKEN, {expiresIn: '1h'})


    //email comtent
    let emailContent = `
    <div style="font-family: Arial, sans-serif; color: #333;">
    <p>Hello, ${role}</p>
    <b>Please verify your Keja account by clicking the button below</b>
    <br/><br/>
    <a href="https://gitkeja.vercel.app/auth/password/${emailtoken}" 
       style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
       Activate email
    </a>
    <br/>
    <p style="color: #ff0000;"><b>Note:</b> This link is only valid for one hour.</p>
    <p>Best regards,<br/>Keja Team</p>
    </div>
`;

//email title
const emailTitle = "Verify Keja Account"
    //send activation link
    verifyEmail({
        userEmail:Cap_email,
        emailContent,
        emailTitle
    })

    return response.status(200).json({
        result: true,
        message: "Activation link sent to your email "
    })
}
catch(error){
    return response.status(400).json({result:false, message:`${error}`})
}
}


const Register = async(request, response)=>{
    try{
        await SignupSchema.validate(request.body); 
        const {name,email,password} = request.body
        const Cap_email = email.toUpperCase()
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(password, salt);
        const emailExist = await User.findOne({ email: Cap_email })
        if(emailExist)
        {
            return response.status(200).json({
                result: false,
                message: "User Already Exist "
            })
        }
    
        const newUser = await User.create({
            name,
            email:Cap_email,
            role:'superadmin',
            password:hash
        })
    
        await newUser.save();
        
        //email token creation
        const emailtoken = JWT.sign({Cap_email}, process.env.EMAIL_TOKEN, {expiresIn: '1h'})
    
    
        //email comtent
        let emailContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Hello, ${name}</p>
        <b>Welcome to KejaPlus</b>
        <br/>
        <p>Best regards,<br/>Keja Team</p>
        </div>
    `;
    
    //email title
    const emailTitle = "Verify Keja Account"
        //send activation link
        verifyEmail({
            userEmail:Cap_email,
            emailContent,
            emailTitle
        })
    
        return response.status(200).json({
            result: true,
            message: "Account Created "
        })
    }
    catch(error){
        return response.status(404).json({result:false, message:`${error}`})
    }
    }

//user login function
const logIn = async (request, response)=>{
try{
    await loginSchema.validate(request.body);

    const {email, password} = request.body
    const Cap_email = email.toUpperCase()

    //confirm email exist
    const comfirmEmail = await User.findOne({email: Cap_email})

    if(comfirmEmail == null)
    {
        return response.status(200).json({
            result:false,
            message: "Email not found"
        })
    }

    //comfirm password 
    const passwordCheck = await bcrypt.compare(password, comfirmEmail.password)

    if(passwordCheck)
    {
        const id = comfirmEmail._id

        //create jwt_token for route verification
        const token = JWT.sign({id}, process.env.JWT, {expiresIn: '30d'})
        const Data = {
            name:comfirmEmail.name,
            email:comfirmEmail.email,
            _id:comfirmEmail._id,
        }


        return response.status(200).json({
            result:true,
            token,
            userDate:Data
        })
    }
    else{
        return response.status(200).json({result:false, message:"Incorrect password"})
    }
}
catch(error){
    return response.status(400).json({result:false, message:`${error}`})
}
}

const passwordCreation = async(request,response)=>{
    try{
        const { password, token} = request.body

        const email = JWT.verify(token, process.env.EMAIL_TOKEN)

        const userCheck = await User.findOne({ email: email.Cap_email });
        // Check if email is already verified

        if(userCheck == null)
            {
                return response.status(200).json({
                    result:false,
                    message: "Email not found"
                })
            }

        if(userCheck?.verified)
        {
            return response.status(200).json({result:false, message:`Email already verified`})
        }

        await User.findOneAndUpdate({email:verifyEmail.Cap_email},{
            $set:{
                verified:true
            }
        })

        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(password, salt);

        userCheck.password = hash
        await userCheck.save(); 
        return response.status(200).json({
            result: true,
            message: "Password updated successfully"
        });
    }
    catch(error)
    {
        return response.status(500).json({
            result: false,
            message: "An error occurred",
            error: error.message
        });
    }
}
//activate email
const emailActivation = async(request, response)=>{
    try{
    const token = request.body.token

    //Comfirm token
    const verifyEmail = JWT.verify(token, process.env.EMAIL_TOKEN)

    const userCheck = await User.findOne({ email: verifyEmail.Cap_email });
    // Check if email is already verified
    if(userCheck.verified)
    {
        return response.status(200).json({result:false, message:`Email already verified`})
    }

    //Verify user
    const updateResult = await User.findOneAndUpdate({email:verifyEmail.Cap_email},{
        $set:{
            verified:true
        }
    })

    if(updateResult)
    {
    return response.status(200).json({result:true, message:`Email verified`})
    } else {
        return response.status(404).json({ result: false, message: "User not found" });
    }

    }
    catch(error)
    {
        return response.status(400).json({result:false, message:`Authentication Error`})
    }
}

const userData = async (request, response) =>{
try{
    const id = request.body.userId

    //get user details
    const data = await User.findOne({_id: id},{password:0})
    if(!data){
        return response.status(400).json({result:false, message:'User not found'})
    }

    return response.status(200).json({result:true, message:"user Details", userDetails:data})
}
catch(error)
{
    return response.status(500).json({result:false, message:`Error when getting user details`})

}

}
module.exports = {
    signUp,
    logIn,
    emailActivation,
    userData,
    passwordCreation,
    Register
}