import React, { useEffect, useRef, useCallback, useState } from "react";

// Color palette
const COLORS = {
  primary: "#22223b",     // Play area
  secondary: "#4a4e69",   // Sidebar
  accent: "#f2e9e4",      // Highlights and blocks
  blockColors: [
    "#f2e9e4", // light (accent)
    "#e07a5f", // orange-red
    "#3d405b", // dark blue
    "#81b29a", // green
    "#f4a261", // orange
    "#556b2f", // olive
    "#9a8c98", // purple / muted
    "#4a4e69"  // sidebar color
  ]
};

/*
  To make the UI more compact:
    - Reduce BOARD block size and board area dimension
    - Shrink sidebar padding/gaps, and fonts
    - Reduce main title/subtitle size
    - Make controls more compact and slightly smaller
    - Adjust margins and gaps
    - Ensure everything fits in ~720-800px vertical height, ~1024px width

  Adjust as necessary in styles below.
*/

// Tetris constants (Reduced for compact UI)
const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 21; // px, was 28
const NEXT_SIZE = 4;

// Block definitions (classic 7)
const SHAPES = [
  // I
  [
    [0,0,0,0],
    [1,1,1,1],
    [0,0,0,0],
    [0,0,0,0]
  ],
  // O
  [
    [2,2],
    [2,2]
  ],
  // T
  [
    [0,3,0],
    [3,3,3],
    [0,0,0]
  ],
  // S
  [
    [0,4,4],
    [4,4,0],
    [0,0,0]
  ],
  // Z
  [
    [5,5,0],
    [0,5,5],
    [0,0,0]
  ],
  // J
  [
    [6,0,0],
    [6,6,6],
    [0,0,0]
  ],
  // L
  [
    [0,0,7],
    [7,7,7],
    [0,0,0]
  ]
];

// Initial empty board
function getEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// Rotate matrix 90 deg clockwise
function rotate(shape) {
  return shape[0].map((_, col) =>
    shape.map((row) => row[col]).reverse()
  );
}

// Generate random tetromino (returns {shape, type (color index)})
function randomTetromino() {
  const idx = Math.floor(Math.random() * SHAPES.length);
  // Deep copy shape
  return { shape: SHAPES[idx].map(row => [...row]), color: idx + 1, idx };
}

// Collision check for piece at pos {x, y}
function isValidMove(board, shape, x, y) {
  for (let row = 0; row < shape.length; ++row) {
    for (let col = 0; col < shape[row].length; ++col) {
      if (shape[row][col] !== 0) {
        const nx = x + col;
        const ny = y + row;
        if (
          nx < 0 || nx >= COLS ||
          ny >= ROWS ||
          (ny >= 0 && board[ny][nx] !== 0)
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

// Merge piece into board (for locking)
function merge(board, shape, x, y, color) {
  const boardCopy = board.map(row => [...row]);
  for (let row = 0; row < shape.length; ++row) {
    for (let col = 0; col < shape[row].length; ++col) {
      if (shape[row][col]) {
        const nx = x + col;
        const ny = y + row;
        if (ny >= 0) boardCopy[ny][nx] = color;
      }
    }
  }
  return boardCopy;
}

// Remove full lines, return {newBoard, linesCleared}
function clearLines(board) {
  let lines = 0;
  const newBoard = board.filter(row => {
    if (row.every(cell => cell !== 0)) {
      lines += 1;
      return false;   // remove this row
    }
    return true;
  });
  // add empty rows on top
  while (newBoard.length < ROWS) {
    newBoard.unshift(Array(COLS).fill(0));
  }
  return { newBoard, linesCleared: lines };
}

// Score: Classic Tetris scoring
function getScore(lines, level) {
  if (lines === 1) return 40 * (level + 1);
  if (lines === 2) return 100 * (level + 1);
  if (lines === 3) return 300 * (level + 1);
  if (lines >= 4) return 1200 * (level + 1);
  return 0;
}

// Controls help for display
const KEY_HELP = [
  { key: "←", action: "Move Left" },
  { key: "→", action: "Move Right" },
  { key: "↓", action: "Soft Drop" },
  { key: "Space", action: "Hard Drop" },
  { key: "↑ / X", action: "Rotate" },
  { key: "Z / Shift", action: "Rotate CCW" },
  { key: "R", action: "Restart" },
];

// PUBLIC_INTERFACE
function TetraMaster() {
  // Game state
  const [board, setBoard] = useState(getEmptyBoard());
  const [current, setCurrent] = useState(randomTetromino());
  const [pos, setPos] = useState({ x: 3, y: -2 });
  const [next, setNext] = useState(randomTetromino());
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [linesTotal, setLinesTotal] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Timing control
  const [tick, setTick] = useState(0);
  const timerRef = useRef(null);

  // Drop interval in ms (speeds up with level)
  const getInterval = (lvl) =>
    Math.max(900 - lvl * 75, 120);

  // Game loop
  useEffect(() => {
    if (gameOver) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setTick(t => t + 1), getInterval(level));
    return () => clearInterval(timerRef.current);
  }, [level, gameOver]);

  // Hard drop
  const hardDrop = useCallback(() => {
    let dropY = pos.y;
    while (isValidMove(board, current.shape, pos.x, dropY + 1)) {
      dropY += 1;
    }
    lockPiece(pos.x, dropY);
  }, [board, current, pos]);

  // Lock piece and handle merging, clearing, etc
  const lockPiece = useCallback(
    (lockX, lockY) => {
      let merged = merge(board, current.shape, lockX, lockY, current.color);

      const { newBoard, linesCleared } = clearLines(merged);

      // New tetromino
      const nextTetromino = next;
      const newCurrent = nextTetromino;
      const newNext = randomTetromino();

      const startX = Math.floor((COLS - newCurrent.shape[0].length) / 2);
      const startY = -2;

      // Game over detection: can't place new tetromino
      const canSpawn = isValidMove(
        newBoard,
        newCurrent.shape,
        startX,
        startY
      );
      setBoard(newBoard);
      setScore(s => s + getScore(linesCleared, level));
      setLinesTotal(l => l + linesCleared);

      // Level up per 10 lines
      if (Math.floor((linesTotal + linesCleared) / 10) > level) {
        setLevel(lvl => lvl + 1);
      }
      setCurrent(newCurrent);
      setNext(newNext);
      setPos({ x: startX, y: startY });
      if (!canSpawn) {
        setGameOver(true);
      }
    },
    [board, current, next, linesTotal, level]
  );

  // Piece falling (auto drop)
  useEffect(() => {
    if (gameOver) return;
    let y = pos.y;
    if (isValidMove(board, current.shape, pos.x, y + 1)) {
      setPos(p => ({ ...p, y: p.y + 1 }));
    } else {
      lockPiece(pos.x, y);
    }
    // eslint-disable-next-line
  }, [tick]);

  // Keyboard controls
  useEffect(() => {
    if (gameOver) return;

    function handleKey(e) {
      if (gameOver) return;
      // Prevent scrolling on arrow
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "Space"].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === "ArrowLeft") {
        if (isValidMove(board, current.shape, pos.x - 1, pos.y))
          setPos(p => ({ ...p, x: p.x - 1 }));
      } else if (e.code === "ArrowRight") {
        if (isValidMove(board, current.shape, pos.x + 1, pos.y))
          setPos(p => ({ ...p, x: p.x + 1 }));
      } else if (e.code === "ArrowDown") {
        if (isValidMove(board, current.shape, pos.x, pos.y + 1))
          setPos(p => ({ ...p, y: p.y + 1 }));
      } else if (e.code === "Space") {
        hardDrop();
      } else if (
        e.code === "ArrowUp" ||
        e.code === "KeyX"
      ) {
        // Rotate CW
        const rotated = rotate(current.shape);
        if (isValidMove(board, rotated, pos.x, pos.y)) {
          setCurrent(c => ({ ...c, shape: rotated }));
        }
      } else if (
        e.code === "KeyZ" ||
        e.code === "ShiftLeft" ||
        e.code === "ShiftRight"
      ) {
        // Rotate CCW: 3x CW
        let r = current.shape;
        for (let i = 0; i < 3; i++) r = rotate(r);
        if (isValidMove(board, r, pos.x, pos.y)) {
          setCurrent(c => ({ ...c, shape: r }));
        }
      } else if (e.code === "KeyR") {
        handleRestart();
      }
    }
    window.addEventListener("keydown", handleKey, { passive: false });
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line
  }, [board, current, pos, hardDrop, gameOver]);

  // Render logic helpers

  // Draw play area grid including current block
  function drawBoard() {
    // Copy board, then add falling tetromino
    const display = board.map(row => [...row]);
    const { shape, color } = current;
    for (let row = 0; row < shape.length; ++row) {
      for (let col = 0; col < shape[row].length; ++col) {
        if (shape[row][col]) {
          const nx = pos.x + col;
          const ny = pos.y + row;
          if (ny >= 0 && nx >= 0 && nx < COLS && ny < ROWS) {
            display[ny][nx] = color;
          }
        }
      }
    }
    return display;
  }

  // Draw next piece (mini)
  function drawMini(shape, color) {
    const size = NEXT_SIZE;
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    for (let row = 0; row < shape.length; ++row) {
      for (let col = 0; col < shape[row].length; ++col) {
        if (shape[row][col]) grid[row][col] = color;
      }
    }
    return grid;
  }

  // Reset game
  const handleRestart = useCallback(() => {
    setBoard(getEmptyBoard());
    setCurrent(randomTetromino());
    setNext(randomTetromino());
    setPos({ x: 3, y: -2 });
    setScore(0);
    setLevel(0);
    setLinesTotal(0);
    setGameOver(false);
    setTick(0);
  }, []);

  // Styles (CSS-in-JS for clarity)
  const styles = {
    root: {
      minHeight: "100vh",
      minWidth: "100vw",
      boxSizing: "border-box",
      background: COLORS.accent,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
      paddingTop: 10,
      paddingBottom: 0
    },
    gameArea: {
      display: "flex",
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "center",
      gap: 22, // reduced
      marginTop: 30, // was 60
      marginBottom: 14
    },
    board: {
      background: COLORS.primary,
      border: `3px solid ${COLORS.secondary}`,
      boxShadow: `0 1.5px 12px 0 ${COLORS.secondary}19`,
      borderRadius: 7,
      display: "grid",
      gridTemplateRows: `repeat(${ROWS}, ${BLOCK_SIZE}px)`,
      gridTemplateColumns: `repeat(${COLS}, ${BLOCK_SIZE}px)`,
      position: "relative",
    },
    sidebar: {
      minWidth: 120, // reduced
      background: COLORS.secondary,
      borderRadius: 8,
      color: COLORS.accent,
      padding: 10,
      marginLeft: 4,
      display: "flex",
      flexDirection: "column",
      gap: 13, // reduced
      fontWeight: 500,
      alignItems: "center"
    },
    nextBlockArea: {
      background: COLORS.primary,
      borderRadius: 4,
      padding: 4,
      marginBottom: 5,
      display: "inline-block"
    },
    controlsArea: {
      margin: "0 auto",
      marginTop: 11,
      display: "flex",
      flexDirection: "column",
      gap: 4,
      alignItems: "center",
      width: "100%"
    },
    gameOver: {
      marginTop: 6,
      padding: 6,
      color: "#e63946",
      background: "#fff3",
      borderRadius: 4,
      fontWeight: 700,
      fontSize: 16
    },
    btn: {
      background: COLORS.primary,
      color: COLORS.accent,
      border: "2px solid #c9ada7",
      padding: "4px 10px",
      borderRadius: 6,
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
      marginTop: 8
    }
  };

  // Render
  const playGrid = drawBoard();
  const nextGrid = drawMini(next.shape, next.color);

  return (
    <div style={styles.root}>
      {/* Title/branding */}
      <div style={{
        marginBottom: 9,
        fontWeight: 700,
        fontSize: 23,
        letterSpacing: 0.5,
        textShadow: `2px 2px 0 ${COLORS.secondary}44`
      }}>
        <span style={{ color: COLORS.primary }}>Tetra</span>
        <span style={{ color: COLORS.secondary }}>Master</span>
      </div>
      {/* Main area */}
      <div style={styles.gameArea}>
        {/* Play area */}
        <div
          style={styles.board}
          tabIndex={0}
          aria-label="Tetris Game Area"
        >
          {playGrid.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                style={{
                  width: BLOCK_SIZE - 2,
                  height: BLOCK_SIZE - 2,
                  margin: 1,
                  borderRadius: 3,
                  background: cell
                    ? COLORS.blockColors[cell % COLORS.blockColors.length]
                    : "rgba(255,255,255,0.06)",
                  border: cell ? `2.2px solid ${COLORS.accent}` : undefined,
                  boxShadow: cell
                    ? `0 1px 4px 0 #091c2e44`
                    : undefined,
                  transition: "background .15s"
                }}
              />
            ))
          )}
        </div>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 1, letterSpacing: "0.02em" }}>
            Next
          </div>
          {/* Next block preview */}
          <div style={styles.nextBlockArea}>
            <div
              style={{
                display: "grid",
                gridTemplateRows: `repeat(${NEXT_SIZE}, ${BLOCK_SIZE - 6}px)`,
                gridTemplateColumns: `repeat(${NEXT_SIZE}, ${BLOCK_SIZE - 6}px)`
              }}
            >
              {nextGrid.map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`${y}-${x}`}
                    style={{
                      width: BLOCK_SIZE - 7,
                      height: BLOCK_SIZE - 7,
                      margin: 0.7,
                      borderRadius: 2,
                      background: cell
                        ? COLORS.blockColors[cell % COLORS.blockColors.length]
                        : "transparent",
                      border: cell ? `1.3px solid ${COLORS.primary}` : undefined,
                      transition: "background .12s"
                    }}
                  />
                ))
              )}
            </div>
          </div>
          <div style={{ fontSize: 13, marginBottom: 2 }}>
            <b>Score</b>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#F2E9E4", minHeight: 18 }}>{score}</div>
          </div>
          <div style={{ fontSize: 13, marginBottom: 2 }}>
            <b>Level</b>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#F2E9E4", minHeight: 16 }}>{level + 1}</div>
          </div>
          <div style={{ fontSize: 13, marginBottom: 2 }}>
            <b>Lines</b>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#F2E9E4", minHeight: 16 }}>{linesTotal}</div>
          </div>
          {gameOver &&
            <div style={styles.gameOver}>
              Game Over!
              <button style={styles.btn} onClick={handleRestart}>
                Restart
              </button>
            </div>
          }
        </aside>
      </div>
      {/* Controls */}
      <div style={styles.controlsArea}>
        <div style={{
          textAlign: "center",
          color: COLORS.primary,
          fontWeight: 500,
          fontSize: 13.5,
          marginBottom: 2
        }}>
          Controls
        </div>
        <div style={{
          display: "flex",
          gap: 7,
          flexWrap: "wrap",
          justifyContent: "center",
          color: "#4a4e69"
        }}>
          {KEY_HELP.map(({ key, action }) => (
            <div key={action}
              style={{
                minWidth: 66,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 2
              }}>
              <span style={{
                border: `1.3px solid ${COLORS.secondary}`,
                borderRadius: 2,
                background: "#fff",
                color: COLORS.primary,
                padding: "1px 6px",
                display: "inline-block",
                fontWeight: 700,
                marginRight: 2,
                fontSize: 12.5,
                boxShadow: "0 1px 2.2px rgba(34,34,59,0.07)"
              }}>
                {key}
              </span>
              <span style={{ fontSize: 10.5 }}>{action}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ margin: 5, color: COLORS.secondary, fontSize: 11 }}>
        Classic Tetris implementation &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}

export default TetraMaster;
