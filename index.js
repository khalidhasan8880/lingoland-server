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
  // console.log(req.headers.authorization);

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
    const paymentCollection = client.db("lingolandDb").collection("payments");
    const userCollection = client.db("lingolandDb").collection("users");


    app.get('/', (req, res) => {
      res.send('khalid')
    })

    // verify admin
    const verifyAdmin = async (req, res, next) => {
      const email = req?.decoded?.email
      const user = await userCollection.findOne({ email: email })
      if (user?.role !== 'admin') {
        return res.status(401).send({ error: true, message: 'forbidden access' })
      }
      next()
    }
    // verify instructor
    const verifyInstructor = async (req, res, next) => {
      const email = req?.decoded?.email
      const user = await userCollection.findOne({ email: email })
      if (user?.role !== 'instructor') {
        return res.status(401).send({ error: true, message: 'forbidden access' })
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
    app.delete('/users/delete/:id', async (req, res) => {
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
    // get classes
    app.get('/classes', async (req, res) => {
      const result = await classCollection.find({ status: "approved" }).toArray()
      res.send(result)
    })


    // all classes for approve admin ---  
    app.get('/all-classes/admin', verifyJWT, verifyAdmin, async (req, res) => {
      const result = await classCollection.find().toArray()
      res.send(result)
    })


    // get classes admin
    app.patch('/classes/approve/:id', verifyJWT, verifyAdmin, async (req, res) => {
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
    app.post('/classes/update/:id', verifyJWT, verifyInstructor, async (req, res) => {
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

    app.delete('/classes/delete/:id', verifyJWT, verifyInstructor, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await classCollection.deleteOne(query)
      res.send(result)
    })


    // TODO: USE PUT METHOD FOR BREAK INSERT MULTIPLE OR SAME DATA
    app.put('/carts/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded?.email) {
        return res.status(401).send({error:true, message:'unauthorized'})
      }
      const query  = {email, classId:req.body.classId}
      const cart = req.body
      const options = { upsert: true }
      const updateDoc = {
        $set: cart
      }
      const result = await cartCollection.updateOne(query, updateDoc, options)
      res.send(result)
    })
    // GET CART BY EMAIL
    app.get('/carts/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const carts = await cartCollection.find({ email: email }).toArray()
      const query = carts?.map(cart => new ObjectId(cart?.classId))
      const classes = await classCollection.find({ _id: { $in: query } }).toArray()

      res.send(classes)
    })


    // get instructors
    app.get('/instructors', async (req, res) => {
      const instructors = await userCollection.find({ role: 'instructor' }).toArray();

      const emails = instructors.map(user => user.email);
      const classes = await classCollection.find({ email: { $in: emails }, status: 'approved' }).toArray();

      res.send({ instructors, classes });

    })




    // --payment----payment----payment----payment----payment----payment----payment--

    app.post('/create-payment-intent', verifyJWT, async (req, res) => {
      const price = req.body?.totalPrice
      const amount = price * 100;
      const customer = req.body

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


    // stored payments
    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const purchasedClassesId = req.body?.purchasedClassesId;
      const result = await paymentCollection.insertOne(payment)

      const query = purchasedClassesId?.map(id => new ObjectId(id)); // Convert ids to ObjectIds

      const updateDoc = {
        $inc: {
          enrolledStudents: 1,
          seats: -1
        }
      };

      const options = { upsert: true };
      const updateResult = await classCollection.updateMany({ _id: { $in: query } }, updateDoc, options);
      res.send(result);
    })
    // stored single payment
    app.post('/payment', async (req, res) => {
      const payment = req.body;
      const purchasedClassId = req.body?.purchasedClassId;
      const result = await paymentCollection.insertOne(payment)

      const query = { _id: new ObjectId(purchasedClassId) }

      const updateDoc = {
        $inc: {
          enrolledStudents: 1,
          seats: -1
        }
      };

      const options = { upsert: true };
      const updateResult = await classCollection.updateOne(query, updateDoc, options);
      res.send(result);
    })




    app.post('/create-intent-for-single-item', async (req, res) => {
      const price = req.body?.price
      const amount = price * 100;
      const customer = req.body

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

    // delete carts after payment
    app.delete('/delete/carts/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const result = await cartCollection.deleteMany({ email: email })
      res.send(result)
    })

    app.delete('/delete-single-cart/:email', verifyJWT,  async (req, res) => {
      const email = req.params.email;
      const classId = req.body.classId;
    
     console.log(req.params.email);
      const query = { classId: classId, email: email }
      const result = await cartCollection.deleteOne(query)
      res.send(result)
    })

    // enrolled Classes
    // TOTO: Use Mongodb Aggregation /////////////// 
    app.get('/enrolled-classes/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const enrolledClasses = await paymentCollection.find({ email: email }).toArray()

      // nested loop
      const enrolledClassesId = enrolledClasses.map(cls => {
        if (Array.isArray(cls?.purchasedClassId)) {
          return cls.map(c => c.purchasedClassId)
        } else {
          return cls?.purchasedClassId
        }
      })

      const query = enrolledClassesId?.map(id => new ObjectId(id))
      const result = await classCollection.find({ _id: { $in: query } }).toArray()
      res.send(result)
    })


    // get payment history by user email
    app.get('/payments/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const result = await paymentCollection.find({ email: email }).toArray()
      res.send(result)
    })

    // -------------------end-----------------------//


    app.get('/data-count/:email', verifyJWT, async (req, res) => {
      const email = req.decoded?.email;
      const checkRole = await userCollection.findOne({ email });
      if (email !== req.params.email) {
        return res.status(401).send({ error: true })
      }
      if (checkRole?.role === 'admin') {
        const userCount = await userCollection.estimatedDocumentCount();
        const instructorCount = await userCollection.countDocuments({ role: 'instructor' });
        const classesCount = await classCollection.estimatedDocumentCount();
        const pendingClasses = await classCollection.countDocuments({ status: 'pending' });

        res.send({ userCount, instructorCount, pendingClasses, classesCount });
      } else if (checkRole?.role === 'instructor') {
        const myClasses = await classCollection.countDocuments({ email });
        const myApprovedClasses = await classCollection.countDocuments({ email, status: 'approved' });
        const myPendingClasses = await classCollection.countDocuments({ email, status: 'pending' });
        const denyClasses = await classCollection.countDocuments({ email, status: 'deny' });

        res.send({ myClasses, myApprovedClasses, myPendingClasses, denyClasses });
      } else {
        const mySelectedClasses = await cartCollection.countDocuments({ email })
        const myTotalNumberOfPayment = await paymentCollection.countDocuments({ email })
        res.send({ mySelectedClasses,myTotalNumberOfPayment });
      }

    });











    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


