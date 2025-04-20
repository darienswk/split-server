require("dotenv").config();
const cors = require("cors");
// server.js
const express = require("express");
const db = require("./firebase");
const firestore = require("firebase/firestore");
const axios = require("axios");

const {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  deleteDoc,
  doc,
  where,
  updateDoc,
} = firestore;

const app = express();
const port = 5000;
const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const BASE_CURRENCY = "SGD";
// const EXCHANGE_RATE_API_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/${BASE_CURRENCY}`;
const EXCHANGE_RATE_API_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/${BASE_CURRENCY}`;

// Middleware to parse JSON requests
app.use(express.json());
app.use(cors());

app.get("/exchange-rates", async (req, res) => {
  try {
    const response = await axios.get(EXCHANGE_RATE_API_URL);
    res.status(200).json(response.data.conversion_rates);
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    res.status(500).json({ error: "Failed to fetch exchange rates" });
  }
});

app.post("/update-item", async (req, res) => {
  try {
    const item = req.body;

    if (!item.id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing item ID" });
    }

    const { id, ...fieldsToUpdate } = item;

    // Optionally prevent updating createdAt (if needed)
    delete fieldsToUpdate.createdAt;

    const docRef = doc(db, "payments", id);
    await updateDoc(docRef, fieldsToUpdate);

    res
      .status(200)
      .json({ success: true, message: `Item ${id} updated successfully` });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create an item
app.post("/payments", async (req, res) => {
  try {
    const { newItem } = req.body;
    const colRef = collection(db, "payments");
    // Add a new document with a generated ID
    const docRef = await addDoc(colRef, {
      ...newItem,
      createdAt: new Date(),
    });
    res.status(201).json({ success: true, id: docRef.id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message }); // Send error response
  }
});

// Read payments
app.get("/payments/:id", async (req, res) => {
  try {
    const { id } = req.params; // Get the trip_id from the URL

    const querySnapshot = await getDocs(
      query(
        collection(db, "payments"),
        where("trip_id", "==", id), // Filter by trip_id
        orderBy("createdAt", "desc")
      )
    );

    const items = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).send(items);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Delete an item
app.delete("/payments/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    await deleteDoc(doc(db, "payments", itemId));
    res
      .status(200)
      .json({ success: true, message: `Document with ID ${docId} deleted` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get trips
app.get("/trips", async (req, res) => {
  try {
    const querySnapshot = await getDocs(query(collection(db, "trips")));
    const items = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).send(items);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
