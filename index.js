const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const dotenv = require("dotenv");
dotenv.config();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5ipn6sc.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const servicesCollection = client.db("FoodReview").collection("services");
    const reviewCollection = client.db("FoodReview").collection("reviews");

    function verifyJwt(req, res, next) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res
          .status(401)
          .send({ message: "Invalid authorization header" });
      }

      const token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
          return res.status(401).send({ message: "Invalid authorization" });
        }
        req.decoded = decoded;
        next();
      });
    }

    // jwt authorization
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    app.get("/services", async (req, res) => {
      const query = {};
      const result = await servicesCollection.find(query).toArray();
      res.send(result);
    });
    // view service details for each service id

    app.get("/services/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await servicesCollection.findOne(query);
      res.send(result);
    });

    // review service

    app.post("/reviews", async (req, res) => {
      const reviews = req.body;
      const result = await reviewCollection.insertOne(reviews);
      res.send(result);
    });

    // query by email address in the order specified
    app.get("/reviews", verifyJwt , async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    });

    // delete a review from the database

    app.delete("/reviews/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });
    // add new services to the database

    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await servicesCollection.insertOne(service);
      res.send(result);
    });

    // query by _id and return results from the service
    app.get("/reviews/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await reviewCollection.findOne(query);
      res.send(result);
    });

    // update a review with a new review collection

    app.put("/reviews/:id", async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const user = req.body;
      const option = { upsert: true };
      const updatedUser = {
        $set: {
          name: user.name,
        },
      };
      const result = await reviewCollection.updateOne(
        filter,
        updatedUser,
        option
      );
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World! food review server!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
