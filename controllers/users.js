const User = require('../models/user');
const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET;
const PostModel = require('../models/post')

const { v4: uuidv4 } = require('uuid');
// uuid, helps generate our unique ids
const S3 = require('aws-sdk/clients/s3');
// initialize the S3 consturctor function to give us the object that can perform crud operations to aws
const s3 = new S3();

const BUCKET_NAME = process.env.S3_BUCKET


module.exports = {
  signup,
  login,
  profile
};

async function profile(req, res){
  try {
    // Find the user by there username
    // from the params
    const user = await User.findOne({username: req.params.username})
    // if we don't find a user send back user not found
    if (!user) return  res.status(404).json({error: 'User not found'})

    // Find all of the posts for user and respond to the client
    const posts = await PostModel.find({user: user._id}).populate('user').exec()

    res.status(200).json({data: posts, user: user})
  } catch(err){
    console.log(err)
    res.status(400).json({err})
  }
}

async function signup(req, res) {
  console.log(req.body)

  // req.file.buffer is the actually image
  // s3.upload(parmas) is the express request to aws

    const user = new User({...req.body}); // data.Location is the url for your image on aws
    try {
      await user.save(); // user model .pre('save') function is running which hashes the password
      const token = createJWT(user);
      res.json({ token }); // set('toJSON',) in user model is being called, and deleting the users password from the token
    } catch (err) {
      console.log(err)
      // Probably a duplicate email
      res.status(400).json(err);
    }


 // end of s3.upload

}

async function login(req, res) {
 
  try {
    const user = await User.findOne({email: req.body.email});
   
    if (!user) return res.status(401).json({err: 'bad credentials'});
    user.comparePassword(req.body.password, (err, isMatch) => {
      
      if (isMatch) {
        const token = createJWT(user);
        res.json({token});
      } else {
        return res.status(401).json({err: 'bad credentials'});
      }
    });
  } catch (err) {
    return res.status(401).json(err);
  }
}

/*----- Helper Functions -----*/

function createJWT(user) {
  return jwt.sign(
    {user}, // data payload
    SECRET,
    {expiresIn: '24h'}
  );
}
