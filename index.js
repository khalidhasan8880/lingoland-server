require('dotenv').config()
const express = require('express')
const cors = require('cors')
var jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const app = express()
const port = process.env.PORT || 5000
app.use(express.json())
app.use(cors())


// create jwt token --------------
app.post('/jwt', (req, res) => {
  const user = req.body
  const token = jwt.sign(user, process.env.SECRET_KEY);
  res.send({ token })
})

// verify jwt -------------------





const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization
  if (!authorization) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
  }

  const token = authorization.split(' ')[1]
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
          return res.status(401).send({ error: true, message: 'unauthorized access' })
      }
      req.decoded = decoded
      next()
  })
}






// mongodb ------------------
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sgqndpo.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    await client.connect();

    const classCollection = client.db("lingolandDb").collection("classes");
    const userCollection = client.db("lingolandDb").collection("users");



// verify admin
    const verifyAdmin = async (req, res, next)=>{
      const email = req?.decoded?.email
      const user = await userCollection.findOne({email:email})
      if (user?.role !== 'admin') {
        res.status(401).send({error:true, message:'forbidden access'})
      }
      next()
    }
// verify instructor
    const verifyInstructor = async (req, res, next)=>{
      const email = req?.decoded?.email
      const user = await userCollection.findOne({email:email})
      if (user?.role !== 'instructor') {
        res.status(401).send({error:true, message:'forbidden access'})
      }
      next()
    }









    // save user information in database
    app.put('/users/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;

      const query = { email: email }
      const options = { upsert: true }
      const updateUser = {
        $set: user
      }

      const result = await userCollection.updateOne(query, updateUser, options)
      res.send(result)
    })
    // -----------user----user-----user----user-----user----user-----user----user-----user----user-----user
    // TODO: MAKE PRIVET

    // get all user 
    app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    // user role checking
    app.get('/users/role/:email', verifyJWT,  async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      console.log('verifyEmail', req?.decoded?.email);
      console.log('req email', email);
      if ( req?.decoded?.email !== req?.params?.email) {
        return res.status(403).send({error:true, message:'forbidden access'})
      }
      const user = await userCollection.findOne(query)
      res.send({role:user?.role})

    })


// update admin role
    app.post('/users/admin/:id', async (req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const options = {upsert:true}
      const updateDoc = {
        $set:{role:'admin'}
      }
      const result = await userCollection.updateOne(query, updateDoc, options)
      res.send(result)
    })
// update instructor role
    app.post('/users/instructor/:id', verifyJWT, verifyAdmin, async (req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const options = {upsert:true}
      const updateDoc = {
        $set:{role:'instructor'}
      }
      const result = await userCollection.updateOne(query, updateDoc, options)
      res.send(result)
    })
// delete user 
// TODO: VERIFY ADMIN
    app.delete('/users/delete/:id', verifyJWT, verifyAdmin, async (req, res)=>{
      const id = req.params.id;
      console.log(id);
     const query = {_id: new ObjectId(id)}
     const result = await userCollection.deleteOne(query)
      res.send(result)
    })
    // -user----user-----user----user-----user----user-----user----user-----user----user-----user----user----


    // ------instructor------instructor------instructor------instructor------instructor------instructor----
    // insert class
    app.post('/classes', verifyJWT, verifyInstructor, async()=>{
      const classData = req.body
      const result = await classCollection.insertOne(classData)
      req.send(result)
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


