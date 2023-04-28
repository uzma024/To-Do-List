//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose=require("mongoose");
const _=require("lodash");
var dotenv = require('dotenv');
dotenv.config();
var url = process.env.MONGOLAB_URI

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(url,{useNewUrlParser: true});

const itemSchema = {
  name :String
}

const Item = mongoose.model("Item",itemSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit + to add items"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItem= [item1,item2,item3];

const listSchema={
  name:String,
  items: [itemSchema]
};

const List = mongoose.model("List",listSchema);

app.get("/", function(req, res) {
  // const day = date.getDate();
  Item.find({},function(err,foundItems){
    // console.log(foundItems);
    if(foundItems.length===0){
      Item.insertMany(defaultItem,function(err){
          if(err){
            console.log(err);
          }else{
            console.log("Successfully saved default items to  DB.");
          }
        })
        res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        const list = new List({
          name: customListName,
          items: defaultItem
        });
  
        list.save();
        res.redirect("/"+customListName);
      }else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  let listName = req.body.listName;
  if(listName){
    listName=listName.trim();
  }
  console.log(listName);

  const item = new Item({
    name: itemName
  });

  if(listName=="Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName},function(err,foundList){
      if(err){
        console.log(err);
      }else{
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+listName);
      }
    });
  }
});

app.post("/delete", function(req, res){
  let checkedItemId = req.body.checkbox;
  let listName = req.body.listName;
  if(checkedItemId){
    checkedItemId = checkedItemId.trim();
  }
  if(listName){
    listName = listName.trim();
  }
  if(listName==="Today"){
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(err){
        console.log(err);
      }else{
        console.log("Successfully deleted checked item");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name:listName},{$pull: {items:{_id:checkedItemId}}},function(err,foundList){
      if(err){
        console.log(err);
      }else{
        res.redirect("/"+listName);
      }
    });
  }
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

let port=process.env.PORT;
if(port==null || port==""){
  port=3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});
