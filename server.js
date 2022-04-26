const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()
const mongoose = require('mongoose')

const {Schema} = mongoose;
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser:true}, {useUnifiedTopology:true})
const personSchema = new Schema({username: {type:String, unique:true}});
const People = mongoose.model("People", personSchema);
const ecerciseSchema = new Schema({userId:String, description:String, duration:Number, date:Date});
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
      res.json({"username": data.username, "_id": data.id});
    }
    
  })
  
})


app.post("/api/users/:_id/exercises", (req, res)=>{
 //return res.json({"data": req.body})
  const {_id:userId, description, duration, date} = req.body;
  //return res.json({"data": userId})
  if(!date){
    date = new Date();
  }

  People.findById(userId, (err,data)=>{
    if(!data){
      res.send("Unknown Id")
    }else{
      const username = data.username;
      const newExercise = new Exercise({userId, description, duration, date})
      newExercise.save((err,data)=>{
        //res.json({userId, username, description, data})
        res.json({username, description, duration: +duration, userId, date: new Date(date).toDateString()})
      })
    }
  })
  //res.json({"request": req.body})
})


app.get("/api/users/:_id/logs", (req, res)=>{
  const {_id:userId} = req.params;
  const {from, to, limit} =req.query;
  //res.send( limit)
  People.findById(userId, (err, data)=>{
    if(!data){
      res.send("Unknow userId");
    }else{
      const username = data.username;
      Exercise.find({userId}, {date:{$gte: new Date(from), $lte: new Date(to)}})
      .select(["id", "description", "duration", "date"]).limit(+limit)
      .exec((err, data)=>{
        let customdata = data.map(exer=>{
          let dateFormatted = new Date(exer.date).toDateString();
          return {id:exer.id, description: exer.description, duration: exer.duration, date: dateFormatted}
        })

        if(!data){
          res.json({
            "userId": userId,
            "username": username,
            "count": 0,
            "log":[]
          })
        }else{
          res.json({
            "userId": userId,
            "username": username,
            "count": data.length,
            "log":customdata
          })
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
