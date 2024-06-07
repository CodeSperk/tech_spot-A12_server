const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://b9a12-final-project.web.app"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.mxltse8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const usersCollection = client.db("userDB").collection("users");
    const productCollection = client.db("productDB").collection("products");
    const reviewCollection = client.db("productDB").collection("reviews");

    // Users related API
    //=======================
    // to get user
    app.get("/user", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send({ message: "Email is required" });
      }
      const query = {email: email};
      const result = await usersCollection.findOne(query);
      res.send(result);
    })

    // to get user Role
    app.get("/users/role/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if(user){
        res.send({role: user.role});
      }else{
        res.status(404).send({message: "user not found"})
      }
    });

    // to post user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const isExists = await usersCollection.findOne(query);
      if (isExists) {
        return res.send({ message: "User Already Exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Products related API
    // ===========================================

    // to get all accepted products
    app.get("/products", async (req, res) => {
      const status = "accepted";
      const query = { status: status };
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });

    // Sorted Featured Products
    app.get("/featured", async (req, res) => {
      const isFeatured = true;
      const query = { featured: isFeatured };
      const result = await productCollection
        .find(query)
        .sort({ timestamp: -1 })
        .toArray();
      res.send(result);
    });

    // to get trending product
    app.get("/trending", async (req, res) => {
      const result = await productCollection
        .find()
        .sort({ upvote: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    // to get single product
    app.get("/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result);
    });

    // to update product vote
    app.patch("/product/:id", async (req, res) => {
      const id = req.params.id;
      const { currentVote, email } = req.body;
      const query = { _id: new ObjectId(id) };

      // to check if he voted earlier
      const product = await productCollection.findOne(query);
      if (product.votedUsers && product.votedUsers.includes(email)) {
        return res
          .status(400)
          .send({ message: "You have already voted for this product" });
      }
      const options = { upsert: true };
      const updatedProduct = {
        $set: {
          upvote: currentVote,
        },
        $push: {
          votedUsers: email,
        },
      };
      const result = await productCollection.updateOne(
        query,
        updatedProduct,
        options
      );
      res.send(result);
    });

    // Review related API
    // ===========================================
    // to get productwise review
    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { productId: id };
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    });

    // to post review
    app.post("/review", async (req, res) => {
      const query = req.body;
      const result = await reviewCollection.insertOne(query);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to backend server");
});
app.listen(port, () => {
  console.log("App is running on the port : ", port);
});
