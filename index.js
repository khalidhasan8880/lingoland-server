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






    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


