const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



app.use(bodyParser.urlencoded({ extended: false }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// models
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true }
});

User = mongoose.model('User', userSchema);

const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true }
});

Exercise = mongoose.model('Exercise', exerciseSchema);

// POST endpoint to create new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  try {
    const newUser = new User({ username: username });
    const savedUser = await newUser.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

// GET endpoint to retrieve all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving users' });
  }
});

// POST endpoint to add exercise to user
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const exerciseDate = date ? new Date(date) : new Date();
    const newExercise = new Exercise({
      userId: _id,
      description,
      duration: parseInt(duration),
      date: exerciseDate.toDateString()
    });

    const savedExercise = await newExercise.save();
    res.json({
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date,
      _id: user._id
    });
  } catch (err) {
    res.status(500).json({ error: 'Error adding exercise' });
  }
});

// GET endpoint to retrieve user logs
app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query = { userId: _id };
    if (from) {
      query.date = { ...query.date, $gte: new Date(from).toDateString() };
    }
    if (to) {
      query.date = { ...query.date, $lte: new Date(to).toDateString() };
    }

    const exercises = await Exercise.find(query)
      .limit(parseInt(limit))
      .exec();

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: exercises.map(ex => ({
        description: ex.description,
        duration: ex.duration,
        date: ex.date
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving logs' });
  }
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
