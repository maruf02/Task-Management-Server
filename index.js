const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ofnl5ln.mongodb.net/?retryWrites=true&w=majority`;

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
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const AllUsersCollection = client.db('TaskManage').collection('Users');
        const AllTaskSheetCollection = client.db('TaskManage').collection('TaskSheet');
        // jwt for locastorage
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' });
            res.send({ token });
        })


        app.post('/logout', (req, res) => {
            res.clearCookie('token').send({ success: true });
        });


        // middlewares 
        const logger = (req, res, next) => {
            console.log('log: info', req.method, req.url);
            next();
        }


        const verifyToken = (req, res, next) => {
            // console.log('inside token', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                const email = req.decoded.email;
                console.log(email);
                next();
            })
        }









        app.get('/users', async (req, res) => {
            const cursor = AllUsersCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            // console.log(role);
            const query = { email: email }
            const result = await AllUsersCollection.findOne(query);
            res.send(result);
        })



        app.post('/users', async (req, res) => {
            const newUser = req.body;
            console.log(newUser);
            const query = { email: newUser.email }
            const existingUser = await AllUsersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await AllUsersCollection.insertOne(newUser);
            res.send(result);
        })


        app.get('/tasksheet', async (req, res) => {
            const result = await AllTaskSheetCollection.find().toArray();
            res.send(result);
        })

        app.get('/tasksheet/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await AllTaskSheetCollection.findOne(query);
            res.send(result);
        })
        app.get('/tasksheett/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await AllTaskSheetCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/tasksheett/todo/:email', async (req, res) => {
            const status = 'todo';
            const email = req.params.email;
            const query = { Status: status, email: email }

            const result = await AllTaskSheetCollection.find(query).toArray();
            console.log(result, query, email, status);
            const priorityOrder = {
                High: 1,
                Moderate: 2,
                Low: 3,
            };
            result.sort((taskA, taskB) => {
                const priorityA = priorityOrder[taskA.priority];
                const priorityB = priorityOrder[taskB.priority];

                return priorityA - priorityB;
            });
            res.send(result);
        })



        app.get('/tasksheett/ongoing/:email', async (req, res) => {
            const status = 'ongoing';
            const email = req.params.email;
            const query = { Status: status, email: email }
            const result = await AllTaskSheetCollection.find(query).toArray();
            const priorityOrder = {
                High: 1,
                Moderate: 2,
                Low: 3,
            };
            result.sort((taskA, taskB) => {
                const priorityA = priorityOrder[taskA.priority];
                const priorityB = priorityOrder[taskB.priority];

                return priorityA - priorityB;
            });
            res.send(result);
        })
        app.get('/tasksheett/finished/:email', async (req, res) => {
            const status = 'finished';
            const email = req.params.email;
            const query = { Status: status, email: email }
            const result = await AllTaskSheetCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/tasksheet', async (req, res) => {
            const newWorkSheet = req.body;
            console.log(newWorkSheet);
            const result = await AllTaskSheetCollection.insertOne(newWorkSheet);
            console.log(result);
            res.send(result);
        })

        app.put('/tasksheet/:id/read', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const option = { upsert: true }
            const task = {
                $set: {
                    Read: 'old',
                }
            }

            const result = await AllTaskSheetCollection.updateOne(filter, task, option);
            console.log(result);
            res.send(result);
        });

        app.put('/tasksheet/:id/start', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const option = { upsert: true }
            const task = {
                $set: {
                    Status: 'ongoing',
                }
            }

            const result = await AllTaskSheetCollection.updateOne(filter, task, option);
            console.log(req.body);
            res.send(result);
        });
        app.put('/tasksheet/:id/ongoing', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const option = { upsert: true }
            const task = {
                $set: {
                    Status: 'finished',
                }
            }

            const result = await AllTaskSheetCollection.updateOne(filter, task, option);
            console.log(req.body);
            res.send(result);
        });
        app.put('/tasksheet/:id', async (req, res) => {
            const id = req.params.id;
            const updateTask = req.body;
            console.log(updateTask);
            const filter = { _id: new ObjectId(id) }
            const option = { upsert: true }
            const task = {
                $set: {
                    desc: updateTask.desc,
                }
            }

            const result = await AllTaskSheetCollection.updateOne(filter, task, option);
            // console.log(req.body);
            res.send(result);
        });

        app.delete('/tasksheet/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await AllTaskSheetCollection.deleteOne(query);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



// Start main Server
app.get('/', (req, res) => {
    res.send('server is running');
});

app.listen(port, () => {
    console.log(`server is running in port: ${port}`);
})