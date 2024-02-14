const express = require('express')
const mongoose = require('mongoose')
const app = express()
app.use(express.json())
var bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
var jwt = require('jsonwebtoken');

//mongoose models
const ProductModel = mongoose.model('product', { title: String })
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role:{type:String,default:'user'}

})
const UserModel = mongoose.model('client', userSchema)
//connection to db

app.post('/register', body('name').isLength({ min: 5 }), async (req, res) => {
    const result = validationResult(req);

    if (result.error) {
        res.json({ msg: "invalid name" }) 
    } 
    const { name, email, password } = req.body
    const hashed = await bcrypt.hash(password, 10);
    const newUser = await UserModel.create({ name, email, password: hashed })
    res.json({ newUser })
})
const cryptopass = "f6dc7627424786ecbe71d056d74d65ac2f64fd8b3da67157a0b6c824b78106b9"
app.post('/login', async (req, res) => {
    const { email, password } = req.body
    const user = await UserModel.findOne({ email: email })
 
    if (!user) {
        res.json({ msg: "email not found" })
    }

    const compare = await bcrypt.compare(password, user.password)
    if (!compare) {
        res.status(401).json({ msg: "invlid email or password" })
    }
    const token = jwt.sign({ role: user.role }, cryptopass, { expiresIn: '10m'});

    res.json({ token: token })

})

const verifytoken=async (req, res, next) => {
    const token = req.headers.authorization || req.headers.Authorization
    if (!token) {
        res.status(401).json({ msg: 'there is no token' })
    }
    const vtoken = token.split(' ')[1]
    await jwt.verify(vtoken, cryptopass, function (err, decoded) {
        if (err) {
            res.json({ msg: 'invalidddtokennnnn' })
        }
        else {
            req.headers.decode=decoded
            next()
        }
    }) 
}

function validateRole(...roles){ 
    
    //[admin,manger] 
  return(req,res,next)=>{  
    console.log(req.headers);
    
    if(!roles.includes(req.headers.decode.role)){
        res.status(401).json({msg:'unauthorized'})
    }
    next()}
}

app.get('/',verifytoken,validateRole('admin',"manager") ,async (req, res) => {
    
    const prods = await ProductModel.find()
    res.json({ prods })
})

mongoose.connect('mongodb://localhost:27017/ecommerce').then(() => {
    console.log("connected to db");
})





mongoose.connection.once('open', () => {
    app.listen(5000, () => {
        console.log('server running on port 5000')
    })
})

