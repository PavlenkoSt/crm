Vue.createApp({
    data: () => ({
        bill: 15000,
        content: [
            { name: 'Добавить', show: true },
            { name: 'Статистика', show: false },
            { name: 'Бюджет', show: false },
        ],
        tab: 'plus',
        activeInputs: [
            { name: 'add', active: false, value: '' },
            { name: 'from', active: false, value: '' },
            { name: 'into', active: false, value: '' },
            { name: 'info', active: false, value: '' },
        ],
        allTransaction: [],
        stat: 'journal',
    }),
    methods: {
        changeActiveItem(index) {
            this.content.forEach((el, i) => {
                if (i == index) {
                    el.show = true;
                } else {
                    el.show = false;
                }
            });
        },
        activeAddTab(str) {
            this.activeInputs[1].value = '';
            this.activeInputs[1].active = false;
            this.activeInputs[2].value = '';
            this.activeInputs[2].active = false;
            this.tab = str;
        },
        inputTransactSum($event) {
            if ($event.keyCode == 46 || $event.keyCode == 8 || $event.keyCode == 9 || $event.keyCode == 27 ||
                ($event.keyCode == 65 && $event.ctrlKey === true) ||
                ($event.keyCode >= 35 && $event.keyCode <= 39)) {
                return;
            } else {
                if (($event.keyCode < 48 || $event.keyCode > 57) && ($event.keyCode < 96 || $event.keyCode > 105)) {
                    $event.preventDefault();
                }
            }
        },
        deactivateAddInput(index) {
            if (this.activeInputs[index].value == '') {
                this.activeInputs[index].active = false;
            }
        },
        activateAddInput(index) {
            this.activeInputs[index].active = true;
        },
        setTransaction() {
            let sum = this.activeInputs[0].value
            if (sum == '') {
                this.message('Ошибка! Пожалуйста, введите сумму');
                return false;
            }
            let type;
            let target;
            let desc = this.activeInputs[3].value;
            let date = this.getDate();
            if (this.tab == 'plus') {
                type = 'Доход';
                target = this.activeInputs[1].value;
            } else {
                type = 'Расход';
                target = this.activeInputs[2].value;
            }
            this.allTransaction.unshift({
                type: type,
                target: target,
                desc: desc,
                sum: sum,
                date: date,
            });
            this.setHistoryToLocalStorage();
            this.setBillToLocalStorage();
            this.changeBill(sum, type);
            this.message('Запись успешно добавлена');
            this.clearInputs();
        },
        removeTransaction(index) {
            let item = this.allTransaction[index];
            if (item.type == 'Расход') {
                this.bill += +item.sum;
            }
            if (item.type == 'Доход') {
                this.bill -= +item.sum;
            }
            this.allTransaction.splice(index, 1);
            this.setBillToLocalStorage();
            this.setHistoryToLocalStorage();
            this.message('Запись успешно удалена');
        },
        changeBill(sum, type) {
            if (type == 'Доход') {
                this.bill += +sum;
            }
            if (type == 'Расход') {
                this.bill -= +sum;
            }
            this.setBillToLocalStorage();
            this.setHistoryToLocalStorage();
        },
        clearInputs() {
            this.activeInputs.forEach(el => {
                el.active = false;
                el.value = '';
            });
        },
        message(mess) {
            M.toast({ html: mess });
        },
        getDate() {
            let date = new Date();
            return this.setZero(date.getDate()) + '.' + this.setZero(date.getMonth()) + '.' + this.setZero(date.getFullYear());
        },
        setZero(num) {
            if (+num <= 9) {
                num = 0 + num.toString();
            }
            return num;
        },
        setHistoryToLocalStorage() {
            localStorage.setItem('history', JSON.stringify(this.allTransaction));
        },
        getHistoryFromLocalStorage() {
            let history = JSON.parse(localStorage.getItem('history'));
            if (history) {
                this.allTransaction = history;
            }
        },
        setBillToLocalStorage() {
            localStorage.setItem('bill', JSON.stringify(this.bill));
        },
        getBillFromLocalStorage() {
            let bill = JSON.parse(localStorage.getItem('bill'));
            if (bill) {
                this.bill = bill;
            }
        },
    },
    computed: {
        uahBill() {
            return this.bill + ' ₴';
        },
    },
    mounted() {
        this.getHistoryFromLocalStorage();
        this.getBillFromLocalStorage();
    }
}).mount('#app');
