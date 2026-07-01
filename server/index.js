const express = require('express')
const morgan = require('morgan');
const cors = require('cors');

require('dotenv').config()

const app = express()
const port = process.env.PORT || 3000;

app.use(cors({ 
  credentials: true,
  origin: process.env.ORIGIN,
}));
app.use(morgan('common'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
