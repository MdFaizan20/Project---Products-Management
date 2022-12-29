const mongoose=require("mongoose")


const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const validId= mongoose.isValidObjectId


const isValidTitle = function (value) {
    if (/^[a-z0-9 ,.#@*&%$-]+$/i.test(value)) return true;
    return false;
  };

  const isValidPrice = (value) => {
    const regEx =/^[1-9]\d{0,8}(?:\.\d{1,2})?$/
    const result = regEx.test(value)
    return result
  };
const isValidName = (value) => {
    const regex =/^[a-zA-Z ]+(([',. -][a-zA-Z ])?[a-zA-Z ])$/.test(value)
    return regex
}
const isValidStatus = function(status) {
  return ['pending', 'completed', 'cancelled'].indexOf(status) !== -1
}

function isValidAddress(x) {

    const regEx = /^\s*(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,100}\s*$/
    return regEx.test(x);
}

const validatePhone = function (phone) {
    var re = /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/;
    if (typeof (phone) == 'string') {
        return re.test(phone.trim())
    } else {
        return re.test(phone)
    }
};

const isValidEmail = (email) => {
    const regex = /^([a-zA-Z0-9_.]+@[a-z]+\.[a-z]{2,3})?$/.test(email)
    return regex
}
const isValidPassword = function (password) {
    const passwordRegex =/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,15}$/
    return passwordRegex.test(password);
  };


const isValidFile = (img) => {
  const regex = /(\/*\.(?:png|gif|webp|jpeg|jpg))/.test(img)
  return regex
}


const validPin = function(pincode){
    let re =/^[0-9]{6,6}$/
    return re.test(pincode)
}
const isValidStreet = function(street){
    let re = /^[a-zA-Z ]+(([',. -][a-zA-Z ])?[a-zA-Z ])$/.test(street)

    return re

}

const isIdValid = function (value) {
    return mongoose.Types.ObjectId.isValid(value); 
  };
  const isValidAvailableSizes = (availablesizes) => {
    for( i=0 ;i<availablesizes.length; i++){
      if(!["S", "XS","M","X", "L","XXL", "XL"].includes(availablesizes[i])) return false
    }
    return true
  };
  
  const isValidNumbers = function (value){
    let user = /^[0-9]+$/.test(value)
    return user
  }

  const valid = function(value){
    if(typeof value === "string" && value.trim().length === 0) return false;
    return true 
}
module.exports = {validId,isValidRequestBody,isValidName,isValidTitle,isValidPrice,validatePhone,isValidAddress,isValidEmail,isValidPassword,isValidStatus,isValidFile,validPin,isValidStreet,isIdValid,isValidAvailableSizes,isValidNumbers,valid}
