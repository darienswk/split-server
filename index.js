require('dotenv').config()
const cors = require('cors')
// server.js
const express = require('express');
const db = require('./firebase');
const firestore = require('firebase/firestore')

const { collection, addDoc, getDocs, orderBy, query, deleteDoc, doc } = firestore;

const app = express();
const port = 5000;

// Middleware to parse JSON requests
app.use(express.json());
app.use(cors());

// Create an item
app.post('/payments', async (req, res) => {
  try {
    console.log(req.body)
    const {newItem} = req.body;
    const colRef = collection(db, 'payments');
    // Add a new document with a generated ID
    await addDoc(colRef, {
        ...newItem,
        createdAt: new Date(),
    });
    res.status(201).send("Item created");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Read payments
app.get('/payments', async (req, res) => {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'payments'), orderBy('createdAt', "desc")));
    const items = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).send(items);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Delete an item
app.delete('/payments/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    await deleteDoc(doc(db, 'payments', itemId));
    res.status(200).send(`Item with ID: ${itemId} deleted`);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
