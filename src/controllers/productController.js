const productModel = require("../models/productModel");
const { uploadFile } = require("../aws/awsConfiq");
const isValid = require("../validation/validators");

//============================================== createProduct =============================================//
let createProduct = async(req, res)=>{

  try {  

    let requestBody = req.body
    let { title,  description,  price,currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments} = requestBody

    if (!isValid.isValidRequestBody(requestBody)) {
      return res.status(400).send({ status: false, message: "Please provide data in request body" });
    }
   
    if (!title) {
      return res.status(400).send({ status: false, message: "Title is required!" });
    }
    if (!isValid.isValidTitle(title)) { 
      return res.status(400).send({ status: false, message: "Title is invalid!" }); 
    }

    let uniqueTitle = await productModel.findOne({ title: title });
    if (uniqueTitle)
      return res.status(400).send({ status: false, message: "This title already exists, please enter another title.", });

    if (!description)
      return res.status(400).send({ status: false, message: "Description is required!" });

    if (!isValid.valid(description)) {
      return res.status(400).send({ status: false, msg: "descritions is invalid!" });
    }
 
    if (!price) {
      return res.status(400).send({ status: false, message: "Price is required!" });
    }
    if (!isValid.isValidPrice(price)) {
      return res.status(400).send({ status: false, msg: "Price is invalid!" });
    }
  
    if (!currencyId) {
      return res.status(400).send({ status: false, message: "Currency Id is required!" });
    }
    if (currencyId != "INR") {
      return res.status(400).send({ status: false, msg: "Please provide the currencyId as `INR`!" });
    }
    if (!currencyFormat)
      return res.status(400).send({ status: false, message: "Currency Format is required!" });

    if (currencyFormat != "₹")
      return res.status(400).send({ status: false, message: "Please provide the currencyformat as `₹`!" });

    if (isFreeShipping) {
      if (!(isFreeShipping == "true")) { return res.status(400).send({ status: false, message: "isFreeShipping should either be True, or False." }) }
    }

   
    let files = req.files; //aws

    if (files && files.length > 0) {
      if (!isValid.isValidFile(files[0].originalname))
        return res.status(400).send({ status: false, message: `Enter format jpeg/jpg/png only.` })

      let uploadedFileURL = await uploadFile(files[0]);

      requestBody.productImage = uploadedFileURL;
    } else {
      return res.status(400).send({ message: "Files are required!" });
    }
  
    if (style) {
      if (!isValid.valid(style)) {
        return res.status(400).send({ status: false, msg: "Style is invalid" });
      }
    }
    if (availableSizes) {
      availableSizes = availableSizes.split(",").map((x) => x.trim());
      requestBody.availableSizes = availableSizes;

      if (!isValid.isValidAvailableSizes(availableSizes))
        return res.status(400).send({ status: false, message: "availableSizes is required or put valid sizes" })
    }
    if (installments) {
      if (!isValid.isValidNumbers(installments)) {
        return res.status(400).send({ status: false, message: "Installments' is invalid" });
      }
    }
          let productCreate = await productModel.create(requestBody)
          return res.status(201).send({ status: true, message: "success", data: productCreate })
      }
      catch (error) {
          return res.status(500).send({ status: false, message: error.message })
      }
    
}
  

//=========================Get Product ========================================

const getProduct = async function (req, res) {
  try {
      let { size, name, priceGreaterThan, priceLessThan, priceSort } = req.query;

      const obj = { isDeleted: false };
      if (size) {
          obj["availableSizes"] = size
      }

      if (name) {
          if (!isValid.isValidName(name)) return res.status(400).send({ stastus: false, message: "Invali name format!" });

          obj["title"] = name
      }

      if (priceGreaterThan) {
          obj["price"] = { $gt: priceGreaterThan }
      }

      if (priceLessThan) {
          obj["price"] = { $lt: priceLessThan }
      }

      if (priceGreaterThan && priceLessThan) {

          if (priceGreaterThan == priceLessThan) return res.status(400).send({ status: false, message: "priceGreaterThan and priceLessThan can't be equal" });

          obj["price"] = { $gt: priceGreaterThan, $lt: priceLessThan }
      }

      if (priceSort) {
          if (priceSort == 1) {
              let find = await productModel.find(obj).sort({ price: 1 });
              if (!find) {
                  return res.status(400).send({ status: false, message: "No data found that matches your search" })
              }
              return res.status(200).send({ status: true, message: "Success", data: find });
          }
          if (priceSort == -1) {
              let find2 = await productModel.find(obj).sort({ price: -1 });
              if (!find2) {
                  return res.status(404).send({ status: false,message: "No data found that matches your search1" });
              }
              return res.status(200).send({ status: true, message: "Success", data: find2 });
          }
      }

      const finaldata = await productModel.find(obj);

      if (!finaldata || finaldata.length == 0) {
          return res.status(404).send({status: false,message: "No data found" })
      }
      return res.status(200).send({ status: true, message: "fetching product details Successfully", data: finaldata });
  } catch (error) {
      res.status(500).send({ message: error.message });
  }
};

//============================= Get Products By Id ================================
const getProductsById = async function (req, res) {
  try {
      const productId = req.params.productId
  if(!productId){
    return res.status(400).send({status:false,message:"pls provide productId"})
  }
      if (!isValid.validId(productId)) {
          return res.status(400).send({ status: false, message: `${productId} is not a valid product id` })
      }
      

      const product = await productModel.findOne({ _id: productId, isDeleted: false });

      if (!product) {
          return res.status(404).send({ status: false, message: `product does not exists` })
      }

      return res.status(200).send({ status: true, message: 'Product fetch successfully', data: product })
  } catch (err) {
      return res.status(500).send({ status: false, message: err.message })
  }
}

//======================== Update Product ==================================

const updateProduct = async function (req, res) {
  try {

      const productId = req.params.productId;
      if(!productId){
        return res.status(400).send({status:false,msg:"pls provide product id for updation"})
      }
      if (!isValid.validId(productId)) {
        return res.status(400).send({ status: false, message: "Product id is invalid!!" })
      }
    
      const checkAvailabiilty= await productModel.findById(productId)

      if (!(checkAvailabiilty||checkAvailabiilty.isDeleted == true)) {
        return res.status(404).send({ status: false, message: "product doest not exists." })
      }
      
      const data = req.body;
      const { title, description, price, productImages,isFreeShipping, style, availableSizes, installments } = data;

      const updateProduct = {};

      if (title) {
          if (!isValid.isValidTitle(title)) {
              return res.status(400).send({ status: false, message: "Title to be updated is invalid." })}

          const checkTitle = await productModel.findOne({title:title})
         
          if(checkTitle) return res.status(400).send({status:false,message:"Title is already registerd."})
     
          updateProduct.title = title
      }

      if (description) {
          if (!isValid.valid(description)) {
              return res.status(400).send({ status: false, message: "description to be updated is invalid." })}

              updateProduct.description = description
      }

      if (price) {
          if (!isValid.isValidPrice(price)) {
              return res.status(400).send({ status: false, message: "price to be updated is invalid." })}

              updateProduct.price = price
      }

      if (isFreeShipping) {
          if (!(isFreeShipping=="true" )) {
              return res.status(400).send({ status: false, message: "isFreeshipping can only be true or false." })}

              updateProduct.isFreeShipping = isFreeShipping
      }

      if (style) {
          if (!isValid.valid(style)) {
              return res.status(400).send({ status: false, message: "style to be updated is invalid." })}

              updateProduct.style = style
      }

      if (availableSizes) {
          if (!isValid.isValidAvailableSizes(availableSizes)) {
              return res.status(400).send({ status: false, message: "availableSizes can only be [S, XS, M, X, L, XXL, XL] "})}

              updateProduct.availableSizes = availableSizes
      }
    
      if (installments) {
          if (!isValid.isValidNumbers(installments)) {
              return res.status(400).send({ status: false, message: "installments to be updated is invalid." })}

              updateProduct.installments = installments
      }
      if(productImages){
    let files = req.files; //aws

    if (files && files.length > 0) {
      if (!isValid.isValidFile(files[0].originalname))
        return res.status(400).send({ status: false, message: `Enter format jpeg/jpg/png only.` })

      let uploadedFileURL = await uploadFile(files[0]);

      updateProduct.productImage = uploadedFileURL;
    } else {
      return res.status(400).send({ message: "Files are required!" });
    }
    
  }
      let updateData = await productModel.findOneAndUpdate({_id:productId} , updateProduct, {new:true})

      return res.status(200).send({status:false,message:"Success" , data:updateData})

  } catch (error) {
      return res.status(500).send({ status: false, message: error.message })
  }
}

//====================================== Delete Product ==============================

const deleteProduct = async function(req,res){
  try{
 
      let productId = req.params.productId;
 
      if(!productId) return res.status(400).send({status:false,message:" Please Provide productId."})
 
      if(!isValid.isIdValid(productId)) return res.status(400).send({status:false , message:"invalid product Id."});
 
      let check = await productModel.findById(productId);
 
      if(!check) return res.status(404).send({status:false,message:"No data found."});
 
      if(check.isDeleted==true) return res.status(400).send({status:false,message:"Product is already deleted."});
 
      const deleted = await productModel.findByIdAndUpdate({_id:productId},{$set:{isDeleted:true,deletedAt:Date.now()}}, { new: true })
 
      return res.status(200).send({status:true,message:"Success." })
 
     }catch(error){
         return res.status(500).send({status:false,message:error.message})
     }
 }


module.exports={createProduct,getProduct,getProductsById,updateProduct,deleteProduct}
 