const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const UserSchema = mongoose.Schema({
    name : {
        type : String,
        required : [true,'Please add a name']
    },
    email : {
        type : String,
        required : [true,'Please add a email'],
        unique : true,
        
    },
    role : {
        type : String,
        enum : ['user','publisher'],
        default : 'user'
    },
    password : {
        type : String,
        required : [true,'Please a password'],
        minLength : 6,
        select : false
    },
    resetPasswordToken : String,
    resetPasswordExpire : Date,
    createdAt : {
        type : Date,
        default : Date.now
    } 
})

//Encrypt password using bcrypt
UserSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password , salt)
})

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({id : this._id},process.env.JWT_SECRET , {
        expiresIn : process.env.JWT_EXPIRE
    })
}

//Match the entered password to the password in the model
UserSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password);
}

// Generate and hash user schema
UserSchema.methods.getResetPasswordToken = function()  {
    // Generate Token
    const resettoken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToekn Field
    this.resetPasswordToken = crypto.createHash('sha256').update(resettoken).digest('hex');

    //Set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000

    return resettoken;
}

module.exports = mongoose.model('User',UserSchema);