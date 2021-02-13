Vue.component('line-chart', {
    name: 'line-chart',
    extends: VueChartJs.Pie,
    data: () => ({
        transactions: [],
        transactionsSet: [],
        labels: [],
        data: [],
        bgColors: [],
        sel: '',
    }),
    methods: {
        removeZero(num) {
            if (+num <= 9) {
                num = num[1];
            }
            return num;
        },
        dateValid(selectVal, date) {
            let curDate = new Date();
            let arr = date.split('.');
            let dateTransact = new Date(arr.reverse().reverse().join(','));
            switch (selectVal) {
                case 'day':
                    if (this.removeZero(arr[0]) == curDate.getDate() && this.removeZero(arr[1]) == curDate.getMonth() && this.removeZero(arr[2]) == curDate.getFullYear()) {
                        return true;
                    }
                    return false;
                case 'week':
                    let weekStart = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate() - 7);
                    if (curDate - dateTransact < curDate - weekStart) {
                        return true;
                    }
                    return false;
                case 'month':
                    let monthStart = new Date(curDate.getFullYear(), curDate.getMonth() - 1, curDate.getDate());
                    if (curDate - dateTransact < curDate - monthStart) {
                        return true;
                    }
                    return false;
                case 'year':
                    let yearStart = new Date(curDate.getFullYear() - 1, curDate.getMonth(), curDate.getDate());
                    if (curDate - dateTransact < curDate - yearStart) {
                        return true;
                    }
                    return false;
            }
            return false;
        },
        getHistory() {
            let history = JSON.parse(localStorage.getItem('history'));
            if (history) {
                history.forEach(el => {
                    this.transactions.push(el);
                });
            }
            this.getData();
        },
        getData() {
            if (this.transactions.length) {
                this.transactions.forEach((el, i) => {
                    if (el.type == this.report && this.dateValid(this.select, el.date)) {
                        if (this.labels.length && this.labels.includes(el.target)) {
                            let index = this.labels.indexOf(el.target);
                            this.data[index] = (+this.data[index] + +el.sum).toString();
                        } else {
                            this.labels.push(el.target);
                            this.data.push(el.sum);
                            this.bgColors.push(el.color);
                        }
                    }
                });
            }
        },
    },
    mounted() {
        this.sel = M.FormSelect.init(document.querySelector('#select'));
        this.getHistory();
        this.renderChart({
            labels: this.labels,
            datasets: [
                {
                    backgroundColor: this.bgColors,
                    data: this.data,
                }
            ]
        }, { responsive: true, maintainAspectRatio: false, })
    },
    beforeDestroy() {
        this.sel.destroy();
        this.sel = '';
    },
    props: ['report', 'select'],
})

const app = new Vue({
    el: '#app',
    data: () => ({
        bill: 0,
        content: [
            { name: 'Добавить', show: true },
            { name: 'Статистика', show: false },
            { name: 'Бюджет', show: false },
        ],
        chartComputedWidth: 280,
        tab: 'plus',
        activeInputs: [
            { name: 'add', active: false, value: '' },
            { name: 'from', active: false, value: '' },
            { name: 'into', active: false, value: '' },
            { name: 'info', active: false, value: '' },
            { name: 'task', active: false, value: '' },
            { name: 'taskSum', active: false, value: '' },
            { name: 'category', active: false, value: '' },
            { name: 'limit', active: false, value: '' },
            { name: 'days', active: false, value: '' },
        ],
        allTransaction: [],
        stat: 'journal',
        report: 'Доход',
        diagram: true,
        select: 'day',
        plan: 'plan',
        plans: [],
        limits: [],
        load: false,
        mobileActiveMenu: false,
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
            if (this.mobileActiveMenu == true) {
                this.mobileActiveMenu = false;
            }
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
            let color = this.getRandomColor();
            let desc = this.activeInputs[3].value;
            let date = this.getDate();
            if (this.tab == 'plus') {
                type = 'Доход';
                target = this.activeInputs[1].value;
            } else {
                type = 'Расход';
                target = this.activeInputs[2].value;
                this.limits.forEach(limit => {
                    if (limit.category == target && this.dateLimitCalc(limit.days, limit.date) > 0) {
                        limit.currentVal += +sum;
                        this.setLimitsToLocalStorage();
                    }
                });
            }
            this.allTransaction.unshift({
                type: type,
                target: target,
                desc: desc,
                sum: sum,
                date: date,
                color: color,
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
                this.limits.forEach(limit => {
                    if (limit.category == item.target) {
                        limit.currentVal -= +item.sum;
                        this.setLimitsToLocalStorage();
                    }
                });
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
            if (bill || bill == 0) {
                this.bill = bill;
            } else {
                document.addEventListener('DOMContentLoaded', function () {
                    let greetModal = M.Modal.init(document.querySelector('#modal2'));
                    greetModal.open();
                });
                this.setBillToLocalStorage();
            }
        },
        updateDiagram(str) {
            this.report = str;
            this.diagram = false;
            setTimeout(() => {
                this.diagram = true;
            }, 0);
        },
        getRandomColor() {
            return 'rgb(' + Math.floor(Math.random() * 255) + ', ' + Math.floor(Math.random() * 255) + ', ' + Math.floor(Math.random() * 255) + ')';
        },
        selectedChangeHandler() {
            this.diagram = false;
            setTimeout(() => {
                this.diagram = true;
            }, 0);
        },
        setNewTask() {
            if (this.activeInputs[4].value && this.activeInputs[5].value) {
                this.plans.push({
                    name: this.activeInputs[4].value,
                    sum: this.activeInputs[5].value,
                    done: false,
                });
                this.setTasksToLocalStorage();
                this.message('Задача успешно добавлена');
                this.clearInputs();
            } else {
                this.message('Ошибка! Заполните пустые поля');
            }
        },
        removeTask(index) {
            this.plans.splice(index, 1);
            this.setTasksToLocalStorage();
            this.message('Задача успешно удалена');
        },
        setTasksToLocalStorage() {
            localStorage.setItem('task', JSON.stringify(this.plans));
        },
        getTasksFromLocalStorage() {
            let task = JSON.parse(localStorage.getItem('task'));
            if (task) {
                this.plans = task;
            }
        },
        calcLine(sum) {
            let result = Math.round((this.bill / sum) * 100);
            if (result > 100) {
                return '100%';
            }
            return result + '%';
        },
        changeCheckTask() {
            localStorage.setItem('task', JSON.stringify(this.plans));
        },
        setLimit() {
            if (this.activeInputs[6].value && this.activeInputs[7].value && this.activeInputs[8].value) {
                let date = new Date();
                let year = date.getFullYear();
                let month = date.getMonth();
                let day = date.getDate();
                let deadline = this.packDateForLimit(new Date(year, month, day + +this.activeInputs[8].value));
                let dateCur = this.packDateForLimit(new Date());
                this.limits.push({
                    category: this.activeInputs[6].value,
                    limit: this.activeInputs[7].value,
                    days: deadline,
                    currentVal: 0,
                    date: dateCur,
                });
                this.message('Лимит успешно добавлен');
                this.setLimitsToLocalStorage();
                this.clearInputs();
            } else {
                this.message('Ошибка! Заполните пустые поля');
            }
        },
        packDateForLimit(date) {
            return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
        },
        unpackDateForLimit(date) {
            let arr = date.split('-');
            return new Date(arr[0], arr[1], arr[2]);
        },
        dateLimitCalc(days) {
            let dateCur = new Date();
            let diff = Math.ceil((this.unpackDateForLimit(days) - dateCur) / 60 / 60 / 24 / 1000);
            if (diff >= 0) {
                return diff;
            } else {
                return 0;
            }
        },
        removeLimit(index) {
            this.limits.splice(index, 1);
            this.setLimitsToLocalStorage();
            this.message('Лимит успешно удален');
        },
        calcLimitLine(currentVal, limit) {
            let result = Math.round((currentVal / limit) * 100);
            if (result > 100) {
                return '100%';
            }
            return result + '%';
        },
        setLimitsToLocalStorage() {
            localStorage.setItem('limits', JSON.stringify(this.limits));
        },
        getLimitsFromLocalStorage() {
            let limits = JSON.parse(localStorage.getItem('limits'));
            if (limits) {
                this.limits = limits;
            }
        },
        modalCancel() {
            let elem = document.querySelector('#modal-input');
            elem.value = this.bill;
        },
        modalOk() {
            let elem = document.querySelector('#modal-input');
            this.bill = +elem.value;
            this.setBillToLocalStorage();
        },
        setFirstBill() {
            let elem = document.querySelector('#input-init-bill');
            this.bill = +elem.value;
            this.setBillToLocalStorage();
        },
    },
    computed: {
        chartWidth() {
            return {
                width: `${this.chartComputedWidth}px`,
                position: 'relative'
            }
        }
    },
    filters: {
        uah(val) {
            return val + ' ₴';
        },
    },
    mounted() {
        document.addEventListener('DOMContentLoaded', function () {
            M.Modal.init(document.querySelector('#modal1'));
        });
        this.getHistoryFromLocalStorage();
        this.getBillFromLocalStorage();
        this.getTasksFromLocalStorage();
        this.getLimitsFromLocalStorage();
        this.load = true;
    },
});

