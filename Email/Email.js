const nodemailer = require("nodemailer")
require('dotenv').config()
//gmail auth
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      // TODO: replace `user` and `pass` values from <https://forwardemail.net>
      user: process.env.USEREMAIL,
      pass: process.env.PASS,
    },
  });

//email for signup verification
const  sendEmail = async({userEmail, emailTitle, emailContent,filename,file})=> {
        try{
            if(file)
            {
            await transporter.sendMail({
                from: '"KEJA" <foo@example.com>',
                to:userEmail,
                subject:emailTitle,
                text: "",
                html: emailContent,
                attachments: [{
                    filename: filename,
                    content: file.buffer,
                    contentType: file.mimetype,
                }]
            })}
            else{
            await transporter.sendMail({
                from: '"KEJA" <foo@example.com>',
                to:userEmail,
                subject:emailTitle,
                text: "",
                html: emailContent,
            })
            }

            return true
        }
        catch(error)
        {
            console.log(error)
            return false
        }
    }


module.exports = sendEmail