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
const util = require('util');
const Heap = require('heap');

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001))

app.enable('verbose errors')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(poweredByHandler)

// --- SNAKE LOGIC GOES BELOW THIS LINE ---
function calcMove({ board, you }) {
  const snakeHead = you.body[0];

  const possibleMoves = getPossibleMoves(board, you);
  const target = findShortestPath(snakeHead, board.food);               // find closest food node
  const nextMove = findShortestPath(target, possibleMoves);             // find move resulting in shortest path to get to target node
  
  const xDir = snakeHead.x - nextMove.x;                                // determine x direction (left/right)
  const yDir = snakeHead.y - nextMove.y;                                // determine y direction (up/down)

  if (xDir > 0) return 'left';
  if (xDir < 0) return 'right';
  if (yDir > 0) return 'up';
  if (yDir < 0) return 'down';
}

function samePoint(pointA, pointB) {
  return pointA.x === pointB.x && pointA.y === pointB.y;
}

// Remove moves that fall outside of board (grid) boundaries
function insideGrid(move, { height, width }) {
  return move.x >= 0 && move.x < width && move.y >= 0 && move.y < height;
}

function distanceToTarget(self, target) {
  return Math.abs(self.x - target.x) + Math.abs(self.y - target.y);
}

// Return possible moves within board boundary
function getPossibleDirections(board, you) {
  const snakeHead = you.body[0];
  const moves = [
    { x: snakeHead.x, y: snakeHead.y + 1 },
    { x: snakeHead.x, y: snakeHead.y - 1 },
    { x: snakeHead.x + 1, y: snakeHead.y },
    { x: snakeHead.x - 1, y: snakeHead.y },
  ];

  return moves.filter((move) => insideGrid(move, board) ? move : false );
}

function avoidCollisions(move, snake) {
  for (let i = 0; i < snake.length; i++) {
    let isSamePoint = samePoint(move, snake[i]);
    if (isSamePoint) return false;
  }
  return true;
}

function getOtherSnakes({ snakes }, { body: self}) {
  return snakes.filter((snake) => {
    if (!util.isDeepStrictEqual(self, snake.body)) return snake;
  });
}

function getPossibleMoves(board, you) {
  const otherSnakes = getOtherSnakes(board, you);
  const moves = getPossibleDirections(board, you);
  
  return moves.filter((move) => {
    // Remove moves that would result in self-collisions
    const avoidSelf = avoidCollisions(move, you.body);
    if (!avoidSelf) return false;

    // Remove moves that would result in collisions with other snakes
    for (let i = 0; i < otherSnakes.length; i++) {
      let avoidOtherSnakes = avoidCollisions(move, otherSnakes[i].body);
      if (!avoidOtherSnakes) return false;
    }
    
    return move;
  });
}

function findShortestPath(snakeHead, arr) {
  const distances = arr.map((item) => distanceToTarget(snakeHead, item));

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
