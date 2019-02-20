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
const Heap = require('heap');

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001))

app.enable('verbose errors')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(poweredByHandler)

// --- SNAKE LOGIC GOES BELOW THIS LINE ---
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

function avoidCollisions(move, { snakes }) {
  for (let i = 0; i < snakes.length; i++) {
    let snake = snakes[i].body;
    for (let j = 0; j < snake.length; j++) {
      if (samePoint(move, snake[j])) return false;
    }
  }
  return true;
}

// ID used as key to store node in reachedList object
function nodeID(node) {
  return `${node.x},${node.y}`;
}

function storeReachedNodes(list, node, route) {
  const id = nodeID(node);
  return list[id] = route;
}

function findReachedNodes(list, node) {
  const id = nodeID(node);
  return list[id];
}

// Return possible moves within board boundary
function getPossibleDirections(board, you, node) {
  const snakeHead = node;
  const moves = [
    { x: snakeHead.x, y: snakeHead.y + 1, move: 'down' },
    { x: snakeHead.x, y: snakeHead.y - 1, move: 'up' },
    { x: snakeHead.x + 1, y: snakeHead.y, move: 'right' },
    { x: snakeHead.x - 1, y: snakeHead.y, move: 'left' },
  ];

  return moves.filter((move) => {
    if (!insideGrid(move, board)) {
      return false;
    }

    if(!avoidCollisions(move, board)) {
      return false;
    }

    return move;
  });
}

// Implement A* pathfinding algorithm to find best route
function findRoute(board, you, target) {
  const snakeHead = you.body[0];
  const minHeap = new Heap((a, b) => a.score - b.score);       // smallest element will `pop()` first
  const reachedList = {};

  minHeap.push({ 
    route: [snakeHead], 
    score: distanceToTarget(snakeHead, target) 
  });
  reachedList[nodeID(snakeHead)] = [snakeHead];

  while (!minHeap.empty()) {
    let route = minHeap.pop().route;
    let endpoint = route[route.length - 1];

    if (samePoint(endpoint, target)) {
      return route;
    }

    let moves = getPossibleDirections(board, you, endpoint);
    moves.forEach((move) => {
      let newRoute = route.concat(move);
      let newScore = newRoute.length + distanceToTarget(move, target);

      let reachedNode = findReachedNodes(reachedList, move);
      if(!reachedNode || reachedNode.length > newRoute.length) {
        minHeap.push({
          route: newRoute,
          score: newScore
        });
        storeReachedNodes(reachedList, move, newRoute);
      }
    });
  }

  return null;
}

// find route to closest reachable food node via BFS
function findClosestFood(you, board) {
  const queue = [];
  const visited = [];

  queue.push({
    pos: you.body[0],
    route: []
  });

  while(queue.length) {
    let isVisited = false;
    let node = queue.shift();
    
    for(let i = 0; i < visited.length; i++) {
      if(samePoint(node.pos, visited[i])) {
        isVisited = true;
      }
    }

    if(isVisited) {
      continue;
    }
    visited.push(node.pos);

    for(let i = 0; i < board.food.length; i++) {
      if(samePoint(node.pos, board.food[i])) {
        return node.route;
      }
    }

    let moves = getPossibleDirections(board, you, node.pos);
    moves.forEach((move) => {
      queue.push({
        pos: move,
        route: node.route.concat(move)
      });
    });

  }
  return null;
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
  const target = findClosestFood(you, board);
  console.log(target);
  const move = target[0].move

  // // Response data
  const data = {
    move // one of: ['up','down','left','right']
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
