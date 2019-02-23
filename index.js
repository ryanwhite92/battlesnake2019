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
const pathfinding = require('./app/pathfinding');

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001))

app.enable('verbose errors')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(poweredByHandler)

// --- SNAKE LOGIC GOES BELOW THIS LINE ---
function foodPath(board, you) {
  return pathfinding.findClosestFood(board, you);
}

// Last resort to stay alive
function survive(board, you) {
  const snakeHead = you.body[0];
  return pathfinding.getPossibleMoves(board, snakeHead);
}

function chaseTail(board, you) {
  const tail = you.body[you.body.length - 1];
  return pathfinding.findRoute(board, you, tail);
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
  const { board, you } = request.body;
  let target = null;

  if (you.health > 50) {
    target = chaseTail(board, you);
  } 

  if(!target || you.health <= 50) {
    target = foodPath(board, you);
  }

  if(!target) {
    target = survive(board, you);
  }

  console.log('target', target);
  const move = target[0].move;

  // // Response data
  const data = {
    move // one of: ['up','down','left','right']
  };

  return response.json(data);
});

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
