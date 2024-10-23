const sendSms =  require('../../SMS/Sms')
const sendEmail = require('../../Email/Email')
const { Reminder } = require('../../Schema/remainderSchema')
const { adminAccess } = require('../AccountManagement/AdminController')



//create Reminder
const createReminder = async(data,type,message) =>{
        const remainder = data.payment
        const existingReminder = await Reminder.findOne({
            tenantId:remainder.tenantId,
            propertyId:remainder.propertyId,
            unitNumber:remainder.unitNumber,
            amount:remainder.amount,
            type:type,
            propertyName:remainder.propertyName,
            tenantName:remainder.tenantName,
            dueDate:remainder.leaseEndDate,
            email:remainder.email,
            admin: data.userId ,   
            status:'Sent',
            message:message
        });
        
        if (existingReminder) {
            return
        }

        const result = await Reminder.create({
            tenantId:remainder.tenantId,
            propertyId:remainder.propertyId,
            unitNumber:remainder.unitNumber,
            amount:remainder.amount,
            type:type,
            propertyName:remainder.propertyName,
            tenantName:remainder.tenantName,
            dueDate:remainder.leaseEndDate,
            email:remainder.email,
            admin:data.userId,
            status:'Sent',
            message:message
        })

        await result.save()

}


//send remainder
const sendReminder = async(request, response) =>{

try{
    const {options,payment,userId} = request.body
    const id = await adminAccess(userId)
    let message ;
    if(options.message == '')
    {
        message = 'Rent reminder from keja'
    }
    else{
        message = options.message
    }
    const phone = payment.phone
    const email = payment.email
    const data ={
        options,
        payment,
        userId:id
    }
    if(options.method === 'both' || options.method === 'sms')
    {
         sendSms({message, phone})
         
    }
    
    if(options.method === 'both' || options.method === 'email')
    {
        let emailContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Hello,</p>
        <b>${message}</b>
        <br>
        <p>Keja Team</p>
        </div>
        `;
        sendEmail({userEmail: email,emailTitle:"Keja Reminder", emailContent}) 

    }

    //create reminder
    await createReminder(data, 'Rent', message)
    
    return response.status(200).json({result:true, message:'Remainder added, Reminder sent'})
}
catch(error)
{
console.log(error)
}
}




module.exports = {sendReminder}