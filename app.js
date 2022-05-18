const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");

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
  name: "⬅  Check this box to delete an item."
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
      res.render("list", {locationTitle: "Example", newListItems: foundItems});
    }
  });
});

app.get("/:customLocationName", function(req, res) {
  const customLocationName = _.capitalize(req.params.customLocationName);

  Location.findOne({name: customLocationName}, function(err, foundLocation) {
    if(!err) {
      if(!foundLocation) {
        const location = new Location({
          name: customLocationName,
          items: defaultItems
        });
        location.save();
        res.redirect("/" + customLocationName);
      } else {
        res.render("list", {locationTitle: foundLocation.name, newListItems: foundLocation.items});
      }
    } else {
      console.log(err);
    }
  });
});

app.post("/:customLocationName", function(req, res) {
  if(req.body.locationName) {
    const customLocationName = req.body.locationName;
    if(customLocationName === "Example") {
      res.redirect("/");
    } else {
      res.redirect("/" + customLocationName);
    }
  } else {
    const itemName = req.body.newItem;
    const locationName = req.body.location;

    const item = new Item ({
      name: itemName
    });

    if(locationName === "Example") {
      item.save();
      res.redirect("/");
    } else {
      Location.findOne({name: locationName}, function(eror, foundLocation){
        foundLocation.items.push(item);
        foundLocation.save();
        res.redirect("/" + locationName);
      });
    }
  }
});








app.listen(3000, function() {
  console.log("Server listening on port 3000...");
});