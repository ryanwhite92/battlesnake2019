const util = require('util');
const Heap = require('heap');

function samePoint(pointA, pointB) {
  return pointA.x === pointB.x && pointA.y === pointB.y;
}

// Remove moves that fall outside of board (grid) boundaries
function insideGrid(move, { height, width }) {
  return move.x >= 0 && move.x < width && move.y >= 0 && move.y < height;
}

function avoidCollisions(move, { snakes }) {
  for (let i = 0; i < snakes.length; i++) {
    let snake = snakes[i].body;
    for (let j = 0; j < snake.length - 1; j++) {    // doesn't check snake tail node, since tail will not be in that location next turn (unless snake ate - need to check)
      if (samePoint(move, snake[j])) return false;
    }
  }
  return true;
}

// Return possible moves within board boundary
function getPossibleMoves(board, node) {
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

// Manhattan heuristic for A*
function distanceToTarget(self, target) {
  return Math.abs(self.x - target.x) + Math.abs(self.y - target.y);
}

// ID used as key to store node in reached object
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

// Implement A* pathfinding algorithm to find best route
function findRoute(board, snake, target) {
  const snakeHead = snake.body[0];
  const minHeap = new Heap((a, b) => a.score - b.score);       // smallest element will `pop()` first
  const reached = {};

  minHeap.push({ 
    route: [], 
    score: distanceToTarget(snakeHead, target) 
  });
  reached[nodeID(snakeHead)] = [];

  while (!minHeap.empty()) {
    let route = minHeap.pop().route;
    let endpoint = route[route.length - 1] || snakeHead;
    
    if (samePoint(endpoint, target)) {
      return route;
    }

    let moves = getPossibleMoves(board, endpoint);
    moves.forEach((move) => {
      let newRoute = route.concat(move);
      let newScore = newRoute.length + distanceToTarget(move, target);

      let reachedNode = findReachedNodes(reached, move);
      if(!reachedNode || reachedNode.length > newRoute.length) {
        minHeap.push({
          route: newRoute,
          score: newScore
        });
        storeReachedNodes(reached, move, newRoute);
      }
    });
    // return longest route
    if(minHeap.empty()) {
      return route;
    }
  }

  return null;
}

function closestToFood(board, you, target) {
  const enemySnakes = board.snakes.filter((snake) => {
    return !util.isDeepStrictEqual(you.body, snake.body) ? snake : false;
  });

  let path = findRoute(board, you, target);
  for(let i = 0; i < enemySnakes.length; i++) {
    let enemyPath = findRoute(board, enemySnakes[i], target);
    if(!enemyPath) continue;
    if(enemyPath.length <= path.length && you.body.length < enemySnakes[i].body.length) {
      return false;
    }
  }
  return path;
}

// returns the closest food node
function findClosestFood(board, you) {
  const foodArr = board.food;
  let bestPath = null;

  foodArr.forEach((food) => {
    const path = findRoute(board, you, food);
    if(!path) return;
    if(!bestPath || path.length < bestPath.length) {
      bestPath = path;
    }
  });

  return (bestPath) ? bestPath[bestPath.length - 1] : null;
}

module.exports = {
  findRoute,
  findClosestFood,
  getPossibleMoves,
  closestToFood
};
