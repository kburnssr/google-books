var express = require("express");
var mongojs = require("mongojs");
var bodyParser = require('body-parser');
var request = require('request');
var PORT = process.env.PORT || 3001;
var app = express();
var path = require("path");
// set the app up with bodyparser
app.use(bodyParser());
// Database configuration
var databaseUrl = process.env.MONGODB_URI || "books_db";
var collections = ["books"];
// Hook mongojs config to db variable
var db = mongojs(databaseUrl, collections);
// Log any mongojs errors to console
db.on("error", function (error) {
    console.log("Database Error:", error);
});
//allow the api to be accessed by other apps
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
    next();
});
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "./client/build")))
};
if (process.env.NODE_ENV === "production") {
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "./client/build/index.html"))
    })
}
app.get("/getBookInfo", (req, res) => {
    let book = req.query.book
    // console.log(book)
    request('https://www.googleapis.com/books/v1/volumes?q=' + book + "&projection=full&filter=ebooks", function (error, response, body) {
        if (error) {
            console.log(error)
            res.json({ error: true })
        } 
        // console.log("returning book information")
            res.json(JSON.parse(body))
    });
});
app.post("/saveBook", (req, res) => {
    console.log("SAVING THIS BOOK:", req.body.saved_book)
    var valid = true;
    if (valid) {
        let saved_book = req.body.saved_book;
        if (saved_book.link && saved_book.price) {
            let title = saved_book.title;
            let img = saved_book.img;
            let description = saved_book.description;
            let authors = saved_book.authors;
            let price = saved_book.price;
            let link = saved_book.link;
           let id = saved_book.id
            db.collection("books").update(
               { id },
               { $set: { title, img, description, authors, price, link, id }},
               { upsert: true },
                function(error,doc){
                    if(error){
                        console.log("ERROR:", error)
                    }
                    console.log("SAVED BOOK:", doc)
                }
            );
        } else {
            let title = saved_book.title;
            let img = saved_book.img;
            let description = saved_book.description;
           let id = saved_book.id
            let authors = saved_book.authors;
            db.collection("books").update(
              { id },
              { $set:  { title, img, description, authors, id }},
               { upsert: true },
                function(error,doc){
                    if(error){
                        console.log("ERROR:", error)
                    }
                    console.log("SAVED BOOK:", doc)
                }
            );
        }
    } else {
        res.json({
            error: 'data was not valid'
        })
    }
})
app.get("/getBooks", function (req, res) {
    db.collection("books").find(function (error, books) {
        if (error) {
            res.send(error)
        } else {
            res.send(books)
        }
    })
})
app.post("/deleteBook", (req, res) => {
    let id = req.body.id
    // console.log(id)
    db.collection("books").remove({
        "_id": mongojs.ObjectID(id)
    }, function (error, removed) {
        if (error) {
            res.send(error);
        } else {
            res.json(id);
        }
    });
})
// Listen on port 3001
app.listen(PORT, function () {
    console.log('🌎 ==> Now listening on PORT %s! Visit http://localhost:%s in your browser!', PORT, PORT);
});