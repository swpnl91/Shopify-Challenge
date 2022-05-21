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

const defaultItems = [];  // Creating an empty array so that it can be assigned to 'items' property of the newly created Location and it won't have its value as null.

const locationSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const Location = mongoose.model("Location", locationSchema);


// ROUTES

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/:customLocationName", function(req, res) {
  
  const customLocationName = _.capitalize(req.params.customLocationName);

  if(customLocationName === "Locations") {     // This condition handles the rendering of the list of lcations.
    Location.find({}, function(err, foundLocations) {   // foundLocations is an array of objects. This query returns all the location objects.
      if(err) {
        console.log(err);
      } else {
        const array = [];
        for(const location of foundLocations) {
          array.push(location.name);
        }
        const distinctLocations = [...new Set(array)];   // ES6-specific way of removing duplicate items in an array.
        res.render("locations", {locationsArray: distinctLocations});
      }
    });
  } else {       // The else part handles the saving of the location
    Location.findOne({name: customLocationName}, function(err, foundLocation) {   // foundLocaton gives you a matched object with 'name' & 'items' as properties.
      if(err) {
        console.log(err);
      } else {
        if(foundLocation === null) {      // This condition accounts for when the location doesn't exist. Got to be careful while checking whether something equals null/undefined.
          
          /////////////// Temporary solution to avoid creating multiple entries of a specific location. Still creates 2 entries though!
          setTimeout(function() {
            const location = new Location({
              name: customLocationName,
              items: defaultItems
            });
            location.save();
            res.redirect("/" + customLocationName);
          }, 1000);

        } else {
          res.render("list", {locationTitle: foundLocation.name, newListItems: foundLocation.items});
        }
      }
    });
  }
});

app.post("/", function(req, res) {

  if(req.body.newItem === "" || req.body.locationName === "") {    // This condition accounts for when the input field is left blank and the form is submitted.
    res.render("error");
  } else {
    if(req.body.newItem === undefined) {     // Got to be careful while checking whether something equals null/undefined.
      if(req.body.locationName.trim() === "") {    // This condition accounts for when the input field has only spaces and the form is submitted.
        res.render("error");
      } else {
        const customLocationName = req.body.locationName; // locationName comes from header.ejs
        res.redirect("/" + customLocationName); 
      } 
    } 
    if(req.body.locationName === undefined) {
      if(req.body.newItem.trim() === "") {
        res.render("error");
      } else {
        const itemName = req.body.newItem;     // newItem comes from list.ejs 3rd <form>
        const locationName = req.body.location;   // location comes from list.ejs 3rd <form>
        const item = new Item ({
          name: itemName
        });
        Location.findOne({name: locationName}, function(err, foundLocation){
          if(err) {
            console.log(err);
          } else {
            foundLocation.items.push(item);
            foundLocation.save();
            res.render("list", {locationTitle: foundLocation.name, newListItems: foundLocation.items});
          }
        });
      }
    }
  }
});

app.post("/delete", function(req, res) {
  const checkedItemID = req.body.checkbox;          // checkbox comes from list.ejs 2nd <form>
  const locationName = req.body.locationDelete;     // locationDelete comes from list.ejs 2nd <form>

  const locationToDelete = req.body.locationToDelete;   // locationToDelete comes from locations.ejs 1st <form>

  if(locationToDelete) {    // This condition handles if there is a request to delete a location from the list of locations.
    Location.deleteOne({name: locationToDelete}, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("Successfully deleted");
        Location.find({}, function(err, foundLocations) {   // This part renders the whole locations list
          if(err) {
            console.log(err);
          } else {
            let array = [];
            for(const location of foundLocations) {
              array.push(location.name);
            }
            const distinctLocations = [...new Set(array)];   // To remove the multiple entries that get created.
            res.render("locations", {locationsArray: distinctLocations});
          }
        });
      }
    });
  } else {
    // This handles the deletion of a particular item at a given location
    Location.findOneAndUpdate({name: locationName}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundLocation) {
      if (!err) {
        res.redirect("/" + locationName);
      } else {
        console.log(err);
      }
    });
  }
});

app.post("/edit/:itemName", function(req, res) {
  const name = req.params.itemName;   // Comes from the url.
  const location = req.body.editedLocation;  // Comes from list.ejs 1st <form>
  const itemId = req.body.itemId;  // Comes from list.ejs 1st <form>

  res.render('edit', {oldItem: name, locationName: location, itemId: itemId});
});

app.post("/:location", function(req, res) {
  const location = req.params.location;   // Comes from the url.
  const newItem = req.body.newValue;   // Comes from edit.ejs
  const oldItem = req.body.oldValue;   // Comes from edit.ejs
  const itemId = req.body.itemId;      // Comes from edit.ejs

  Location.findOne({name: location}, function(err, foundItem) {  //  foundItem is the matched object
    if(err) {
      console.log(err);
    } else {
      const id = foundItem._id;  // location id
      const query = {"_id": id,
        "items._id": itemId
      }
      Location.findOneAndUpdate(query, {$set: {"items.$.name": newItem }}, function(err, found) {    // 'items.$.name' checks the name property of objects inside the 'items' array.
        if(err) {
          console.log(err);
        } else {
          res.redirect(`/${location}`);
        }
      }); 
    }
  });
});

app.listen(3000, function() {
  console.log("Server listening on port 3000...");
});