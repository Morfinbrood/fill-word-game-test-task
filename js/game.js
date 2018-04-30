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
        const size = GameInterface.getSizeFromUserInput();
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
        this.wordscore_guessed_words = 0;
        this.name_localStorage = 'game_records-' + this.size;
        this.selectedLetters = [];
        this.letterStyleWidth = "width: " + 100 / this.size + "%;";
        this.padding_botSize = "padding-bottom: " + 100 / this.size + "%;";
        this.styleOfLetter = "float: left; height: 0; position: relative;" + this.letterStyleWidth + this.padding_botSize;
    }

    createGame() {
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
        for (let i = 0; i < size**2; i++) {
            this.createHTMLElementOfLetter("letter-" + i, i + 1);
        }
        this.applying_CSS_to_letters(this.styleOfLetter);
        this.fillTheGameField("assssssss");
    }

    autofocusTheFirstLetter() {
        const theFirstCard = document.getElementById("letter-0");
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

    fillTheGameField(letter) {
        const fields = document.getElementsByClassName("letter");
        for (let i = 0; i < fields.length; i++) {
            fields[i].textContent = letter;
        }
    }

    tryToSelect(currentCard_id) {
        this.flipLogic(currentCard_id);
    }

    flipLogic(currentCard_id) {
        this.select(currentCard_id);
    }

    select(id) {
        this.htmlAttrToggle(id, "class", "letter", "letter selected");
    }

    deactivateOnClickElem(id) {
        document.getElementById(id).removeAttribute("OnClick");
    }

    fade_in_letter_container(id) {
        document.getElementById(id).parentElement.setAttribute("class", "letter-container fade-in");
    }

    htmlAttrToggle(id, attr, toggleClassOn, toggleClassOff) {
        const letter = document.getElementById(id);
        if (letter.getAttribute(attr) === toggleClassOn) {
            letter.setAttribute(attr, toggleClassOff);
        } else {
            letter.setAttribute(attr, toggleClassOn);
        }
    }

    getBackgImgCard(id) {
        const frontCard = document.getElementById(id).firstElementChild;
        return frontCard.style.background;;
    }

    chkWinCondition() {
        return this.wordscore_guessed_words === this.size / 2;
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

    flipBothCardsWithDelay(id1, id2, ms) {
        const that = this;
        function enabler() {
            that.select(id1);
            that.select(id2);
        }
        setTimeout(enabler, ms);
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
                let name = document.createElement('div');
                name.setAttribute("class", "record-name");
                if (recordObj.user_data.first_name === "" && recordObj.user_data.last_name === "") {
                    name.textContent = "non registred player"
                } else {
                    name.textContent = recordObj.user_data.first_name + " " + recordObj.user_data.last_name;
                }
                listElem.appendChild(time);
                listElem.appendChild(name);
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

}