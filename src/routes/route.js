const router = require("express").Router()

const  userController = require("../controllers/userController")
const  productController = require("../controllers/productController")
const  cartController = require("../controllers/cartController")
const  orderController = require("../controllers/orderController")
const {authentication,authorization} =require("../middleware/auth")


 router.post("/register",userController.createUser)
 router.post("/login",userController.userLogin)
 router.get("/user/:userId/profile",authentication,userController.getUser)
 router.put("/user/:userId/profile",authentication,authorization,userController.updateUser)



 router.post("/products",productController.createProduct) 
 router.get('/products', productController.getProduct)
 router.get('/products/:productId', productController.getProductsById)
 router.put('/products/:productId', productController.updateProduct)
 router.delete('/products/:productId', productController.deleteProduct)


 router.post("/users/:userId/cart",cartController.createCart)
 router.put("/users/:userId/cart",cartController.updateCart)
 router.get("/users/:userId/cart",cartController.getCartDetails)
 router.delete("/users/:userId/cart",cartController.cartDeletion)

 router.post("/users/:userId/orders",authentication,authorization,orderController.orderCreation)
 router.put("/users/:userId/orders",authentication,authorization,orderController.updateOrder)


 
module.exports= router   