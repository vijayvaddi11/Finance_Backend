import jwt from 'jsonwebtoken';

const verifyToken =(req,res,next)=>{
     const authHeader = req.headers.authorization;
     if(!authHeader){
          return res.status(401).json({message:'Token missing'})
     }

     const token = authHeader.split(" ")[1];
     try{
          const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
          console.log(decoded)
          req.userId = decoded.userId;
          req.name = decoded.name;
          req.role = decoded.role;
          next();
     }catch(err){
          return res.status(401).json({ message: "Invalid token" });
     }
}

export default verifyToken;