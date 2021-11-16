const Game = {
    data() {
        return {
            showModal: true,        // Có hiển thị bảng chọn lượt hay không
            turn: undefined,        // Lượt chơi, W ~ quân trắng đi, B ~ quân đen được đi
            depth: 10,              // Độ sâu cây trò chơi
            matrixSize: 3,          // Diện tích bàn chơi
            blackPoints: [          // Ma trận điểm cho quân đen
                [-10, -25, -40],
                [-5, -20, -35],
                [0, -15, -30],
            ],
            whitePoints: [          // Ma trận điểm cho quân trắng
                [30, 35, 40],
                [15, 20, 25],
                [0, 5, 10],
            ],
            state: [                // Trạng thái trò chơi, -1 ~ quân đen, 1 ~ quân trắng
                [-1, 0, 0],
                [-1, 0, 0],
                [0, 1, 1],
            ],
            pick: {},               // Tọa độ người chơi chọn để di chuyển quân
        }
    },
    watch: {
        /**
         * Mỗi khi có sự thay đổi lượt chơi
         * -> kiểm tra xem có đủ điều kiện kết thúc trò chơi -> thông báo
         * -> nếu lượt tiếp theo là máy -> cho máy tính toán di chuyển
         * */
        turn(value) {
            const checkEndGame = this.checkEndGame()
            if (checkEndGame == 0)
                this.notifyEndGame(false)
            else if (checkEndGame == 1)
                this.notifyEndGame()
            else if (value === 'B') {
                this.botMove();
            }
        }
    },
    methods: {
        isBlack(x, y) {
            return this.state[y][x] === -1;
        },
        isWhite(x, y) {
            return this.state[y][x] === 1;
        },
        switchTurn() {
            this.turn = this.turn === 'W' ? 'B' : 'W';
        },
        botMove() {
            this.state = this.minimax(this.depth)
            this.switchTurn()
        },
        playerPick(x, y) {
            if (this.turn === 'W') {
                this.pick.x = x;
                this.pick.y = y;
            }
        },
        playerMove(x, y) {
            // loại bỏ tình huống đi chéo
            if (this.pick.x !== x && this.pick.y !== y) {
                return;
            }
            // loại bỏ tình huống đi lùi hoặc đi quá 1 ô
            if (Math.abs(this.pick.x - x) > 1 || y - this.pick.y < -1 || y - this.pick.y > 0) {
                return;
            }
            this.state[this.pick.y][this.pick.x] = 0
            this.state[y][x] = 1;
            this.pick = {};
            this.switchTurn();
        },
        playerMoveEdge() {
            // loại bỏ tình huống chưa đến rìa bản đồ đã ra ngoài bản đồ
            if (this.pick.y !== 0) {
                return;
            }
            this.state[this.pick.y][this.pick.x] = 0
            this.pick = {};
            this.switchTurn();
        },
        findNextStates(state, turn) {
            let states = [];
            for (let i = 0; i < this.matrixSize; i++) {
                for (let j = 0; j < this.matrixSize; j++) {
                    if (turn === 'W' && state[i][j] === 1) {
                        // trắng -> đi lên
                        if (i === 0 || (i >= 1 && state[i - 1][j] === 0)) {
                            const next = state.map(arr => arr.slice())
                            next[i][j] = 0
                            if (i !== 0)
                                next[i - 1][j] = 1
                            states.push(next)
                        }
                        // trắng -> sang trái
                        if (j >= 1 && state[i][j - 1] === 0) {
                            const next = state.map(arr => arr.slice())
                            next[i][j] = 0
                            next[i][j - 1] = 1
                            states.push(next)
                        }
                        // trắng -> sang phải
                        if (j + 1 < this.matrixSize && [i][j + 1] === 0) {
                            const next = state.map(arr => arr.slice())
                            next[i][j] = 0
                            next[i][j + 1] = 1
                            states.push(next)
                        }
                    } else if (turn === 'B' && state[i][j] === -1) {
                        // đen -> sang phải
                        if (j === this.matrixSize - 1 || (j + 1 < this.matrixSize && state[i][j + 1] === 0)) {
                            const next = state.map(arr => arr.slice())
                            next[i][j] = 0
                            if (j !== this.matrixSize - 1)
                                next[i][j + 1] = -1
                            states.push(next)
                        }
                        // đen -> đi lên
                        if (i >= 1 && state[i - 1][j] === 0) {
                            const next = state.map(arr => arr.slice())
                            next[i][j] = 0
                            next[i - 1][j] = -1
                            states.push(next)
                        }
                        // đen -> đi xuống
                        if (i + 1 < this.matrixSize && state[i + 1][j] === 0) {
                            const next = state.map(arr => arr.slice())
                            next[i][j] = 0
                            next[i + 1][j] = -1
                            states.push(next)
                        }
                    }
                }
            }
            return states;
        },
        eval(state) {
            let numWhite = 2;
            let numBlack = 2;
            let val = 0;
            for (let i = 0; i < this.matrixSize; i++) {
                for (let j = 0; j < this.matrixSize; j++) {
                    if (state[i][j] === 1) {
                        numWhite--
                        val += this.whitePoints[i][j];
                        // kiểm tra đen chặn trực tiếp trắng
                        if (i - 1 >= 0 && state[i - 1][j] === -1)
                            val -= 40;
                        // kiểm tra đen chặn gián tiếp trắng
                        for (let s = i - 2; s >= 0; s--) {
                            if (state[s][j] === -1)
                                val -= 30;
                        }
                    } else if (state[i][j] === -1) {
                        numBlack--
                        val += this.blackPoints[i][j];
                        // kiểm tra trắng chặn trực tiếp đen
                        if (j + 1 < this.matrixSize && state[i][j + 1] === 1)
                            val += 40;
                        // kiểm tra trắng chặn gián tiếp đen
                        for (let s = j + 2; s < this.matrixSize; s++) {
                            if (state[i][s] === 1)
                                val += 30;
                        }
                    }
                }
            }
            // trạng thái có quân ngoài bản đồ +/- 50 điểm cho mỗi quân
            val += numWhite * 50
            val -= numBlack * 50
            return val;
        },
        isEndState(state) {
            let numBlack = 0
            let numWhite = 0
            for (let i = 0; i < this.matrixSize; i++) {
                for (let j = 0; j < this.matrixSize; j++) {
                    if (state[i][j] === 1)
                        numWhite++
                    else if (this.state[i][j] === -1)
                        numBlack++
                }
            }
            return numBlack === 0 || numWhite === 0
        },
        maxVal(state, depth) {
            if (depth === 0 || this.isEndState(state))
                return this.eval(state)
            else {
                const nextStates = this.findNextStates(state, 'W')
                const minVals = nextStates.map(s => this.minVal(s, depth - 1))
                return Math.max(...minVals)
            }
        },
        minVal(state, depth) {
            if (depth === 0 || this.isEndState(state))
                return this.eval(state)
            else {
                const nextStates = this.findNextStates(state, 'B')
                const maxVals = nextStates.map(s => this.maxVal(s, depth - 1))
                return Math.min(...maxVals)
            }
        },
        minimax(depth) {
            let min = 9999
            let chosenState = null
            const nextStates = this.findNextStates(this.state, 'B')
            nextStates.forEach(s => {
                const maxVal = this.maxVal(s, depth - 1)
                if (min >= maxVal) {
                    min = maxVal
                    chosenState = s
                }
            })
            return chosenState
        },
        /**
         * 0 ~ máy thắng
         * 1 ~ bạn thắng
         * -1 ~ chưa kết thúc
         **/
        checkEndGame() {
            // số quân đen/trắng trên bàn
            let numBlack = 0
            let numWhite = 0
            // số quân đen trắng bị chặn không thể đi
            let deadBlack = 0
            let deadWhite = 0
            for (let i = 0; i < this.matrixSize; i++) {
                for (let j = 0; j < this.matrixSize; j++) {
                    if (this.state[i][j] === 1) {
                        if ((this.state?.[i - 1]?.[j] ?? 0) === -1 && (this.state?.[i]?.[j + 1] ?? -1) === -1 && (this.state?.[i]?.[j - 1] ?? -1) === -1)
                            deadWhite++
                        numWhite++
                    }
                    else if (this.state[i][j] === -1) {
                        if ((this.state?.[i - 1]?.[j] ?? 1) === 1 && (this.state?.[i + 1]?.[j] ?? 1) === 1 && (this.state?.[i]?.[j + 1] ?? 0) === 1)
                            deadBlack++
                        numBlack++
                    }
                }
            }
            // khi số quân đen/trắng == 0 hoặc 1 bên không thể di chuyển -> kết thúc
            if (numBlack === 0 || (numWhite > 0 && deadWhite === numWhite)) {
                return 0
            }
            if (numWhite === 0 || (numBlack > 0 && deadBlack === numBlack)) {
                return 1
            }
            return -1
        },
        notifyEndGame(win = true) {
            if (win)
                Swal.fire({
                    title: 'Chúc mừng, bạn đã thắng!',
                    icon: 'success',
                    confirmButtonText: 'Chơi lại',
                    confirmButtonColor: '#0d6efd',
                }).then(() => window.location = window.location)
            else
                Swal.fire({
                    title: 'Rất tiếc, bạn đã thua!',
                    icon: 'error',
                    confirmButtonText: 'Chơi lại',
                    confirmButtonColor: '#0d6efd',
                }).then(() => window.location = window.location)
        },
    },
}

Vue.createApp(Game).mount('#game')