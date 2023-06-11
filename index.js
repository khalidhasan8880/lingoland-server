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
const { MongoClient, ServerApiVersion, ObjectId, Admin } = require('mongodb');
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

    // await client.connect();

    const classCollection = client.db("lingolandDb").collection("classes");
    const cartCollection = client.db("lingolandDb").collection("carts");
    const userCollection = client.db("lingolandDb").collection("users");


    app.get('/', (req, res) => {
      console.log();
      res.send('khalid')
    })

    // verify admin
    const verifyAdmin = async (req, res, next) => {
      const email = req?.decoded?.email
      const user = await userCollection.findOne({ email: email })
      if (user?.role !== 'admin') {
        res.status(401).send({ error: true, message: 'forbidden access' })
      }
      next()
    }
    // verify instructor
    const verifyInstructor = async (req, res, next) => {
      const email = req?.decoded?.email
      const user = await userCollection.findOne({ email: email })
      if (user?.role !== 'instructor') {
        res.status(401).send({ error: true, message: 'forbidden access' })
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
    app.get('/users/role/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      console.log('verifyEmail', req?.decoded?.email);
      console.log('req email', email);
      if (req?.decoded?.email !== req?.params?.email) {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      const user = await userCollection.findOne(query)
      res.send({ role: user?.role })

    })


    // update admin role
    app.post('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true }
      const updateDoc = {
        $set: { role: 'admin' }
      }
      const result = await userCollection.updateOne(query, updateDoc, options)
      res.send(result)
    })
    // update instructor role
    app.post('/users/instructor/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true }
      const updateDoc = {
        $set: { role: 'instructor' }
      }
      const result = await userCollection.updateOne(query, updateDoc, options)
      res.send(result)
    })
    // delete user 
    // TODO: VERIFY ADMIN
    app.delete('/users/delete/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })






    app.post('/add-class/:email', verifyJWT, verifyInstructor, async (req, res) => {
      const classData = req.body
      const result = await classCollection.insertOne(classData)
      res.send(result)
    })

    // get classes popular 
    app.get('/classes/popular', async (req, res) => {
      const result = await classCollection.find({ status: "approved" }).sort({ enrolledStudents: 1 }).toArray()
      res.send(result)
    })
    // get instructors classes
    app.get('/classes/:email', verifyJWT, verifyInstructor, async (req, res) => {
      const email = req.params.email
      const result = await classCollection.find({ email: email }).toArray()
      res.send(result)
    })
    // get classes admin
    app.get('/classes', verifyJWT, verifyAdmin, async (req, res) => {
      const result = await classCollection.find().toArray()
      res.send(result)
    })
    // get classes admin
    app.patch('/classes/approve/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true }
      const updateStatus = {
        $set: {
          status: 'approved'
        }
      }
      const result = await classCollection.updateOne(query, updateStatus, options)
      res.send(result)
    })


    // update class 
    app.post('/classes/update/:id', async (req, res) => {
      const id = req.params.id
      const updatedClass = req.body
      const options = { upsert: true }
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          instructorName: updatedClass?.instructorName,
          email: updatedClass?.email,
          price: updatedClass?.price,
          seats: updatedClass?.seats,
          className: updatedClass?.className,
          phone: updatedClass?.phone,
          photo: updatedClass?.photo,
          status: updatedClass?.status,
        }
      }
      const result = await classCollection.updateOne(query, updateDoc)
      res.send(result)
    })


    app.patch('/classes/feedback/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const feedback = req.body?.feedback
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true }
      const updateDoc = {
        $set: {
          feedback: feedback,
          status: 'deny'
        }
      }
      const result = await classCollection.updateOne(query, updateDoc, options)
      res.send(result)
    })
    // delete classes

    app.delete('/classes/delete/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await classCollection.deleteOne(query)
      res.send(result)
    })


    // TODO: USE PUT METHOD FOR BREAK INSERT MULTIPLE OR SAME DATA
    app.post('/carts', verifyJWT, async (req, res) => {
      const cart = req.body
      console.log(cart);
      const result = await cartCollection.insertOne(cart)
      res.send(result)
    })
    // GET CART BY EMAIL
    app.get('/carts/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const carts = await cartCollection.find({ email: email }).toArray()
      // console.log(carts);
      // 
      const query = carts?.map(cart => new ObjectId(cart?.classId))
      const classes = await classCollection.find({ _id: { $in: query } }).toArray()

      res.send(classes)
    })

    // get instructors
    app.get('/instructors', async (req, res) => {

      const instructors = await userCollection.find({ role: 'instructor' }).toArray();
    
      const emails = instructors.map(user => user.email);
      console.log(emails);
      const classes = await classCollection.find({ email: { $in: emails } }).toArray();

      console.log(classes);
      res.send({ instructors, classes });

    })
   
    


    // --payment----payment----payment----payment----payment----payment----payment--

    app.post('/create-payment-intent', verifyJWT, async (req, res) => {
      const price = req.body?.totalPrice
      const amount = price * 100;
      const customer = req.body
console.log(customer);
      console.log(price, amount);
      const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "inr",
          payment_method_types: ["card"],
          metadata: {
              customer_name: customer?.name,
              customer_email: customer?.email,
          },
          shipping: {
              name: "khalid",
              address: {
                  line1: 'Ward Number 69',
                  city: 'Kolkata',
                  state: 'West Bengal',
                  postal_code: '700019',
                  country: 'India',
              },
          },
      });

      res.send({ clientSecret: paymentIntent.client_secret })
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


