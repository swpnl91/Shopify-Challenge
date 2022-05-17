const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const { response } = require("express");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/inventoryDB", {useNewUrlParser: true});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "⬅  Check this to delete an item."
});

const item2 = new Item({
  name: "Hit '➕' below to add a new item."
});

const defaultItems = [item1, item2];

const locationSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const Location = mongoose.model("Location", locationSchema);

app.get("/", function(req, res) {
  
  Item.find({}, function(err, foundItems) {
    if(foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("Successfully saved defaultItems to DB!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {locationTitle: "Toronto", newListItems: foundItems});
    }
  });
});









app.listen(3000, function() {
  console.log("Server listening on port 3000...");
});