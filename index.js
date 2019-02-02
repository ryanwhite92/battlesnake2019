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
function calcMove({ board: { width, height, food }, you: { body }}) {
  const snakeHead = body[0];
  const moves = [
    { x: snakeHead.x, y: snakeHead.y + 1 },
    { x: snakeHead.x, y: snakeHead.y - 1 },
    { x: snakeHead.x + 1, y: snakeHead.y },
    { x: snakeHead.x - 1, y: snakeHead.y },
  ];
  const possibleMoves = moves.filter((move) => {
    if (move.x < 0 || move.x >= width || move.y < 0 || move.y >= height) {
      return false;
    }

    // check that snake won't collide w/ its own tail
    for (let i = 1; i < body.length; i++) {
      if (move.x == body[i].x && move.y == body[i].y) {
        return false;
      }
    }
    
    return move;
  });

  const target = findShortestPath(snakeHead, food);           // find closest food node
  const nextMove = findShortestPath(target, possibleMoves);   // find move resulting in shortest path to get to target node
  
  const xDir = snakeHead.x - nextMove.x;                      // determine x direction (left/right)
  const yDir = snakeHead.y - nextMove.y;                      // determine y direction (up/down)

  if (xDir > 0) return 'left';
  if (xDir < 0) return 'right';
  if (yDir > 0) return 'up';
  if (yDir < 0) return 'down';
}

function findShortestPath(snakeHead, arr) {
  const distances = arr.map((item) => {
    return Math.abs(snakeHead.x - item.x) + Math.abs(snakeHead.y - item.y);
  });

  let min = null;
  for(let i = 0; i <= distances.length; i++) {
    if (min === null || distances[i] < min) {
      min = distances[i];
    }
  }

  const idx = distances.indexOf(min);
  return arr[idx];
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
