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
  res.render("home");
});

app.get("/:customLocationName", function(req, res) {
  
  const customLocationName = _.capitalize(req.params.customLocationName);

  if(customLocationName === "Locations") {
    Location.find({}, function(err, foundLocations) {
      if(err) {
        console.log(err);
      } else {
        const array = [];
        for(const location of foundLocations) {
          array.push(location.name);
        }
        const distinctLocations = [...new Set(array)];
        res.render("locations", {locationsArray: distinctLocations});
      }
    });
  } else {
    Location.findOne({name: customLocationName}, function(err, foundLocation) {   // foundLocaton gives you the object with 'name'/'items' properties
      if(err) {
        console.log(err);
      } else {
        console.log("foundLocation  -  " + foundLocation);

        if(foundLocation === null) {      // Got to be careful while checking whether something equals null/undefined
          
          // Location.find({}, function(err, found) {
          //   if(err) {
          //     console.log(err);
          //   } else {
          //     if(found.length === 0) {
          //       setTimeout(function() {

          //         const location = new Location({
          //           name: customLocationName,
          //           items: defaultItems
          //         });
          //         location.save();
          //         res.redirect("/" + customLocationName);
        
          //       }, 1000);
          //     }
          //   }
          // });

          setTimeout(function() {

            const location = new Location({
              name: customLocationName,
              items: defaultItems
            });
            location.save();
            res.redirect("/" + customLocationName);
  
          }, 1000);

        } else {
          // Location.find({name: customLocationName}, function(err, duplicates) {
          //   if(duplicates.length > 1) {
          //     Location.findOneAndUpdate({name: customLocationName}, {$pull: {name: customLocationName}}, function(err, found) {
          //       console.log(found);
          //     });
          //   }
          // });
          res.render("list", {locationTitle: foundLocation.name, newListItems: foundLocation.items});
        }
      }
    });
  }
});

app.post("/", function(req, res) {

  if(req.body.newItem === "" || req.body.locationName === "") {
    res.render("error");
  } else {
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
  }
});

app.post("/delete", function(req, res) {
  const checkedItemID = req.body.checkbox;
  const locationName = req.body.locationDelete;     // locationDelete comes from list.ejs 1st <form>

  const locationToDelete = req.body.locationToDelete;

  if(locationToDelete) {
    Location.deleteOne({name: locationToDelete}, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("Successfully deleted");
        Location.find({}, function(err, foundLocations) {
          if(err) {
            console.log(err);
          } else {
            let array = [];
            for(const location of foundLocations) {
              array.push(location.name);
            }
            const distinctLocations = [...new Set(array)];
            res.render("locations", {locationsArray: distinctLocations});
          }
        });
      }
    });
  } else {
    Location.findOneAndUpdate({name: locationName}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundLocation) {
      if (!err) {
        res.redirect("/" + locationName);
      } else {
        console.log(err);
      }
    });
  }
  
  // if(locationName === "Example") {
  //   Item.findByIdAndRemove(checkedItemID, function(err) {
  //     if(err) {
  //       console.log(err);
  //     } else {
  //       console.log("Successfully deleted");
  //       res.redirect("/");
  //     }
  //   });
  // } else {
  //   Location.findOneAndUpdate({name: locationName}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundLocation) {
  //     if (!err) {
  //       res.redirect("/" + locationName);
  //     } else {
  //       console.log(err);
  //     }
  //   });
  // }
});

app.post("/edit/:itemName", function(req, res) {
  const name = req.params.itemName;
  const location = req.body.editedItem;
  const itemId = req.body.itemId;

  res.render('edit', {oldItem: name, locationName: location, itemId: itemId});
});

app.post("/:location", function(req, res) {
  const location = req.params.location;
  const newItem = req.body.newValue;
  const oldItem = req.body.oldValue;
  const itemId = req.body.itemId;

  if(location === "Example") {
    Item.findOne({name: oldItem}, function(err, foundItem) {
      if(err) {
        console.log(err);
      } else {
        const id = foundItem._id;
        Item.findByIdAndUpdate(id, {$set: {name: newItem}}, function(err) {
          if(err) {
            console.log(err);
          } else {
            console.log("Successfully edited");
            res.redirect("/");
          }
        }); 
      }
    });
  } else {

    Location.findOne({name: location}, function(err, foundItem) {
      if(err) {
        console.log(err);
      } else {
        const id = foundItem._id;  // location id
        const query = {"_id": id,
          "items._id": itemId
        }
        Location.findOneAndUpdate(query, {$set: {"items.$.name": newItem }}, function(err, found) {
          
          if(err) {
            console.log(err);
          } else {
            res.redirect(`/${location}`);
          }
        }); 
      }
    });
  }
});

app.listen(3000, function() {
  console.log("Server listening on port 3000...");
});