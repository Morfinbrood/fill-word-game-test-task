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

    static flip(id) {
        this.game_match.tryToFlip(id);
    }

    static pressEnterOnFocusCard(id) {
        if (event.code === 'Enter') {
            GameInterface.flip(id);
        }
    }

    static startGame() {
        const size = GameInterface.getSizeFromUserInput();
        const user_data = GameInterface.getUserDataFromInputs();
        this.game_match = new Game(size, this.cardBack, user_data);
        this.game_match.createGame();
    }

}

class Game {
    constructor(size, cardBack = "img/cardBacks/cardBack-1.jpg", user_data) {
        this.user_data = user_data;
        this.size = size;
        this.pictureCollection = [];
        this.cardBack = cardBack;
        this.time = 0;
        this.setTimeOutTimer;
        this.flippedImgId = "none";
        this.enableFlip = true;
        this.score_guessed_cards = 0;
        this.name_localStorage = 'game_records-' + this.size;
    }

    createGame() {
        this.changeScene("main-menu_id", "game-scene_id");
        this.setPictureCollectionDoubled("img/cards/", this.size / 2);
        this.shuffleCollection(this.pictureCollection);
        this.buildGameField(this.size);
        this.autofocusTheFirstCard();
        this.startTimer();
    }

    changeScene(currentScene, nextScene) {
        document.getElementById(currentScene).hidden = true;
        document.getElementById(nextScene).hidden = false;
    }

    //pictures must named as 1.jpg 2.jpg and etc
    setPictureCollectionDoubled(dir, quantity) {
        for (let i = 1; i <= quantity; i++) {
            this.pictureCollection.push(dir + i + ".jpg");
            this.pictureCollection.push(dir + i + ".jpg");
        }
    }

    shuffleCollection(arrCollection) {
        function compareRandom(a, b) { return Math.random() - 0.5; }
        for (let i = 0; i < 100; i++) {
            arrCollection.sort(compareRandom);
        }
    }

    buildGameField(size) {
        for (let i = 0; i < size; i++) {
            this.createHTMLCard("card-" + i, i + 1);
        }
        this.applying_CSS_cardBack(this.cardBack);
        this.applying_CSS_frontImgs(this.pictureCollection);
    }

    autofocusTheFirstCard() {
        const theFirstCard = document.getElementById("card-0");
        theFirstCard.focus();
    }

    createHTMLCard(id, number_from_id_for_tab) {
        const newFrontCard = document.createElement('figure');
        newFrontCard.setAttribute("class", "front");
        const newBackCard = document.createElement('figure');
        newBackCard.setAttribute("class", "back");
        const newCard = document.createElement('div');
        newCard.setAttribute("class", "card flipped");
        newCard.setAttribute("id", id);
        newCard.setAttribute("OnClick", "GameInterface.flip('" + id + "')");
        newCard.setAttribute("tabindex", number_from_id_for_tab);
        newCard.setAttribute("onkeydown", "GameInterface.pressEnterOnFocusCard('" + id + "')");
        newCard.appendChild(newFrontCard);
        newCard.appendChild(newBackCard);
        const newSection = document.createElement('section');
        newSection.setAttribute("class", "card-container");
        newSection.appendChild(newCard);
        document.getElementById("game-scene_id").appendChild(newSection);
    }

    applying_CSS_cardBack(cardsBack) {
        const backCards = document.getElementsByClassName("back");
        for (let i = 0; i < backCards.length; i++) {
            backCards[i].setAttribute("style", "background: url(" + this.cardBack + ") no-repeat; background-size: contain;");
        }
    }

    applying_CSS_frontImgs(collection) {
        for (let i = 0; i < collection.length; i++) {
            let frontCard = document.getElementById("card-" + i).firstElementChild;
            frontCard.setAttribute("style", "background: url(" + collection[i] + ") no-repeat; background-size: contain;");
        }
    }

    tryToFlip(currentCard_id) {
        if (this.enableFlip === true) {
            this.flipLogic(currentCard_id);
        }
        else {
            // add disable flip sound
        }
    }

    // flipLogic = this game logic
    flipLogic(currentCard_id) {
        // flipAnimationDuration can disable next card flipping to chosen delay
        // i more like this game behaviour with flipAnimationDuration=0, but my last mentor more like with 2000ms
        const flipAnimationDuration = 2000;
        // if all cards not flipped
        if (this.flippedImgId === "none") {
            this.flippedImgId = currentCard_id;
            this.flip(currentCard_id);
        }
        else {
            if (currentCard_id !== this.flippedImgId) {
                // if first flipped card === current flipped card
                if (this.getBackgImgCard(currentCard_id) === this.getBackgImgCard(this.flippedImgId)) {
                    this.flip(currentCard_id);
                    this.deactivateOnClickElem(currentCard_id);
                    this.deactivateOnClickElem(this.flippedImgId);
                    this.fade_in_card_container(this.flippedImgId);
                    this.fade_in_card_container(currentCard_id);
                    this.flippedImgId = "none";
                    this.score_guessed_cards++;
                }
                else {
                    // if first flipped card != current flipped card
                    this.flip(currentCard_id);
                    this.flipDisablerOnTime(flipAnimationDuration * 2);
                    this.flipBothCardsWithDelay(currentCard_id, this.flippedImgId, flipAnimationDuration);
                    this.flippedImgId = "none";
                }
            }
        }
        if (this.chkWinCondition()) {
            clearTimeout(this.setTimeOutTimer);
            this.chkAndUpdateTop10LocalStorageRecords(this.name_localStorage, this.time, this.user_data);
            this.showWinSceneWithDelay(2000);
        };
    }

    flip(id) {
        this.htmlAttrToggle(id, "class", "card", "card flipped");
    }

    deactivateOnClickElem(id) {
        document.getElementById(id).removeAttribute("OnClick");
    }

    fade_in_card_container(id) {
        document.getElementById(id).parentElement.setAttribute("class", "card-container fade-in");
    }

    htmlAttrToggle(id, attr, toggleClassOn, toggleClassOff) {
        const card = document.getElementById(id);
        if (card.getAttribute(attr) === toggleClassOn) {
            card.setAttribute(attr, toggleClassOff);
        } else {
            card.setAttribute(attr, toggleClassOn);
        }
    }

    getBackgImgCard(id) {
        const frontCard = document.getElementById(id).firstElementChild;
        return frontCard.style.background;;
    }

    chkWinCondition() {
        return this.score_guessed_cards === this.size / 2;
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

    flipDisablerOnTime(ms) {
        this.enableFlip = false;
        const that = this;
        function enabler() {
            that.enableFlip = true;
        }
        setTimeout(enabler, ms);
    }

    flipBothCardsWithDelay(id1, id2, ms) {
        const that = this;
        function enabler() {
            that.flip(id1);
            that.flip(id2);
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