const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
const corsOptions = {
  origin: [
    'https://techbrand-204fb.web.app/',
    'http://localhost:5173',
  ],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))

console.log();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e0fsll4.mongodb.net/?retryWrites=true&w=majority`;

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
    const productsCollection = client.db('SCIC1DB').collection('products')

    // get: all products with query add pagination added
    app.get('/products', async (req, res) => {
      const query = req.query
      let newQuery = {}     
      const currPage = +query.currPage
      const limit = +query.limit || 10
      const skip = (currPage - 1) * limit

      const queryOptions = {
        skip,
        limit
      }
      
      // search query added
      newQuery.name = { $regex: new RegExp(query.search, 'i') }
      // sort      
      switch (query.sort) {
        case 'date':
          queryOptions.sort = { created_at: 1 }
          break;
        case 'price-asc':
          queryOptions.sort = { price: 1 }
          break;
        case 'price-desc':
          queryOptions.sort = { price: -1 }
          break;
      
        default:
          queryOptions.sort = {}
          break;
      }
      // filter - category
      if (query.category) {
        newQuery.category = query.category
      }
      // filter - multiple brand
      if (query.brands) {
        newQuery.brand = { $in: query.brands.split(' ') }
      }
      // filter - price range
      if (+query.priceMax) {
        newQuery.price = { $gte: +query.priceMin, $lte: +query.priceMax }
      }
      
      // get products data; count products
      const productsData = await productsCollection.find(newQuery, queryOptions).toArray()
      const totalProducts = await productsCollection.countDocuments(newQuery)
      
      return res.send({products: productsData, total: totalProducts})
    })
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
  res.send("Welcome to assignment 11 backend😬!!");
});

app.listen(port, () => {
  console.log(`running on port ${port}`);
});
