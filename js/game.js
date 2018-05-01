class GameInterface {
    static getUserDataFromInputs() {
        const inputs = document.getElementById("user_form").elements;
        const userDataObj = {
            "nickname": inputs.nickname.value
        }
        GameInterface.saveLastLoginDataToStorage(userDataObj);
        return userDataObj;
    }

    static saveLastLoginDataToStorage(userDataObj) {
        localStorage.setItem("lastLoginUserData", JSON.stringify(userDataObj));
    }

    static loadLastUserDataFromStorageToInputs() {
        if (localStorage.getItem("lastLoginUserData")) {
            const lastUserData = JSON.parse(localStorage.getItem("lastLoginUserData"));
            const inputs = document.getElementById("user_form").elements;
            inputs.nickname.value = lastUserData.nickname;
        }
    }

    static getSizeFromUserInput() {
        const inputs = document.getElementById("user_form").elements;
        return inputs.selectSize.value;
    }

    static select(id) {
        this.game_match.tryToSelect(id);
    }

    static pressEnterOnFocusLetter(id) {
        if (event.code === 'Enter') {
            GameInterface.select(id);
        }
    }

    static startGame() {
        const size = Number(GameInterface.getSizeFromUserInput());
        const user_data = GameInterface.getUserDataFromInputs();
        this.game_match = new Game(size, user_data);
        this.game_match.createGame();
    }

}

class Game {
    constructor(size, user_data) {
        this.user_data = user_data;
        this.size = size;
        this.time = 0;
        this.setTimeOutTimer;
        this.leftLetters = this.size ** 2;
        this.name_localStorage = 'game_records-' + this.size;
        this.selectedLetters = [];
        this.letterStyleWidth = "width: " + 100 / this.size + "%;";
        this.padding_botSize = "padding-bottom: " + 100 / this.size + "%;";
        this.styleOfLetter = "float: left; height: 0; position: relative;" + this.letterStyleWidth + this.padding_botSize;
        this.selectedLetters = [];

        // this.dataWords = globalData;
        this.wordsMatrix = this.takeHardcodedMatrix(this.size);
    }

    createGame() {
        // this.createWordsMatrix();

        this.changeScene("main-menu_id", "game-scene_id");
        this.buildGameField(this.size);
        this.autofocusTheFirstLetter();
        this.startTimer();
    }

    changeScene(currentScene, nextScene) {
        document.getElementById(currentScene).hidden = true;
        document.getElementById(nextScene).hidden = false;
    }

    buildGameField(size) {
        for (let i = 0; i < size ** 2; i++) {
            this.createHTMLElementOfLetter(i, i + 1);
        }
        this.applying_CSS_to_letters(this.styleOfLetter);
        this.fillTheGameField(this.wordsMatrix);
    }

    autofocusTheFirstLetter() {
        const theFirstCard = document.getElementById("0");
        theFirstCard.focus();
    }

    createHTMLElementOfLetter(id, number_from_id_for_tab) {
        const newCard = document.createElement('div');
        newCard.setAttribute("class", "letter");
        newCard.setAttribute("id", id);
        newCard.setAttribute("OnClick", "GameInterface.select('" + id + "')");
        newCard.setAttribute("tabindex", number_from_id_for_tab);
        newCard.setAttribute("onkeydown", "GameInterface.pressEnterOnFocusLetter('" + id + "')");
        document.getElementById("game-scene_id").appendChild(newCard);
    }

    applying_CSS_to_letters(style) {
        const letters = document.getElementsByClassName("letter");
        for (let i = 0; i < letters.length; i++) {
            letters[i].setAttribute("style", style);
        }
    }

    fillTheGameField(wordsMatrix) {
        const fields = document.getElementsByClassName("letter");
        for (let i = 0; i < fields.length; i++) {
            const letterFromMatrix = wordsMatrix[i].letter;
            fields[i].setAttribute("style", this.styleOfLetter + "background: url(img/alphabet/" + letterFromMatrix + ".png) no-repeat; background-size: contain;");
        }
    }

    tryToSelect(currentLetter_id) {
        this.gameLogic(currentLetter_id);
    }

    gameLogic(currentLetter_id) {
        // enable selecting for the first selecting
        if (this.selectedLetters.length === 0) {
            this.select(currentLetter_id);
            this.selectedLetters.push(currentLetter_id);
        }
        else {
            let lastSelectedLetter_id = this.selectedLetters[this.selectedLetters.length - 1];
            // enable unselecting last selected letter
            if (currentLetter_id === lastSelectedLetter_id) {
                this.select(currentLetter_id);
                this.selectedLetters.pop();
            }
            else {
                // disable selecting already selected elements
                if (this.selectedLetters.indexOf(currentLetter_id) === -1) {
                    // enable selecting near letters
                    if (Number(currentLetter_id) === Number(lastSelectedLetter_id) + 1 ||
                        Number(currentLetter_id) === Number(lastSelectedLetter_id) - 1 ||
                        Number(currentLetter_id) === Number(lastSelectedLetter_id) + this.size ||
                        Number(currentLetter_id) === Number(lastSelectedLetter_id) - this.size
                    ) {
                        this.select(currentLetter_id);
                        this.selectedLetters.push(currentLetter_id);
                    }
                }
            }
        }

        if (this.selectedLetters.length > 0 && this.isWordCompleted()) {
            this.deactivateOnClickElems(this.selectedLetters);
            this.fadeInFindedWord(this.selectedLetters);
            this.leftLetters = this.leftLetters - this.selectedLetters.length;
            this.selectedLetters = [];
            if (this.chkWinCondition()) {
                clearTimeout(this.setTimeOutTimer);
                this.chkAndUpdateTop10LocalStorageRecords(this.name_localStorage, this.time, this.user_data);
                this.showWinSceneWithDelay(1000);
            }
        }

    }

    isWordCompleted() {
        const guessedWordFromFirstSelectLetter = this.wordsMatrix[Number(this.selectedLetters[0])].word;
        let currentWord = "";
        const wordsMatrixTemp = this.wordsMatrix
        this.selectedLetters.forEach(function (idLetter) {
            currentWord = currentWord + wordsMatrixTemp[Number(idLetter)].letter;
            if (wordsMatrixTemp[Number(idLetter)].word !== guessedWordFromFirstSelectLetter) {
                // for cases when word = current word but letters taken from different guessed words
                return false;
            }
        })
        return guessedWordFromFirstSelectLetter === currentWord;
    }

    select(id) {
        this.htmlAttrToggle(id, "class", "letter", "letter selected");
    }


    deactivateOnClickElems(collectionID) {
        collectionID.forEach(function (id) {
            document.getElementById(id).removeAttribute("OnClick");
        })
    }

    fadeInFindedWord(collectionID) {
        collectionID.forEach(function (id) {
            document.getElementById(id).removeAttribute("OnClick");
            document.getElementById(id).setAttribute("class", "letter fade-in");
        })
    }

    htmlAttrToggle(id, attr, toggleClassOn, toggleClassOff) {
        const letter = document.getElementById(id);
        if (letter.getAttribute(attr) === toggleClassOn) {
            letter.setAttribute(attr, toggleClassOff);
        } else {
            letter.setAttribute(attr, toggleClassOn);
        }
    }

    chkWinCondition() {
        return this.leftLetters === 0;
    }

    showCongrat() {
        document.getElementById("congrat").textContent = "Congratulation You win!";
    }

    //timer autostop when winCondition is true;
    startTimer() {
        const that = this;
        function timerSec() {
            that.time = that.time + 100;
            const time = that.convertMS(that.time);
            document.getElementById("timer_id").textContent = time;
            if (that.chkWinCondition() === false) {
                that.setTimeOutTimer = setTimeout(timerSec, 100);
            }
        }
        timerSec();
    }

    showWinSceneWithDelay(ms) {
        const that = this;
        this.setTableOfRecords();
        function delay() {
            that.changeScene("game-scene_id", "win-scene_id");
        }
        setTimeout(delay, ms);
    }

    setTableOfRecords() {
        const records_list = document.getElementById("records-table");
        const list = document.createElement('ol');
        const records = JSON.parse(localStorage.getItem(this.name_localStorage));
        records.forEach(recordObj => {
            let listElem = document.createElement('li');
            if (recordObj === "empty") listElem.textContent = "empty";
            else {
                let time = document.createElement('div');
                time.setAttribute("class", "record-time");
                time.textContent = this.convertMS(recordObj.time);
                if (recordObj.user_data.nickname === "") {
                    time.textContent = time.textContent + " unknown";
                } else {
                    time.textContent = time.textContent + " " + recordObj.user_data.nickname;
                }
                listElem.appendChild(time);
            }
            list.appendChild(listElem);
        });
        records_list.appendChild(list);
    }

    chkAndUpdateTop10LocalStorageRecords(name_localStorage, current_time, user_data) {
        if (!localStorage.getItem(name_localStorage)) {
            const emptyArray = new Array(10);
            const newRecords = emptyArray.fill("empty");
            newRecords[0] = { "time": current_time, "user_data": user_data };
            localStorage.setItem(name_localStorage, JSON.stringify(newRecords));
        } else {
            let records = JSON.parse(localStorage.getItem(name_localStorage));
            let newRecordObj = { "time": current_time, "user_data": user_data };
            for (let i = 0; i < 10; i++) {
                if (records[i] === "empty") {
                    records[i] = newRecordObj;
                    localStorage.setItem(name_localStorage, JSON.stringify(records));
                    break;
                } else {
                    if (current_time < records[i].time) {
                        let copyRightPartOfArr = records.slice(i, 9);
                        let copyLeftPartOfArr = records.slice(0, i);
                        copyLeftPartOfArr.push(newRecordObj);
                        records = copyLeftPartOfArr.concat(copyRightPartOfArr);
                        localStorage.setItem(name_localStorage, JSON.stringify(records));
                        break;
                    }
                }
            }
        }
    }

    convertMS(input_ms) {
        let ms = (input_ms % 1000) / 100;
        let s = Math.floor(input_ms / 1000);
        let m = Math.floor(s / 60);
        s = s % 60;
        m = m % 60;
        if (s < 10) s = "0" + s;
        return String(m) + ":" + String(s) + ":" + String(ms)
    };

    takeHardcodedMatrix(size) {
        switch (size) {
            case 3:
                return [
                    { "letter": "D", "word": "DOG" }, { "letter": "O", "word": "DOG" }, { "letter": "G", "word": "DOG" },
                    { "letter": "C", "word": "CAT" }, { "letter": "W", "word": "COW" }, { "letter": "O", "word": "COW" },
                    { "letter": "A", "word": "CAT" }, { "letter": "T", "word": "CAT" }, { "letter": "C", "word": "COW" }
                ];
            case 4:
                return [
                    { "letter": "D", "word": "DOG" }, { "letter": "O", "word": "DOG" }, { "letter": "G", "word": "DOG" }, { "letter": "H", "word": "HELLO" },
                    { "letter": "C", "word": "CAT" }, { "letter": "W", "word": "COW" }, { "letter": "O", "word": "COW" }, { "letter": "E", "word": "HELLO" },
                    { "letter": "A", "word": "CAT" }, { "letter": "T", "word": "CAT" }, { "letter": "C", "word": "COW" }, { "letter": "L", "word": "HELLO" },
                    { "letter": "E", "word": "WE" }, { "letter": "W", "word": "WE" }, { "letter": "O", "word": "HELLO" }, { "letter": "L", "word": "HELLO" }
                ];
            case 5:
                return [
                    { "letter": "D", "word": "DOG" }, { "letter": "O", "word": "DOG" }, { "letter": "G", "word": "DOG" }, { "letter": "H", "word": "HELLO" }, { "letter": "G", "word": "LONG" },
                    { "letter": "C", "word": "CAT" }, { "letter": "W", "word": "COW" }, { "letter": "O", "word": "COW" }, { "letter": "E", "word": "HELLO" }, { "letter": "N", "word": "LONG" },
                    { "letter": "A", "word": "CAT" }, { "letter": "T", "word": "CAT" }, { "letter": "C", "word": "COW" }, { "letter": "L", "word": "HELLO" }, { "letter": "O", "word": "LONG" },
                    { "letter": "E", "word": "WE" }, { "letter": "W", "word": "WE" }, { "letter": "O", "word": "HELLO" }, { "letter": "L", "word": "HELLO" }, { "letter": "L", "word": "LONG" },
                    { "letter": "A", "word": "ALPHA" }, { "letter": "L", "word": "ALPHA" }, { "letter": "P", "word": "ALPHA" }, { "letter": "H", "word": "ALPHA" }, { "letter": "A", "word": "ALPHA" }
                ];
            case 6:
                return [
                    { "letter": "D", "word": "DOG" },          { "letter": "O", "word": "DOG" },          { "letter": "G", "word": "DOG" },          { "letter": "H", "word": "HELLO" },        { "letter": "G", "word": "LONG" },           { "letter": "N", "word": "AFFILIATION" },
                    { "letter": "C", "word": "CAT" },          { "letter": "W", "word": "COW" },          { "letter": "O", "word": "COW" },          { "letter": "E", "word": "HELLO" },        { "letter": "N", "word": "LONG" },           { "letter": "O", "word": "AFFILIATION" },
                    { "letter": "A", "word": "CAT" },          { "letter": "T", "word": "CAT" },          { "letter": "C", "word": "COW" },          { "letter": "L", "word": "HELLO" },        { "letter": "O", "word": "LONG" },           { "letter": "I", "word": "AFFILIATION" },
                    { "letter": "E", "word": "WE" },           { "letter": "W", "word": "WE" },           { "letter": "O", "word": "HELLO" },        { "letter": "L", "word": "HELLO" },        { "letter": "L", "word": "LONG" },           { "letter": "T", "word": "AFFILIATION" },
                    { "letter": "A", "word": "ALPHA" },        { "letter": "L", "word": "ALPHA" },        { "letter": "P", "word": "ALPHA" },        { "letter": "H", "word": "ALPHA" },        { "letter": "A", "word": "ALPHA" },          { "letter": "A", "word": "AFFILIATION" },
                    { "letter": "A", "word": "AFFILIATION" },  { "letter": "F", "word": "AFFILIATION" },  { "letter": "F", "word": "AFFILIATION" },  { "letter": "I", "word": "AFFILIATION" },  { "letter": "L", "word": "AFFILIATION" },    { "letter": "I", "word": "AFFILIATION" }
                ];
            case 7:
                return [
                    { "letter": "D", "word": "DDDDDD" },               { "letter": "D", "word": "DDDDDD" },                { "letter": "A", "word": "AAAAAAAAA" },               { "letter": "H", "word": "HELLO" },                { "letter": "G", "word": "LONG" },                       { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },   { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },
                    { "letter": "D", "word": "DDDDDD" },               { "letter": "D", "word": "DDDDDD" },                { "letter": "A", "word": "AAAAAAAAA" },               { "letter": "E", "word": "HELLO" },                { "letter": "N", "word": "LONG" },                       { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },   { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },
                    { "letter": "D", "word": "DDDDDD" },               { "letter": "D", "word": "DDDDDD" },                { "letter": "A", "word": "AAAAAAAAA" },               { "letter": "L", "word": "HELLO" },                { "letter": "O", "word": "LONG" },                       { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },   { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },
                    { "letter": "E", "word": "WE" },                   { "letter": "W", "word": "WE" },                    { "letter": "A", "word": "AAAAAAAAA" },               { "letter": "L", "word": "HELLO" },                { "letter": "L", "word": "LONG" },                       { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },   { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },
                    { "letter": "A", "word": "AAAAAAAAA" },            { "letter": "A", "word": "ALPHA" },                 { "letter": "A", "word": "AAAAAAAAA" },               { "letter": "O", "word": "HELLO" },                { "letter": "S", "word": "RESET" },                      { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },   { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },
                    { "letter": "A", "word": "AAAAAAAAA" },            { "letter": "A", "word": "AAAAAAAAA" },             { "letter": "A", "word": "AAAAAAAAA" },               { "letter": "R", "word": "RESET" },                { "letter": "E", "word": "RESET" },                      { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },   { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },
                    { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },  { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },   { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },     { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },  { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },        { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" },   { "letter": "K", "word": "KKKKKKKKKKKKKKKKKKK" }
                ];
            case 8:
                return [
                    { "letter": "D", "word": "DDDDDD" },          { "letter": "D", "word": "DDDDDD" },          { "letter": "A", "word": "AAAAAAAAA" },          { "letter": "H", "word": "HELLO" },           { "letter": "G", "word": "LONG" },                  { "letter": "P", "word": "PPPPPP" },               { "letter": "K", "word": "KKKKKKKKKKKKK" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },    
                    { "letter": "D", "word": "DDDDDD" },          { "letter": "D", "word": "DDDDDD" },          { "letter": "A", "word": "AAAAAAAAA" },          { "letter": "E", "word": "HELLO" },           { "letter": "N", "word": "LONG" },                  { "letter": "P", "word": "PPPPPP" },               { "letter": "K", "word": "KKKKKKKKKKKKK" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },    
                    { "letter": "D", "word": "DDDDDD" },          { "letter": "D", "word": "DDDDDD" },          { "letter": "A", "word": "AAAAAAAAA" },          { "letter": "L", "word": "HELLO" },           { "letter": "O", "word": "LONG" },                  { "letter": "P", "word": "PPPPPP" },               { "letter": "K", "word": "KKKKKKKKKKKKK" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },    
                    { "letter": "E", "word": "WE" },              { "letter": "W", "word": "WE" },              { "letter": "A", "word": "AAAAAAAAA" },          { "letter": "L", "word": "HELLO" },           { "letter": "L", "word": "LONG" },                  { "letter": "P", "word": "PPPPPP" },               { "letter": "K", "word": "KKKKKKKKKKKKK" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },    
                    { "letter": "A", "word": "AAAAAAAAA" },       { "letter": "A", "word": "ALPHA" },           { "letter": "A", "word": "AAAAAAAAA" },          { "letter": "O", "word": "HELLO" },           { "letter": "S", "word": "RESET" },                 { "letter": "P", "word": "PPPPPP" },               { "letter": "K", "word": "KKKKKKKKKKKKK" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },    
                    { "letter": "A", "word": "AAAAAAAAA" },       { "letter": "A", "word": "AAAAAAAAA" },       { "letter": "A", "word": "AAAAAAAAA" },          { "letter": "R", "word": "RESET" },           { "letter": "E", "word": "RESET" },                 { "letter": "P", "word": "PPPPPP" },                { "letter": "K", "word": "KKKKKKKKKKKKK" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },     
                    { "letter": "K", "word": "KKKKKKKKKKKKK" },  { "letter": "K", "word": "KKKKKKKKKKKKK" },  { "letter": "K", "word": "KKKKKKKKKKKKK" },     { "letter": "K", "word": "KKKKKKKKKKKKK" },  { "letter": "K", "word": "KKKKKKKKKKKKK" },        { "letter": "K", "word": "KKKKKKKKKKKKK" },         { "letter": "K", "word": "KKKKKKKKKKKKK" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },
                    { "letter": "M", "word": "MMMMMMMMMMMMMMM" },  { "letter": "M", "word": "MMMMMMMMMMMMMMM" },  { "letter": "M", "word": "MMMMMMMMMMMMMMM" },     { "letter": "M", "word": "MMMMMMMMMMMMMMM" },  { "letter": "M", "word": "MMMMMMMMMMMMMMM" },        { "letter": "M", "word": "MMMMMMMMMMMMMMM" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" }                   
                 ];
            case 9:
                return [
                     { "letter": "D", "word": "DDDDDD" },          { "letter": "D", "word": "DDDDDD" },          { "letter": "A", "word": "AAAAAAAAA" },          { "letter": "H", "word": "HELLO" },           { "letter": "G", "word": "LONG" },                  { "letter": "K", "word": "KKKKKKKKKKKKKK" },   { "letter": "M", "word": "KKKKKKKKKKKKKK" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },                        { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },   
                     { "letter": "D", "word": "DDDDDD" },          { "letter": "D", "word": "DDDDDD" },          { "letter": "A", "word": "AAAAAAAAA" },          { "letter": "E", "word": "HELLO" },           { "letter": "N", "word": "LONG" },                  { "letter": "K", "word": "KKKKKKKKKKKKKK" },   { "letter": "M", "word": "KKKKKKKKKKKKKK" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },                        { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },  
                     { "letter": "D", "word": "DDDDDD" },          { "letter": "D", "word": "DDDDDD" },          { "letter": "A", "word": "AAAAAAAAA" },          { "letter": "L", "word": "HELLO" },           { "letter": "O", "word": "LONG" },                  { "letter": "K", "word": "KKKKKKKKKKKKKK" },   { "letter": "M", "word": "KKKKKKKKKKKKKK" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },                         { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" }, 
                     { "letter": "E", "word": "WE" },              { "letter": "W", "word": "WE" },              { "letter": "A", "word": "AAAAAAAAA" },          { "letter": "L", "word": "HELLO" },           { "letter": "L", "word": "LONG" },                  { "letter": "K", "word": "KKKKKKKKKKKKKK" },   { "letter": "M", "word": "KKKKKKKKKKKKKK" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },                         { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" }, 
                     { "letter": "A", "word": "AAAAAAAAA" },       { "letter": "A", "word": "ALPHA" },           { "letter": "A", "word": "AAAAAAAAA" },          { "letter": "O", "word": "HELLO" },           { "letter": "S", "word": "RESET" },                 { "letter": "K", "word": "KKKKKKKKKKKKKK" },   { "letter": "M", "word": "KKKKKKKKKKKKKK" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },                          { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" }, 
                     { "letter": "A", "word": "AAAAAAAAA" },       { "letter": "A", "word": "AAAAAAAAA" },       { "letter": "A", "word": "AAAAAAAAA" },          { "letter": "R", "word": "RESET" },           { "letter": "E", "word": "RESET" },                 { "letter": "K", "word": "KKKKKKKKKKKKKK" },   { "letter": "M", "word": "KKKKKKKKKKKKKK" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },                            { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" }, 
                     { "letter": "K", "word": "KKKKKKKKKKKKKK" },  { "letter": "K", "word": "KKKKKKKKKKKKKK" },  { "letter": "K", "word": "KKKKKKKKKKKKKK" },     { "letter": "K", "word": "KKKKKKKKKKKKKK" },  { "letter": "K", "word": "KKKKKKKKKKKKKK" },        { "letter": "K", "word": "KKKKKKKKKKKKKK" },   { "letter": "M", "word": "KKKKKKKKKKKKKK" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },                            { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" }, 
                     { "letter": "M", "word": "MMMMMMMMMMMMMMM" },  { "letter": "M", "word": "MMMMMMMMMMMMMMM" },  { "letter": "M", "word": "MMMMMMMMMMMMMMM" },     { "letter": "M", "word": "MMMMMMMMMMMMMMM" },  { "letter": "M", "word": "MMMMMMMMMMMMMMM" },        { "letter": "M", "word": "MMMMMMMMMMMMMMM" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },                   { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },
                     { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },  { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },  { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },     { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },  { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },        { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },   { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },   { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },    { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" }                  
                  ];
                  case 10:
                return [
                       { "letter": "D", "word": "DDDDDD" },              { "letter": "D", "word": "DDDDDD" },            { "letter": "A", "word": "AAAAAAAAA" },             { "letter": "H", "word": "HELLO" },              { "letter": "G", "word": "LONG" },                     { "letter": "K", "word": "KKKKKKKKKKKKKK" },      { "letter": "M", "word": "KKKKKKKKKKKKKK" },      { "letter": "M", "word": "MMMMMMMMMMMMMMM" },               { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },   { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },  
                       { "letter": "D", "word": "DDDDDD" },              { "letter": "D", "word": "DDDDDD" },            { "letter": "A", "word": "AAAAAAAAA" },             { "letter": "E", "word": "HELLO" },              { "letter": "N", "word": "LONG" },                     { "letter": "K", "word": "KKKKKKKKKKKKKK" },      { "letter": "M", "word": "KKKKKKKKKKKKKK" },      { "letter": "M", "word": "MMMMMMMMMMMMMMM" },               { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },   { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },
                       { "letter": "D", "word": "DDDDDD" },              { "letter": "D", "word": "DDDDDD" },            { "letter": "A", "word": "AAAAAAAAA" },             { "letter": "L", "word": "HELLO" },              { "letter": "O", "word": "LONG" },                     { "letter": "K", "word": "KKKKKKKKKKKKKK" },      { "letter": "M", "word": "KKKKKKKKKKKKKK" },      { "letter": "M", "word": "MMMMMMMMMMMMMMM" },               { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },   { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },
                       { "letter": "E", "word": "WE" },                  { "letter": "W", "word": "WE" },                { "letter": "A", "word": "AAAAAAAAA" },             { "letter": "L", "word": "HELLO" },              { "letter": "L", "word": "LONG" },                     { "letter": "K", "word": "KKKKKKKKKKKKKK" },      { "letter": "M", "word": "KKKKKKKKKKKKKK" },      { "letter": "M", "word": "MMMMMMMMMMMMMMM" },               { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },   { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },
                       { "letter": "A", "word": "AAAAAAAAA" },           { "letter": "A", "word": "ALPHA" },             { "letter": "A", "word": "AAAAAAAAA" },             { "letter": "O", "word": "HELLO" },              { "letter": "S", "word": "RESET" },                    { "letter": "K", "word": "KKKKKKKKKKKKKK" },      { "letter": "M", "word": "KKKKKKKKKKKKKK" },      { "letter": "M", "word": "MMMMMMMMMMMMMMM" },               { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },   { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },
                       { "letter": "A", "word": "AAAAAAAAA" },           { "letter": "A", "word": "AAAAAAAAA" },         { "letter": "A", "word": "AAAAAAAAA" },             { "letter": "R", "word": "RESET" },              { "letter": "E", "word": "RESET" },                    { "letter": "K", "word": "KKKKKKKKKKKKKK" },      { "letter": "M", "word": "KKKKKKKKKKKKKK" },      { "letter": "M", "word": "MMMMMMMMMMMMMMM" },               { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },   { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },
                       { "letter": "K", "word": "KKKKKKKKKKKKKK" },      { "letter": "K", "word": "KKKKKKKKKKKKKK" },    { "letter": "K", "word": "KKKKKKKKKKKKKK" },        { "letter": "K", "word": "KKKKKKKKKKKKKK" },     { "letter": "K", "word": "KKKKKKKKKKKKKK" },           { "letter": "K", "word": "KKKKKKKKKKKKKK" },      { "letter": "M", "word": "KKKKKKKKKKKKKK" },      { "letter": "M", "word": "MMMMMMMMMMMMMMM" },               { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },   { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },
                       { "letter": "M", "word": "MMMMMMMMMMMMMMM" },     { "letter": "M", "word": "MMMMMMMMMMMMMMM" },   { "letter": "M", "word": "MMMMMMMMMMMMMMM" },       { "letter": "M", "word": "MMMMMMMMMMMMMMM" },    { "letter": "M", "word": "MMMMMMMMMMMMMMM" },          { "letter": "M", "word": "MMMMMMMMMMMMMMM" },     { "letter": "M", "word": "MMMMMMMMMMMMMMM" },     { "letter": "M", "word": "MMMMMMMMMMMMMMM" },               { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },   { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },
                       { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },  { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },  { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },     { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },  { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },        { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },   { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },   { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },             { "letter": "Z", "word": "ZZZZZZZZZZZZZZZZZ" },   { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },                 
                       { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },  { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },  { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },     { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },  { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },        { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },   { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },   { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },             { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" },   { "letter": "X", "word": "XXXXXXXXXXXXXXXXXXX" }
                    ];

        }



        return matrix;
    }




    // &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
    // next code for future generator matrixs

    createWordsMatrix() {
        let wordsArr = this.randomizeWords();

        let indexWord = 0;
        let count = 0;
        let matrix = new Array(this.size);
        let remainWords = wordsArr.length;
        while (indexWord < remainWords && count < 100000) {
            count++;

            let randomedIndex = Game.randomInteger(0, this.size);
            if (typeof (matrix[randomedIndex]) !== "undefined") {
                if (this.tryToSetWord(indexWord, randomedIndex) == true) {
                    indexWord++;
                }

            }

        }
        console.log(wordsArr);
    }

    tryToSetWord(indexWord, startPointIndex) {
        let lengthWord = wordsArr.length;
        for (let indexLetter = 0; indexLetter < lengthWord; indexLetter++) {
            matrix[i] = wordsArr[index][indexLetter];
        }
    }

    randomizeWords() {
        const tryToFindNextLengthWords = this.takeRandomLengthArrToFindWords();
        const uniqeLengthWords = this.getUniqeLengthWords(tryToFindNextLengthWords);
        const wordsSortByLength = this.getFilterWordData(tryToFindNextLengthWords, uniqeLengthWords);

        let resultWordsArr = [];

        tryToFindNextLengthWords.forEach((wordLength, i) => {
            let index = uniqeLengthWords.indexOf(wordLength);
            resultWordsArr.push(wordsSortByLength[index][Game.randomInteger(1, wordsSortByLength[index].length)])
        });

        return resultWordsArr;
    }
    getUniqeLengthWords(tryToFindNextLengthWords) {
        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }
        return tryToFindNextLengthWords.filter(onlyUnique);
    }

    getFilterWordData(tryToFindNextLengthWords, uniqeLengthWords) {
        // deleting all word who can't be in our fill-word
        let sortedWordsByLength = [];
        for (let i = 0; i < uniqeLengthWords.length; i++) {
            sortedWordsByLength[i] = [];
        }
        this.dataWords.forEach(word => {
            if (uniqeLengthWords.indexOf(word.length) !== -1) {
                let innerArr = sortedWordsByLength[uniqeLengthWords.indexOf(word.length)];
                innerArr.push(word);
            }
        });
        this.dataWords = null;

        return sortedWordsByLength;
    }

    static randomInteger(min, max) {
        let rand = min - 0.5 + Math.random() * (max - min + 1)
        rand = Math.round(rand);
        return rand;
    }

    takeRandomLengthArrToFindWords() {
        let resultLength = [];
        let remainingLetters = this.leftLetters;
        while (remainingLetters > 0) {
            let findNextWordQualityLetters;
            if (remainingLetters >= 3) {
                let max = remainingLetters;
                if (max > 10) {
                    max = 10;
                }
                findNextWordQualityLetters = Game.randomInteger(3, max)
                remainingLetters = remainingLetters - findNextWordQualityLetters;
                resultLength.push(findNextWordQualityLetters);
            }
            else {
                if (remainingLetters !== 0) {
                    remainingLetters = remainingLetters + resultLength.pop();
                }
            }
        }
        return resultLength;
    }

}