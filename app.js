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

// Creating schemas and collections for DB

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const defaultItems = [];  // creating an empty array so that it can be assigned to 'items' property of the newly created Location and it won't have its value as null

const locationSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const Location = mongoose.model("Location", locationSchema);

// ROUTES

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {    // foundItems gives you back the array of items
    res.render("list", {locationTitle: "Example", newListItems: foundItems});
  });
});

app.get("/:customLocationName", function(req, res) {
  
  const customLocationName = _.capitalize(req.params.customLocationName);

  Location.findOne({name: customLocationName}, function(err, foundLocation) {   // foundLocaton gives you the object with 'name'/'items' properties
    if(err) {
      console.log(err);
    } else {
      if(foundLocation === null) {      // Got to be careful while checking whether something equals null/undefined
        const location = new Location({
          name: customLocationName,
          items: defaultItems
        });
        location.save();
        res.redirect("/" + customLocationName);
      } else {
        res.render("list", {locationTitle: foundLocation.name, newListItems: foundLocation.items});
      }
    }
  });
});

app.post("/", function(req, res) {

  if(req.body.newItem === undefined) {     // Got to be careful while checking whether something equals null/undefined
    const customLocationName = req.body.locationName; // locationName comes from header.ejs
    res.redirect("/" + customLocationName); 
  } 
  if(req.body.locationName === undefined) {
    
    const itemName = req.body.newItem;     // newItem comes from list.ejs 2nd <form>
    const locationName = req.body.location;   // location comes from list.ejs 2nd <form>

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
        res.render("list", {locationTitle: foundLocation.name, newListItems: foundLocation.items});
      });
    }
  }
});








app.listen(3000, function() {
  console.log("Server listening on port 3000...");
});