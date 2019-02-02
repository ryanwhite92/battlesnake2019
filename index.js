const bodyParser = require('body-parser')
const express = require('express')
const logger = require('morgan')
const app = express()
const {
  fallbackHandler,
  notFoundHandler,
  genericErrorHandler,
  poweredByHandler
} = require('./handlers.js')

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001))

app.enable('verbose errors')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(poweredByHandler)

// --- SNAKE LOGIC GOES BELOW THIS LINE ---
function calcMove({ board: { food }, you: { body }}) {
  const snakeHead = body[0];
  const target = findClosestFood(snakeHead, food);
  
  return 'up';
}

function findClosestFood(snakeHead, food) {
  const distances = food.map((food) => {
    return Math.abs((snakeHead.x - food.x) + (snakeHead.y - food.y));
  });

  let min = null;
  for(let i = 0; i <= distances.length; i++) {
    if (min === null || distances[i] < min) {
      min = distances[i];
    }
  }
  const idx = distances.indexOf(min);
  return food[idx];
}

// Handle POST request to '/start'
app.post('/start', (request, response) => {
  // NOTE: Do something here to start the game

  // Response data
  const data = {
    color: '#DFFF00',
  }

  return response.json(data)
})

// Handle POST request to '/move'
app.post('/move', (request, response) => {
  // NOTE: Do something here to generate your move
  const nextMove = calcMove(request.body);
  
  // Response data
  const data = {
    move: nextMove // one of: ['up','down','left','right']
  }

  return response.json(data)
})

app.post('/end', (request, response) => {
  // NOTE: Any cleanup when a game is complete.
  return response.json({})
})

app.post('/ping', (request, response) => {
  // Used for checking if this snake is still alive.
  return response.json({});
})

// --- SNAKE LOGIC GOES ABOVE THIS LINE ---

app.use('*', fallbackHandler)
app.use(notFoundHandler)
app.use(genericErrorHandler)

app.listen(app.get('port'), () => {
  console.log('Server listening on port %s', app.get('port'))
})
