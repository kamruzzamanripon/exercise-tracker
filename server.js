const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()
const mongoose = require('mongoose')

const {Schema} = mongoose;
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser:true}, {useUnifiedTopology:true})
const personSchema = new Schema(
  {username: {type:String, unique:true}}
  );
const People = mongoose.model("People", personSchema);
const ecerciseSchema = new Schema({
  userId:{type: String, required:true},
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model("Exercise", ecerciseSchema)

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", (req, res)=>{
  const newPerson = new People({username: req.body.username});
  newPerson.save((err, data)=>{
    if(err){
      res.json("Username already taken");
    }else{
      res.json(data);
    }
    
  })
  
})


// app.post("/api/users/:_id/exercises", (req, res)=>{
//  //return res.json({"data": req.body})
//   const {_id:userId, description, duration, date} = req.body;
//   let payload = req.body;
//   //return res.json({"data": req.body})
//   if(!date){
//     date = new Date();
//   }

//   People.findById(userId, (err,data)=>{
//     if(!data){
//       res.send("Unknown Id")
//     }else{
//       const username = data.username;
//       const newExercise = new Exercise({userId, description, duration, date})
//       newExercise.save((err,data)=>{
//         //res.json({userId, username, description, data})
//         let dateFormatted = new Date(date).toDateString();
//         res.json({username, description, duration: +duration, _id:userId, date: dateFormatted})
//       })
//     }
//   })
//   //res.json({"request": req.body})
// })

app.post("/api/users/:_id/exercises", (req, res)=>{
  const {_id:id} = req.params;
  const {description, duration, date} =req.body;
  People.findById(id, (err, userData)=>{
    if(err || !userData){
      res.send("Could not find user")
    }else{
      const newExercise = new Exercise({
        userId: id,
        description,
        duration,
        date: new Date(date)
      })
      newExercise.save((err, data)=>{
        if(err || !data){
          res.send("There was an error saving this exercise")
        }else{
          const {description, duration, date, _id} = data;
          //return res.send({"data": data})
          let dateFormatted = new Date(date).toDateString();
          res.json({
            username: userData.username,
            description,
            duration, 
            date: date.toDateString(),
            _id: userData.id
          })
        }
      })
    }
  })
})


app.get("/api/users/:_id/logs", (req, res)=>{
  const {_id:id} = req.params;
  const {from, to, limit} =req.query;
  //res.send( limit)
  People.findById(id, (err, userData)=>{
    if(err || !userData){
      res.send("Unknow user");
    }else{
      let dateObj = {};
      if(from){
        dateObj["$gte"] = new Date(from)
      }
      if(to){
        dateObj["$lte"] = new Date(to)
      }
      let filter = {
        userId: id
      }
      if(from || to){
        filter.date = dateObj;
      }
      let nonNullLimit = limit ?? 500
      Exercise.find(filter).limit(+nonNullLimit).exec((err, data)=>{
        if(err || !data){
          res.json([])
        }else{
          const count = data.length
          const rawLog = data
          const {username, _id} = userData;
          const log = rawLog.map((l)=>({
            description: l.description,
            duration: l.duration,
            date:  new Date(l.date).toDateString()
          }))
          res.json({username, count, _id, log})
        }
      })
    }
  })
})


app.get("/api/users", (req, res)=>{
  People.find({}, (err, data)=>{
    if(!data){
      res.send("No users")
    }else{
      res.json(data)
    }
  })
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
