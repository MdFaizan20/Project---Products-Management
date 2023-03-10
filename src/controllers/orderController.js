const {isValidRequestBody,valid,validId,isValidStatus} = require("../validation/validators");
const userModel = require("../models/userModel");
const cartModel = require("../models/cartModel");
const orderModel = require("../models/orderModel");

//=======================================Order Creation===========================
const orderCreation = async(req, res) => {
  try {
      const userId = req.params.userId;
      const requestBody = req.body;
    

      if (!isValidRequestBody(requestBody)) {
          return res.status(400).send({ status: false, message: "Invalid request body. Please provide the the input to proceed.",
              });
      }
  
      const { cartId, cancellable, status } = requestBody;

      //validating userId
      if (!validId(userId)) {
          return res.status(400).send({ status: false, message: "Invalid userId in params." });
      }

      const searchUser = await userModel.findOne({ _id: userId });
      if (!searchUser) {
          return res.status(400).send({ status: false, message: `user doesn't exists for ${userId}`,
          });
      }
     
      if (!cartId) {
          return res.status(400).send({ status: false, message: `Cart doesn't exists for ${userId}`,
          });
      }
      if (!validId(cartId)) {
          return res.status(400).send({ status: false, message: `Invalid cartId in request body.`,
          });
      }

      //searching cart to match the cart by userId whose is to be ordered.
      const searchCartDetails = await cartModel.findOne({  _id: cartId,  userId: userId,
      });
      if (!searchCartDetails) {
          return res.status(400).send({ status: false, message: `Cart doesn't belongs to ${userId}`,
          });
      }

      //must be a boolean value.
      if (cancellable) {
          if (typeof cancellable != "boolean") { return res.status(400).send({     status: false,message: `Cancellable must be either 'true' or 'false'.`,
              });
          }
      }

      // must be either - pending , completed or cancelled.
      if (status) {
          if (!isValidStatus(status)) {
              return res.status(400).send({ status: false, message: `Status must be among ['pending','completed','cancelled'].`,
              });
          }
      }

      //verifying whether the cart is having any products or not.
      if (!searchCartDetails.items.length) {
          return res.status(202).send({status: false,message: `Order already placed for this cart. Please add some products in cart to make an order.`,
          });
      }

      //adding quantity of every products
      const reducer = (previousValue, currentValue) =>
          previousValue + currentValue;

      let totalQuantity = searchCartDetails.items
          .map((x) => x.quantity)
          .reduce(reducer);

      //object destructuring for response body.
      const orderDetails = {
          userId: userId,
          items: searchCartDetails.items,
          totalPrice: searchCartDetails.totalPrice,
          totalItems: searchCartDetails.totalItems,
          totalQuantity: totalQuantity,
          cancellable,
          status,
      };
      const savedOrder = await orderModel.create(orderDetails);

      //Empty the cart after the successfull order
      await cartModel.findOneAndUpdate({ _id: cartId, userId: userId }, {
          $set: {
              items: [],
              totalPrice: 0,
              totalItems: 0,
          },
      });
      return res
          .status(200)
          .send({ status: true, message: "Order placed.", data: savedOrder });
  } catch (err) {
      return res.status(500).send({ status: false, message: err.message });
  }
};

//====================== Update Order ============================

const updateOrder = async function (req, res) {
    try {
      let userId = req.params.userId;
  
      if (!valid(userId) || !validId(userId))
        return res.status(400).send({ status: false, message: "Invalid userId" });
  
      let data = req.body;
      let { status, orderId } = data;
      if(!isValidRequestBody(data)){
        return res.status(400).send({ status: false, message: "pls provide data for updating order" });
      }
  
      if (!valid(orderId) || !validId(orderId))
        return res.status(400).send({ status: false, message: "Invalid orderId" });
  
      let orderDetails = await orderModel.findOne({ _id: orderId, isDeleted: false });
  
      if (!["pending", "completed", "cancelled"].includes(status)) {
        return res.status(400).send({status: false,message: "status should be from [pending, completed, cancelled]"});
      }
  
      if (orderDetails.status === "completed") {
        return res.status(400).send({status: false,message: "Order completed, now its status can not be updated"});
      }
  
      if (orderDetails.cancellable === false && status == "cancelled") {
        return res.status(400).send({ status: false, message: "Order is not cancellable" });
      } else {
        if (status === "pending") {
          return res.status(400).send({ status: false, message: "order status is already pending" });
        }
  
        let orderStatus = await orderModel.findOneAndUpdate(
          { _id: orderId },
          { $set: { status: status } },
          { new: true }
        );
        return res.status(200).send({ status: true, message: "Success", data: orderStatus});
      }
    } catch (error) {
      res.status(500).send({ status: false, error: error.message });
    }
  };
 

  module.exports={  orderCreation, updateOrder }