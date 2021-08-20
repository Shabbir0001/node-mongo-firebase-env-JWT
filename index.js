const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');
const port = 4000;

const app = express();
app.use(bodyParser.json());
app.use(cors());


require('dotenv').config();
console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uvezx.mongodb.net/BurjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });



const serviceAccount = require("./configs/burj-al-arab-de0e7-firebase-adminsdk-z7dnt-9fa1d8b6ae.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


client.connect(err => {
    const bookings = client.db("BurjAlArab").collection("bookings");

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
            .then(result => {
                console.log(result);
            })
        console.log(newBooking);
    })

    app.get('/bookings', (req, res) => {
        const bearer = (req.headers.authorization);
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail == queryEmail) {
                        bookings.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents)
                            })
                    }
                    else {
                        res.status(401).send("Unauthorized User")

                    }
                })
                .catch((error) => {
                    res.status(401).send("Unauthorized User")
                });
        }

        else {
            res.status(401).send("Unauthorized User")
        }

    })

});



app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})