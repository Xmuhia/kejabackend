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
const  verifyEmail = async({userEmail, emailTitle, emailContent})=> {


        try{

            await transporter.sendMail({
                from: '"KEJA" <foo@example.com>',
                to:userEmail,
                subject:emailTitle,
                text: "",
                html: emailContent
            })
        }
        catch(error)
        {
            console.log(error)
        }
    }


module.exports = verifyEmail