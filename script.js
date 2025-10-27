// script.js
const initialBoard = [
    ["r", "k", "b", "q", "+", "b", "k", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "K", "B", "Q", "*", "B", "K", "R"]
];

let board = JSON.parse(JSON.stringify(initialBoard));
let currentPlayer = 'white';
let selectedSquare = null;
let moveHistory = []; // To track moves for en passant and castling
let gameOver = false;

function startGame() {
    board = JSON.parse(JSON.stringify(initialBoard));
    currentPlayer = 'white';
    selectedSquare = null;
    moveHistory = [];
    gameOver = false;
    renderBoard();
    updateStatus();
}

function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
            square.dataset.row = row;
            square.dataset.col = col;
            square.innerText = board[row][col] !== ' ' ? board[row][col] : '';
            square.onclick = () => handleSquareClick(row, col);
            boardElement.appendChild(square);
        }
    }
}

function handleSquareClick(row, col) {
    if (gameOver) return;
    if (selectedSquare) {
        const [selectedRow, selectedCol] = selectedSquare;
        if (isValidMove(selectedRow, selectedCol, row, col)) {
            makeMove(selectedRow, selectedCol, row, col);
            currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
            selectedSquare = null;
            renderBoard();
            updateStatus();
            checkGameState();
        } else {
            selectedSquare = null;
            renderBoard();
        }
    } else {
        if (board[row][col] !== ' ' && isPlayerPiece(row, col)) {
            selectedSquare = [row, col];
            renderBoard();
        }
    }
}

function isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const target = board[toRow][toCol];
    const isWhitePiece = piece === piece.toUpperCase();
    if ((isWhitePiece && currentPlayer !== 'white') || (!isWhitePiece && currentPlayer !== 'black')) return false;
    if (target !== ' ' && isPlayerPiece(toRow, toCol)) return false; // Can't capture own piece

    // Check piece-specific movement
    const pieceType = piece.toLowerCase();
    let isValid = false;

    if (pieceType === 'p') isValid = isValidPawnMove(fromRow, fromCol, toRow, toCol);
    else if (pieceType === 'r') isValid = isValidRookMove(fromRow, fromCol, toRow, toCol);
    else if (pieceType === 'n') isValid = isValidKnightMove(fromRow, fromCol, toRow, toCol);
    else if (pieceType === 'b') isValid = isValidBishopMove(fromRow, fromCol, toRow, toCol);
    else if (pieceType === 'q') isValid = isValidQueenMove(fromRow, fromCol, toRow, toCol);
    else if (pieceType === 'k') isValid = isValidKingMove(fromRow, fromCol, toRow, toCol);

    if (!isValid) return false;

    // Simulate move to check if it puts own king in check
    const tempBoard = JSON.parse(JSON.stringify(board));
    tempBoard[toRow][toCol] = tempBoard[fromRow][fromCol];
    tempBoard[fromRow][fromCol] = ' ';
    if (isKingInCheck(tempBoard, currentPlayer)) return false;

    return true;
}

function isValidPawnMove(fromRow, fromCol, toRow, toCol) {
    const direction = currentPlayer === 'white' ? -1 : 1;
    const startRow = currentPlayer === 'white' ? 6 : 1;
    const target = board[toRow][toCol];

    // Move forward
    if (fromCol === toCol && target === ' ') {
        if (toRow === fromRow + direction) return true;
        if (fromRow === startRow && toRow === fromRow + 2 * direction && board[fromRow + direction][fromCol] === ' ') {
            return true;
        }
    }
    // Capture
    if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction) {
        if (target !== ' ' && !isPlayerPiece(toRow, toCol)) return true;
        // En passant
        if (target === ' ' && isValidEnPassant(fromRow, fromCol, toRow, toCol)) return true;
    }
    return false;
}

function isValidEnPassant(fromRow, fromCol, toRow, toCol) {
    if (!moveHistory.length) return false;
    const lastMove = moveHistory[moveHistory.length - 1];
    const direction = currentPlayer === 'white' ? -1 : 1;
    const enPassantRow = currentPlayer === 'white' ? 3 : 4;
    if (fromRow !== enPassantRow) return false;
    if (lastMove.piece.toLowerCase() !== 'p') return false;
    if (Math.abs(lastMove.fromRow - lastMove.toRow) !== 2) return false;
    if (lastMove.toCol !== toCol || lastMove.toRow !== fromRow) return false;
    return true;
}

function isValidRookMove(fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol);
}

function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
    if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol);
}

function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
    return isValidRookMove(fromRow, fromCol, toRow, toCol) || isValidBishopMove(fromRow, fromCol, toRow, toCol);
}

function isValidKingMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    if (rowDiff <= 1 && colDiff <= 1) return true;
    // Castling
    return isValidCastling(fromRow, fromCol, toRow, toCol);
}

function isValidCastling(fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow || Math.abs(toCol - fromCol) !== 2) return false;
    if (isKingInCheck(board, currentPlayer)) return false;
    const isWhite = currentPlayer === 'white';
    const row = isWhite ? 7 : 0;
    if (fromRow !== row || board[row][4] !== (isWhite ? 'K' : 'k')) return false;

    const isKingSide = toCol === 6;
    const rookCol = isKingSide ? 7 : 0;
    const rookPiece = isWhite ? 'R' : 'r';
    if (board[row][rookCol] !== rookPiece) return false;

    // Check if king or rook has moved
    if (moveHistory.some(move => 
        (move.piece === (isWhite ? 'K' : 'k') && move.fromRow === row && move.fromCol === 4) ||
        (move.piece === rookPiece && move.fromRow === row && move.fromCol === rookCol))) {
        return false;
    }

    // Check if path is clear and not moving through check
    const colStart = isKingSide ? 5 : 3;
    const colEnd = isKingSide ? 6 : 2;
    const step = isKingSide ? 1 : -1;
    for (let col = colStart; col !== colEnd + step; col += step) {
        if (board[row][col] !== ' ') return false;
        const tempBoard = JSON.parse(JSON.stringify(board));
        tempBoard[row][col] = tempBoard[row][4];
        tempBoard[row][4] = ' ';
        if (isKingInCheck(tempBoard, currentPlayer)) return false;
    }
    return true;
}

function isPathClear(fromRow, fromCol, toRow, toCol) {
    const rowStep = toRow === fromRow ? 0 : (toRow > fromRow ? 1 : -1);
    const colStep = toCol === fromCol ? 0 : (toCol > fromCol ? 1 : -1);
    let row = fromRow + rowStep;
    let col = fromCol + colStep;
    while (row !== toRow || col !== toCol) {
        if (board[row][col] !== ' ') return false;
        row += rowStep;
        col += colStep;
    }
    return true;
}

function isKingInCheck(boardState, player) {
    const king = player === 'white' ? 'K' : 'k';
    let kingRow, kingCol;
    // Find king
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (boardState[row][col] === king) {
                kingRow = row;
                kingCol = col;
                break;
            }
        }
    }
    // Check if any opponent piece can attack the king
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = boardState[row][col];
            if (piece === ' ' || (player === 'white' && piece === piece.toUpperCase()) || 
                (player === 'black' && piece === piece.toLowerCase())) continue;
            if (canPieceAttack(boardState, row, col, kingRow, kingCol)) return true;
        }
    }
    return false;
}

function canPieceAttack(boardState, fromRow, fromCol, toRow, toCol) {
    const piece = boardState[fromRow][fromCol].toLowerCase();
    if (piece === 'p') {
        const direction = boardState[fromRow][fromCol] === boardState[fromRow][fromCol].toUpperCase() ? -1 : 1;
        return Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction;
    }
    if (piece === 'n') return isValidKnightMove(fromRow, fromCol, toRow, toCol);
    if (piece === 'b') return isValidBishopMove(fromRow, fromCol, toRow, toCol);
    if (piece === 'r') return isValidRookMove(fromRow, fromCol, toRow, toCol);
    if (piece === 'q') return isValidQueenMove(fromRow, fromCol, toRow, toCol);
    if (piece === 'k') {
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        return rowDiff <= 1 && colDiff <= 1;
    }
    return false;
}

function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const isEnPassant = piece.toLowerCase() === 'p' && Math.abs(toCol - fromCol) === 1 && board[toRow][toCol] === ' ';
    const isCastling = piece.toLowerCase() === 'k' && Math.abs(toCol - fromCol) === 2;

    // Record move
    moveHistory.push({ piece, fromRow, fromCol, toRow, toCol });

    // Handle en passant capture
    if (isEnPassant) {
        const direction = currentPlayer === 'white' ? -1 : 1;
        board[fromRow][toCol] = ' ';
    }

    // Handle castling
    if (isCastling) {
        const isKingSide = toCol === 6;
        const rookFromCol = isKingSide ? 7 : 0;
        const rookToCol = isKingSide ? 5 : 3;
        const row = fromRow;
        board[row][rookToCol] = board[row][rookFromCol];
        board[row][rookFromCol] = ' ';
    }

    // Move piece
    board[toRow][toCol] = board[fromRow][fromCol];
    board[fromRow][fromCol] = ' ';

    // Handle pawn promotion
    if (piece.toLowerCase() === 'p' && (toRow === 0 || toRow === 7)) {
        board[toRow][toCol] = currentPlayer === 'white' ? 'Q' : 'q'; // Auto-promote to queen
    }
}

function isPlayerPiece(row, col) {
    const piece = board[row][col];
    return (currentPlayer === 'white' && piece === piece.toUpperCase()) ||
           (currentPlayer === 'black' && piece === piece.toLowerCase());
}

function checkGameState() {
    const opponent = currentPlayer === 'white' ? 'black' : 'white';
    if (isKingInCheck(board, opponent)) {
        if (isCheckmate(opponent)) {
            gameOver = true;
            updateStatus(`Schachmatt! ${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} gewinnt!`);
        } else {
            updateStatus(`Schach! ${opponent.charAt(0).toUpperCase() + opponent.slice(1)} ist am Zug.`);
        }
    } else if (isStalemate(opponent)) {
        gameOver = true;
        updateStatus('Patt! Das Spiel endet unentschieden.');
    } else {
        updateStatus(`${opponent.charAt(0).toUpperCase() + opponent.slice(1)} ist am Zug.`);
    }
}

function isCheckmate(player) {
    for (let fromRow = 0; fromRow < 8; fromRow++) {
        for (let fromCol = 0; fromCol < 8; fromCol++) {
            if (!isPlayerPiece(fromRow, fromCol) || (player === 'white' && board[fromRow][fromCol] !== board[fromRow][fromCol].toUpperCase()) ||
                (player === 'black' && board[fromRow][fromCol] !== board[fromRow][fromCol].toLowerCase())) continue;
            for (let toRow = 0; toRow < 8; toRow++) {
                for (let toCol = 0; toCol < 8; toCol++) {
                    if (isValidMove(fromRow, fromCol, toRow, toCol)) return false;
                }
            }
        }
    }
    return true;
}

function isStalemate(player) {
    if (isKingInCheck(board, player)) return false;
    return isCheckmate(player); // No legal moves and not in check
}

function updateStatus(message) {
    const statusElement = document.getElementById('status');
    statusElement.innerText = message || `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} ist am Zug.`;
}

function toggleMode() {
    alert('Modus wechseln ist noch nicht implementiert.');
}

startGame();
