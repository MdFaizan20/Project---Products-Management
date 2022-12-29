const cartModel= require("../models/cartModel")
const productModel= require("../models/productModel")
const userModel= require("../models/userModel")

const{ valid, validId ,isValidRequestBody}=require("../validation/validators")



const createCart = async function (req, res) {
    try {
      let UserId = req.params.userId;
  
      if (!validId(UserId)) {
        return res.status(400).send({ status: false, message: "please provide valid user Id" });
      }
      let user = await userModel.findOne({ _id: UserId });
      if (!user) {
        return res.status(400).send({status: false,message: "User doesn't exists",
        });
      }
  
      let data = req.body;
  
      if (!isValidRequestBody(data)) {
        return res.status(400).send({ status: false, message: "please provide request body" })}
  
      let { productId, cartId } = data;
  
      if (!validId(productId)) {
        return res.status(400).send({ status: false, message: "please provide valid product Id" })
      }
  
      if (!valid(cartId) || cartId == "") {
        return res.status(400).send({ status: false, message: "cart id cannot be empty" })
      }
  
      let product = await productModel.findOne({ _id: productId });
      if (!product) {
        return res.status(400).send({ status: false, message: "productId doesn't exists" });
      }
  
      if (product.isDeleted == true) {
        return res.status(400).send({ status: false, message: " product is already  Deleted  " })
      }
  
      if (!cartId) {
        let checking = await cartModel.findOne({ userId: UserId });
        if (checking) {
          return res.status(409).send({status: false,message: " Cart already exists,please provide cart Id",});
        }
      }
  
      if (cartId) {
        if (!validId(cartId)) {
          return res.status(400).send({ status: false, message: "please provide valid Cart Id" });
        }
  
        let cart = await cartModel.findOne({ _id: cartId });
        if (!cart) {
          return res.status(400).send({ status: true, message: "Invalid Cart Id" });
        }
        let quantity = 1;
        let arr = cart.items;
  
        let isExist = false;
        for (let i = 0; i < cart.items.length; i++) {
          if (cart.items[i].productId == productId) {
            isExist = true;
            cart.items[i].quantity += quantity;
          }
        }
        if (!isExist) {
          arr.push({ productId: productId, quantity: quantity });
        }
  
        let price = product.price;
        cart.totalPrice += price * quantity;
        cart.totalItems = arr.length;
  
        let update = await cartModel.findOneAndUpdate({ _id: cartId }, cart, {
          new: true});
  
        return res.status(201).send({status: true,message: "Success",data: update});
      }
      if (!cartId) {
        let obj = {};
        obj.userId = UserId;
        obj.items = [{ productId: productId, quantity: 1 }];
        obj.totalPrice = product.price;
        obj.totalItems = obj.items.length;
  
        let dataStored = await cartModel.create(obj);
  
        return res.status(201).send({ status: true, message: "Success", data: dataStored});
      }
    } catch (err) {
      return res.status(500).send({ status: false, message: err.message });
    }
  };
  


  const updateCart = async function (req, res) {
    try {
      let data = req.body;
      let userId = req.params.userId;
  
      if (!valid(userId) || !validId(userId))
        return res.status(400).send({ status: false, message: "Invalid userId" });
  
      let user = await cartModel.findOne({ userId: userId });
      if (!user)
        return res.status(400).send({ status: false, message: "User doesn't exist!" });
  
      let { cartId, productId, removeProduct } = data;
  
      if (!valid(productId) || !validId(productId))
        return res.status(400).send({ status: false, message: "Invalid productId" });
  
      let product = await productModel.findOne({ _id: productId });
      if (!product)
        return res.status(400).send({ status: false, message: "Product doesn't exist!" });
  
    
      if (!valid(cartId) || !validId(cartId))
        return res.status(400).send({ status: false, message: "Invalid cartId" });
  
      let cart = await cartModel.findOne({ _id: cartId });
      if (!cart)
        return res.status(400).send({ status: false, message: "Cart doesn't exist!" });
  
      if (removeProduct) {
        if (![1, 0].includes(removeProduct))
          return res.status(400).send({status: false,message: "Invalid value for removeProduct, it can be only 0 or 1!"});
      }
  
      let items = cart.items.filter( (product) => product["productId"].toString() === productId )
  
      if (items.length == 0)
        return res.status(400).send({status: false,message: `No product  exists in cart`});
  
  
      for (let i = 0; i < items.length; i++) {
        if (items[i].productId == productId) {
          let totalProductprice = items[i].quantity * product.price;
          if (removeProduct === 0) {
            const updateProductItem = await cartModel.findOneAndUpdate(
              { _id: cartId },
              {
                $pull: { items: { productId: productId } },
                totalPrice: cart.totalPrice - totalProductprice,
                totalItems: cart.totalItems - 1,
              },
              { new: true }
            );
            return res.status(200).send({status: true,msg: "Success",data: updateProductItem})
          }
          if (removeProduct === 1) {
            if (items[i].quantity === 1 && removeProduct === 1) {
              const removeCart = await cartModel.findOneAndUpdate(
                { _id: cartId },
                {
                  $pull: { items: { productId: productId } },
                  totalPrice: cart.totalPrice - totalProductprice,
                  totalItems: cart.totalItems - 1,
                },
                { new: true }
              );
              return res.status(200).send({status: true,msg: "Success", data: removeCart });
            }

            items[i].quantity = items[i].quantity - 1;
            const updateCart = await cartModel.findByIdAndUpdate(
              { _id: cartId },
              { items: items, totalPrice: cart.totalPrice - product.price },
              { new: true }
            )
            return res.status(200).send({ status: true,msg: "Success",data: updateCart });
          }
        }
      }
     
    } catch (error) {
      return res.status(500).send({ status: false, error: error.message });
    }
  };


  const getCartDetails = async function (req, res) {
    try {
      let userId = req.params.userId;

  if(!valid(userId)||!validId(userId)){
    return res.status(400).send({status:false,message:"Invalid User Id"})
  }
    
      let findCart = await cartModel.findOne({ userId: userId }).populate("items.productId", { title: 1, price: 1, productImage: 1 })
      if (!findCart){
        return res.status(404).send({ status: false, message: `No cart found with given userId` });
      }
     return res.status(200).send({ status: true, message: "Success", data: findCart });
    } catch (err) {
      res.status(500).send({ status: false, error: err.message });
    }
  };


  const cartDeletion = async function (req, res) {
    try {
      
      const userId = req.params.userId;
      if (!validId(userId)||!valid(userId)) {
        return res.status(400).send({ status: false, msg: "invalid userId" });
      }
  
      const checkUser = await userModel.findOne({ _id: userId });
      if (!checkUser) {
        return res.status(404).send({ status: false, msg: "User doesn't esxist" });
      }
    
      const checkCart = await cartModel.find({ userId: userId });
      if (!checkCart) {
        return res.status(404).send({ sttaus: false, msg: "cart doesn't exist" });
      }
      
      const deleteCart = await cartModel.findOneAndUpdate( { userId: userId },{ $set: { items: [], totalPrice: 0, totalItems: 0 } },{ new: true });
     
      return res.status(204).send({ status: true, message: "cart deleted", data:deleteCart})
   
    } catch (error) {
     
      return res.status(500).send({ status: false, msg: error.message });
    }
  };


  module.exports = {createCart,updateCart,getCartDetails,cartDeletion}

