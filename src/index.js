const express = require('express');

const app = express();
const port = process.env.RECIPE_BOOK_APP_PORT;
require('./db/mongoose');

const userRouter = require('./routers/user')
const recipeRouter = require('./routers/recipe')

//should be before all the app.use()
// app.use((req,res,next)=>{
//     res.status(503).send('Site is in maintenance..please standby');
// })

const cors = require ('cors');
app.use(cors())
// app.use(cors({
//     origin:['http://localhost:4200','http://127.0.0.1:4200'],
//     credentials:true
// }));

// app.use(function (req, res, next) {

//   res.header('Access-Control-Allow-Origin', "http://localhost:4200");
//   res.header('Access-Control-Allow-Headers', true);
//   res.header('Access-Control-Allow-Credentials', true);
//   res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//   next();
// });

//converts json requests to javascript object
app.use(express.json());

//Routers 
app.use(userRouter);
app.use(recipeRouter);


app.listen(port,()=>{
    console.log('Server is up and running at Port '+ port);
})







