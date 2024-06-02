const express = require("express");
const cors = require("cors");
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors({
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));
app.use(express.json());


const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.mxltse8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const usersCollection = client.db("userDB").collection("users");
    const productCollection = client.db("productDB").collection("products");

    // to check admin
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = {email: email}
      const user = await usersCollection.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role === "admin";
      }
      res.send({admin});
    })

    // Users related API
    app.post("/users", async(req, res) => {
      const user = req.body;
      const query = {email: user.email};
      const isExists = await usersCollection.findOne(query);
      if(isExists){
        return res.send({message: "User Already Exists"});
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })

    // Products related API
    // ===========================================
    // Sorted Featured Products
    app.get("/featured", async(req, res) => {
      const isFeatured = true;
      const query = {featured : isFeatured}
      const result = await productCollection.find(query).sort({timestamp: -1}).toArray();
      res.send(result);
    })

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("Welcome to backend server");
})
app.listen(port, () => {
  console.log("App is running on the port : ", port);
})