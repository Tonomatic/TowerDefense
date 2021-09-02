
const express = require('express')
const app = express()
es6Renderer = require('express-es6-template-engine'),

//this sets up multiple pages
app.engine('html', es6Renderer);
app.set('views', 'views');
app.set('view engine', 'html');

//this is our game file. Does not work with views engine.
app.use(express.static("public"))


app.get("/menu", function (req, res) {
  res.render('menu')
})

app.listen(process.env.PORT || 3000,
	() => console.log("Server is running..."));
