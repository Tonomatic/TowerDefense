// const express = require('express');
// const path = require('path');

// const app = express();
// const port = process.env.PORT || 8080;

// // sendFile will go here
// app.get('/', function(req, res) {
//   res.sendFile(path.join(__dirname, '/index.html'));
// });

// app.listen(port);
// console.log('Server started at http://localhost:' + port);

const express = require("express")
const app = express()

// use the express-static middleware
app.use(express.static("public"))

// define the first route
app.get("/", function (req, res) {
  res.send("<h1>Hello World!</h1>")
})

// start the server listening for requests
app.listen(process.env.PORT || 3000,
	() => console.log("Server is running..."));
