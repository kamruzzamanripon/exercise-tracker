const express = require('express')
const bodyParser = require('body-parser')
const mongoose  = require('mongoose')
const app = express()
const cors = require('cors')
require('dotenv').config()

// Basic Configuration
const port = process.env.PORT || 3000;

//Database Config
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//Database Model 
const Tracker = require('./models/exerciseData');

app.use(cors())

//Middleware
app.use(bodyParser.urlencoded({extended: false}))

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let newUserResponseObject = {}

//New User End Point

app.post('/api/users', function(req, res){
  const username = req.body['username'];
  // console.log(username)
  newUserResponseObject['username'] = username;
  Tracker.create({username})
  .then(function(dbtracker){
    newUserResponseObject['_id'] = dbtracker['_id'];
    res.json(newUserResponseObject);
    console.log(dbtracker);
  })
  .catch(function(err){
    console.log(err);
  })

});


//Add Exercises Endpoint

app.post('/api/users/:_id/exercises',function(req, res){
  const _id = req.params['_id'];
  var duration = parseInt(req.body['duration']);
  var description = req.body['description'];
  var date = req.body['date'];
  // console.log(date)
  if(Date.parse(date)){
    date = new Date(date).toISOString().substring(0,10);
  }else{
    date = new Date().toISOString().substring(0,10);
  }
  
  var exerciseObj = {
    description,
    duration,
    date:new Date(date).toDateString()
  }

 

  Tracker.findOneAndUpdate({_id:_id},
  {
    $push: {
      log: exerciseObj
    }
  },
  {new: true},
  (err, updatedUser)=>{
    let responseObj = {}
    if(!err && updatedUser != undefined){
      responseObj['_id'] = updatedUser._id
      responseObj['username'] = updatedUser.username
      responseObj['date'] = exerciseObj.date
      responseObj['description'] = exerciseObj.description
      responseObj['duration'] = exerciseObj.duration
    }
    res.json(responseObj)

  })
});



//get /api/users/:_id/logs
app.get('/api/users/:_id/logs', function(req, res){
  const _id = req.params['_id'];
  let responseObject={} ;
  Tracker.findById(_id, (err, result)=>{
    if(!err && result != undefined){
      // console.log('Result: ', result)
      responseObject['username'] = result.username;
      responseObject['count'] = result.log.length;
      responseObject['_id'] = result._id;
      responseObject['log'] = result.log;
    }

    if(req.query.from || req.query.to){
      let fromDate = new Date(0);
      let toDate = new Date();

      if(req.query.from){
        if(Date.parse(req.query.from)){
          fromDate = new Date(req.query.from);
        }
      }

      if(req.query.to){
        if(Date.parse(req.query.to)){
          toDate = new Date(req.query.to);
        }
      }

      fromDate = fromDate.getTime();
      toDate = toDate.getTime();

      responseObject.log = responseObject.log.filter(entry=>{
        let entryDate = new Date(entry.date).getTime();

        return entryDate >= fromDate && entryDate <= toDate;
      })
      
    }
    
    if(req.query.limit){
      responseObject.log = responseObject.log.slice(0,req.query.limit);
    }
    
    // console.log('Response: ', responseObject);
    res.json(responseObject)
  })
  
});

//

//get /api/users

app.get('/api/users', function(req,res){
  Tracker.find({}, function(err, users){
    if(!err){
      res.json(users)
    }
  })
});







const listener = app.listen(port, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
