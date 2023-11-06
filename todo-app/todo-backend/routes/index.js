const express = require('express');
const router = express.Router();

const configs = require('../util/config')
const redis = require('../redis')
const { getAsync } = require('../redis/index')

let visits = 0

/* GET index data. */
router.get('/', async (req, res) => {
  visits++

  res.send({
    ...configs,
    visits
  });
});

router.get('/statics', async (req, res) => {
  const value = await getAsync('added_todos')
  res.json({ added_todos: value || 0 });
});

module.exports = router;
