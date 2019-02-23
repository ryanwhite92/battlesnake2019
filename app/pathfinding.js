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
function findRoute(board, you, target) {
  const snakeHead = you.body[0];
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

    let moves = getPossibleDirections(board, you, endpoint);
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

module.exports = {
  findRoute,
  findClosestFood
};
