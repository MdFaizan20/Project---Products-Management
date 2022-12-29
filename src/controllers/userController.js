const bcrypt = require('bcrypt')
const userModel = require("../models/userModel")
const isValid = require("../validation/validators")

const aws = require("../aws/awsConfiq")
const jwt = require("jsonwebtoken")




///================================create user api=============================//
const createUser = async function (req, res) {
    try {
        let data = req.body;

        const { fname, lname, email,profileImage, phone, password, address } = data;

        if (!isValid.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please provide data in the request body!", })
        }

        if (!fname) {
            return res.status(400).send({ status: false, message: "First Name is required!" });
        }
        if (!isValid.isValidName(fname)) {
            return res.status(400).send({ status: false, message: "invalid First Name " })
        }

        if (!lname) {
            return res.status(400).send({ status: false, message: "Last Name is required!" })
        }
        if (!isValid.isValidName(lname)) {
            return res.status(400).send({ status: false, message: "invalid Last Name " })
        }

        if (!email) {
            return res.status(400).send({ status: false, message: "Email is required!" });
        }
        if (!isValid.isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Invalid email id" })

        }
        let userEmail = await userModel.findOne({ email: email });
        if (userEmail)
            return res.status(401).send({ status: false, message: "This email address already exists, please enter a unique email address!" });

        if (!phone) {
            return res.status(400).send({ status: false, message: "Phone number is required!" });
        }
        if (!isValid.validatePhone(phone)) {
            return res.status(400).send({ status: false, message: "pls provide correct phone " })
        }
        let userNumber = await userModel.findOne({ phone: phone });
        if (userNumber)
            return res.status(409).send({ status: false, message: "This phone number already exists, please enter a unique phone number!" });

        if (!password) {
            return res.status(400).send({ status: false, message: "Password is required!" });
        }
        if (!isValid.isValidPassword(password)) {
            return res.status(400).send({ status: false, message: " pls provide password" })
        }
            
        
        const protect = await bcrypt.hash(password, 10)
       data.password = protect

       if(!address|| !isValid.valid(address) ){   
        return res.status(400).send({status: false , message:"address is mandatory"})
      }
      data.address = JSON.parse(data.address)
      let { shipping, billing } = data.address


      if (!shipping) return res.status(400).send({ status: false, message: "Enter Shipping Address." })
      if (!shipping.street) return res.status(400).send({ status: false, message: "Enter Shipping street Address." })

      if (!isValid.valid(shipping.street)) { return res.status(400).send({ status: false, message: 'Please enter Shipping street' }) }

      if (!isValid.valid(shipping.city)) { return res.status(400).send({ status: false, message: 'Please enter Shipping city' }) }
      if (!isValid.isValidName(shipping.city)) { return res.status(400).send({ status: false, message: 'Invalid Shipping city' }) }

      if (!isValid.valid(shipping.pincode)) { return res.status(400).send({ status: false, message: 'Please enter Shipping pin' }) }
      if (!isValid.validPin(shipping.pincode)) { return res.status(400).send({ status: false, message: 'Invalid Shipping Pin Code.' }) }

      if (!billing) return res.status(400).send({ status: false, message: "Enter Billing Address." })

      if (!isValid.valid(billing.street)) { return res.status(400).send({ status: false, message: 'Please enter billing street' }) }

      if (!isValid.valid(billing.city)) { return res.status(400).send({ status: false, message: 'Please enter billing city' }) }
      if (!isValid.isValidName(billing.city)) { return res.status(400).send({ status: false, message: 'Invalid billing city' }) }

      if (!isValid.valid(billing.pincode)) { return res.status(400).send({ status: false, message: 'Please enter billing pin' }) }
      if (!isValid.validPin(billing.pincode)) { return res.status(400).send({ status: false, message: 'Invalid billing Pin Code.' }) }

        let files = req.files; //aws
        if (files && files.length > 0) {
          if (!isValid.isValidFile(files[0].originalname))
            return res
              .status(400)
              .send({ status: false, message: `Enter format jpeg/jpg/png only.` });
    
          let uploadedFileURL = await aws.uploadFile(files[0]);
    
          data.profileImage = uploadedFileURL;
        } else {
          return res.status(400).send({ message: "Files are required!" });
        }

        const userDetails = await userModel.create(data);
        return res.status(201).send({ status: true, message: "user successfully created", data: userDetails })
    }

    catch (error) {
        return res.status(500).send({ message: error.message });
    }
}
//================================login user api ======================//


const userLogin = async function (req, res) {
    try {
        let email = req.body.email;
        let password = req.body.password

        if (!isValid.isValidRequestBody(req.body)) {
            return res.status(400).send({ status: false, message: "Please provide credentials in the request body!", })
        }
      
        if (!email) {
            return res.status(400).send({ status: false, message: "Email is required!" });
        }
        if (!isValid.isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Invalid email id" })

        }
        if (!password) {
            return res.status(400).send({ status: false, message: "Password is required!" });
        }
        if (!isValid.isValidPassword(password)) {
            return res.status(400).send({ status: false, message: " pls provide valid password" })
        }
        let checkCredential = await userModel.findOne({ email:email });
        if (!checkCredential) {
            return res.status(400).send({ status: false, massage: "Invalid Credential" })

        }  
              let hash= checkCredential.password
              
  let bcryptpwd= await bcrypt.compare(password,hash)                  
  
   if(!bcryptpwd){
    return res.status(400).send({status:false,message:"please put correct password "})
}
   

    let token= jwt.sign({userId:checkCredential._id},"Project5",{expiresIn:"10h"})
   let obj= {userId:checkCredential["_id"],token}
        return res.status(200).send({ status: true, msg: " User login successfull", data: obj})
    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message})
    }
}

 




//====================get user api==============================//


const getUser = async function (req, res) {
    try {
        let userId = req.params.userId

        
        if (!userId) {
            res.status(400).send({ status: false, message: "Please provide userId!" })
        }
        if (!isValid.isIdValid(userId)) {
            return res.status(400).send({ status: false, msg: "please  provide valid user ID" })
        }

        const data = await userModel.findById({ _id: userId })
        return res.status(200).send({ status: true, message: "User profile details", data: data })
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

//===================================== Update User Details =============================

const updateUser = async function (req, res) {

    try {

        let data = req.body
        let files = req.files
        let userId = req.params.userId

        let { fname, lname, email, phone, password, address, ...rest } = data

        //--------------- Checking Mandotory Field --------------------//
        if (!(isValid.isValidRequestBody(data)) && !(files)) return res.status(400).send({ status: false, message: "Atleast select one field Update from the list: (fname or lname or email or profileImage or phone or password or address)" });
        


        let obj = {}

        //---------------------- Validations -----------------//
        if (fname || fname == '') {
            if (!isValid.valid(fname)) return res.status(400).send({ status: false, message: 'Please provide input for fname' })
            if (!isValid.isValidName(fname)) return res.status(400).send({ status: false, message: 'fname should be in Alphabets' })
            obj.fname = fname
        }
        if (lname || lname == '') {
            if (!isValid.valid(lname)) return res.status(400).send({ status: false, message: 'Please provide input for lname' })
            if (!isValid.isValidName(lname)) { return res.status(400).send({ status: false, message: 'lname should be in Alphabets' })}
            obj.lname = lname
        }
        if (email || email == '') {
            if (!isValid.valid(email)) return res.status(400).send({ status: false, message: 'Please provide input for email' })
            if (!isValid.isValidEmail(email)) { return res.status(400).send({ status: false, message: 'Please enter valid emailId' }) }
            obj.email = email
        }
        if (phone || phone == '') {
            if (!isValid.valid(phone)) return res.status(400).send({ status: false, message: 'Please provide input for phone' })
            if (!isValid.validatePhone(phone)) { return res.status(400).send({ status: false, message: 'Please enter valid Mobile Number' }) }
            obj.phone = phone
        }
        if (password || password== '') {
            if (!isValid.valid(password)) return res.status(400).send({ status: false, message: 'Please provide input password' })
            if (!isValid.isValidPassword(password)) { return res.status(400).send({ status: false, message: "password must contain minimum 8 character and max 15 character and one number, one uppar alphabet, one lower alphabet and one special character" }) }
            obj.password = await bcrypt.hash(password, 10)
        }


        //----------------------- Checking the File is present or not and Creating S3 Link ----------------------//
        if (files && files.length > 0) {
            if (files.length > 1) return res.status(400).send({ status: false, message: "You can't enter more than one file for Update!" })
            if (!isValid.isValidFile(files[0]['originalname'])) { return res.status(400).send({ status: false, message: "You have to put only Image." }) }
            let uploadedURL = await uploadFile(files[0])
            obj.profileImage = uploadedURL
        }

        //----------------- Validation of Shipping Address ------------------//
    
        if (address || address=='') {
            if (!isValid.valid(address)) return res.status(400).send({ status: false, message: 'Please provide input for address' })
            obj.address = JSON.parse(address)
            let { shipping, billing } = address

            if (shipping) {
                if (shipping.street) { obj['address.shipping.street'] = shipping.street }
                if (shipping.city) {
                    if (!isValid.isValidName(shipping.city)) { return res.status(400).send({ status: false, message: 'Invalid Shipping city' }) }
                    obj['address.shipping.city'] = shipping.city
                }
                if (shipping.pincode) {
                    if (!isValid.validPin(shipping.pincode)) { return res.status(400).send({ status: false, message: 'Invalid Shipping Pin Code.' }) }
                    obj['address.shipping.pincode'] = shipping.pincode
                }
            }

            //--------------------- Validation of Billing Address ----------------------//
            if (billing) {
                if (billing.street) { obj['address.billing.street'] = billing.street }
                if (billing.city) {
                    if (!validator.isValidName(billing.city)) { return res.status(400).send({ status: false, message: 'Invalid Shipping city' }) }
                    obj['address.billing.city'] = billing.city
                }
                if (billing.pincode) {
                    if (!validator.validPin(billing.pincode)) { return res.status(400).send({ status: false, message: 'Invalid Shipping Pin Code.' }) }
                    obj['address.billing.pincode'] = billing.pincode
                }
            }
        }

        let updateUserDetails = await userModel.findOneAndUpdate({ _id: userId }, { $set: obj }, { new: true })

        if (!updateUserDetails) { return res.status(200).send({ status: true, message: "User not exist with this UserId." }) }


        return res.status(200).send({ status: true, message: "User profile has been updated", data: updateUserDetails })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}


module.exports = { createUser, userLogin, getUser, updateUser }



