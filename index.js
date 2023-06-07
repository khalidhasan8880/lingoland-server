const express = require('express')
const cors = require('cors')
require('dotenv').config()
var jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const app = express()
const port = process.env.PORT || 5000
app.use(express.json())
app.use(cors())

console.log(process.env.DB_USER);

// create jwt token
app.post('/jwt', (req, res) => {
  const user = req.body
  const token = jwt.sign(user, process.env.SECRET_KEY);
  res.send({ token })
})

// mongodb
const { MongoClient, ServerApiVersion } = require('mongodb');
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

    // insert user
    app.put('/user/:email', async(req, res)=>{
      const email = req.params.email;
      const user = req.body;

console.log(user);
console.log(email);
      const query = {email:email}
      const options = {upsert:true}
      const updateUser = {
        $set:user
      }


      const result = await userCollection.updateOne(query,updateUser, options)
      res.send(result)
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


