//Returns current date
Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});

toggleSidebar = () => { 
    if(sidebarShown){
        document.getElementsByTagName("body")[0].classList.remove("lock-scroll");
        menu.classList.remove("show");
        hamburgerBtn.classList.remove("close-btn");
        hamburgerBtnLines.forEach(line => {
            line.classList.remove("close-btn-line");
        });

        if(window.innerWidth >= 920){
            Wrapper.classList.remove("sidebar-opened");
        }

        sidebarShown = false;
    }
    else {
        document.getElementsByTagName("body")[0].classList.add("lock-scroll");
        menu.classList.add("show");
        hamburgerBtn.classList.add("close-btn");
        hamburgerBtnLines.forEach(line => {
            line.classList.add("close-btn-line");
        });

        if(window.innerWidth >= 920){
            Wrapper.classList.add("sidebar-opened");
        }

        sidebarShown = true;
    }
}

emptyTransactionsContainer = () => {
    transactionsTable.lastElementChild.remove();
}

compareAsc = ( a, b ) => {
    if ( parseFloat(a.transactionCost) < parseFloat(b.transactionCost) ){
        return -1;
    }
    if ( parseFloat(a.transactionCost) > parseFloat(b.transactionCost) ){
        return 1;
    }
        return 0;
}

compareDsc = ( a, b ) => {
    if ( parseFloat(a.transactionCost) > parseFloat(b.transactionCost) ){
        return -1;
    }
    if ( parseFloat(a.transactionCost) < parseFloat(b.transactionCost) ){
        return 1;
    }
        return 0;
}


sortTransactions = (option) => {  
    console.log("ok")
    emptyTransactionsContainer();
    let transactions = JSON.parse(localStorage.getItem("transactions"));
    let order = option.getAttribute("data-order");

    transactions = order == "dsc" ? transactions.sort(compareDsc) :
        transactions.sort(compareAsc);

    populateTransactionsContainer(transactions);
    resizeTable();
}


recalculateExpenses = () => {
    let transactions = JSON.parse(localStorage.getItem("transactions"));
    let e = 0;

    transactions.forEach(element => {
        let month = removeLeadingZerosFromPrice((element.transactionDate).substr(5, 2)) - 1;
        if(month == new Date().getMonth())
            e += parseFloat(element.transactionCost);
    });

    document.querySelector(".expenses").innerHTML = e + " " + currency;

    localStorage.setItem("expenses", JSON.stringify(e));
}

editTransaction = (e) => {
    let id = e.target.getAttribute("data-transaction-id");
    let transactions = JSON.parse(localStorage.getItem("transactions"));

    let store = document.getElementById("store-input");
    let cost = document.getElementById("cost-input");
    let date = document.getElementById("date-input");
    let alertMessage = document.querySelector(".alert");

    if(store.value == "" || cost.value < 0 || cost.value == "" || date.value == ""){
        alertMessage.classList.add("alert-error");
        alertMessage.innerHTML = "Error with saving transaction!";
        return;
    }

    let object, index;

    transactions.forEach((element, i) => {
        if(id == parseInt(element.id)){
            object = element;
            index = i;
            return;
        }
    });

    object.transactionStore = document.getElementById("store-input").value;
    object.transactionCategory = document.getElementById("category-input").value;
    object.transactionMethod = document.getElementById("type-drpdwn").value;
    object.transactionCost = document.getElementById("cost-input").value;
    object.transactionDate = document.getElementById("date-input").value;

    transactions[index] = object;

    localStorage.setItem("transactions", JSON.stringify(transactions));

    transactionModal.style.display = "none";

    emptyTransactionsContainer();
    populateTransactionsContainer();
    if(expensesDiv){
        recalculateExpenses();
        displayLineChart();
        displayBarChart();
    }
        
    resizeTable();
} 

openTransactionModal = (tr) => {
    let id = tr.getAttribute("data-table-row");
    transactionModal.style.display = "block";
    document.querySelector(".alert").classList.remove("alert-error");
    
    let transactions = JSON.parse(localStorage.getItem("transactions"));
    let object;

    transactions.forEach(element => {
        if(id == parseInt(element.id)){
            object = element;
            return;
        }
    });

    document.getElementById("store-input").value = object.transactionStore;
    document.getElementById("category-input").value = object.transactionCategory;;
    document.getElementById("type-drpdwn").value = object.transactionMethod;
    document.getElementById("cost-input").value = object.transactionCost;
    document.getElementById("date-input").value = object.transactionDate;
    
    let editBtn = document.getElementById("edit-btn");
    editBtn.setAttribute("data-transaction-id", id);
    editBtn.addEventListener("click", editTransaction);

    let deleteBtn = document.getElementById("delete-btn");
    deleteBtn.setAttribute("data-transaction-id", id);
    deleteBtn.addEventListener("click", deleteTransaction);
}

populateTransactionsContainer = (transactions = null) => {
    if(!isStorageAvailable()){
        alert("Storage not available, can't display transactions!");
        return;
    }

    if(!transactions)
        transactions = JSON.parse(localStorage.getItem("transactions"));
    
    let limit = transactionsTable.getAttribute("data-limit");
    let count = 0;

    let tbody = document.createElement("tbody");
    transactionsTable.appendChild(tbody);

    transactions.forEach(object => {
        if(limit && count >= limit)
            return;

        let tr = document.createElement("tr");
        tr.setAttribute("data-table-row", object.id);
        tr.addEventListener("click", function(){
            openTransactionModal(this);
        });
        tbody.append(tr);

        let transaction = document.createElement("td");
        transaction.innerHTML = object.transactionStore;
        transaction.classList.add("hidden");
        tr.appendChild(transaction);

        let category = document.createElement("td");
        category.innerHTML = object.transactionCategory;
        tr.appendChild(category);

        let date = document.createElement("td");

        let clockIcon = document.createElement("i");
        clockIcon.className = "far fa-clock";
        date.appendChild(clockIcon);

        date.innerHTML += " " + object.transactionDate;
        tr.appendChild(date);

        let payment = document.createElement("td");
        payment.innerHTML = object.transactionMethod;
        payment.classList.add("hidden");
        tr.appendChild(payment);

        let amount = document.createElement("td");
        amount.innerHTML = object.transactionCost;
        tr.appendChild(amount);

        count++;
    });
}

deleteTransaction = (e) => {
    let isConfirmed = confirm("Are you sure?");

    if(isConfirmed){
        let id = e.target.getAttribute("data-transaction-id");
        let transactions = JSON.parse(localStorage.getItem("transactions"));

        if(transactions.length > 1){
            let index;

            transactions.forEach((element, i) => {
                if(id == parseInt(element.id)){
                    console.log(i);
                    index = i;
                    return;
                }
            });

            transactions.splice(index, 1);
        }
        else
            transactions = [];

        localStorage.setItem("transactions", JSON.stringify(transactions));

        transactionModal.style.display = "none";

        emptyTransactionsContainer();
        populateTransactionsContainer();
        recalculateExpenses();
        displayLineChart();
        displayBarChart();
    }
}

//Saves transaction to local storage
addTransactionToStorage = (store, category, method, cost, date) => {
    let currentTransactions = JSON.parse(localStorage.getItem("transactions"));
    let transactionId = currentTransactions.length < 1 ? 0 : currentTransactions[currentTransactions.length - 1].id + 1;

    currentTransactions.push({
        id: transactionId,
        transactionStore: store,
        transactionCategory: category,
        transactionMethod: method,
        transactionCost: cost,
        transactionDate: date,
    });

    localStorage.setItem("transactions", JSON.stringify(currentTransactions));
    
    let month = removeLeadingZerosFromPrice((currentTransactions[currentTransactions.length - 1].transactionDate).substr(5, 2)) - 1;
    if(month == new Date().getMonth()){
        let currentExpenses = JSON.parse(localStorage.getItem("expenses"));
    expenses = (+currentExpenses) + (+cost);
    localStorage.setItem("expenses", JSON.stringify(Math.round(expenses * 100) / 100));
    }
}

//Creates alert message for (in)valid transaction
createAlertPopup = (alertElement, message, success) => {
    if(success){
        alertElement.classList.remove("alert-error");
        alertElement.classList.add("alert-success");
    }
    else{
        alertElement.classList.add("alert-error");
        alertElement.classList.remove("alert-success");
    }

    alertElement.innerHTML = message;
}

//Checks if inputed transaction is valid
checkTransaction = () => {
    let store = document.getElementById("store-input");
    let transCategory = document.getElementById("category-input");
    let paymentMethod = document.getElementById("type-drpdwn");
    let cost = document.getElementById("cost-input");
    let date = document.getElementById("date-input");
    let alertMessage = document.querySelector(".alert");

    if(store.value < 1){
        createAlertPopup(alertMessage, "Missing store name!", false);
        return;
    }
    else if(cost.value < 0 || cost.value == ""){
        createAlertPopup(alertMessage, "Invalid cost value!", false);
        return;
    }
    else if(date.value < 1){
        createAlertPopup(alertMessage, "Invalid transaction date!", false);
        return;
    }

    if(isStorageAvailable()){
        addTransactionToStorage(store.value, transCategory.value, paymentMethod.value, removeLeadingZerosFromPrice(cost.value), date.value);
        
        document.querySelector(".add-transaction-container .alert").classList.add("show-element");
        
        store.value = "";
        cost.value = "";
        date.value = new Date().toDateInputValue();

        createAlertPopup(alertMessage, "Transaction was successfully added!", true);
    }
    else{
        alert("Storage not available, saving transaction failed!");
    }
}

removeLeadingZerosFromPrice = (price) => price.replace(/^0+/, '');

isStorageAvailable = () => storageAvailable;

isTransactionObjectNull = () => JSON.parse(localStorage.getItem("transactions")) === null;

createTransactionObject = () => {
    localStorage.setItem("transactions", JSON.stringify([]))
};

displayLocalVariables = () => {
    expensesDiv.innerHTML = expenses + " " + currency;
    if(limit == "0")
        limitDiv.innerHTML = "/";
    else
        limitDiv.innerHTML = limit + " " + currency;
}

//Returns object filled with months(keys) and their expenses(value)
getExpensesPerMonth = () => {
    let transactions = JSON.parse(localStorage.getItem("transactions"));
    let expensesMonths = {};

    months.forEach(month => {
        expensesMonths[month] = 0;
    });

    transactions.forEach(element => {
        let month = months[removeLeadingZerosFromPrice((element.transactionDate).substr(5  , 2)) - 1];

        if(Object.keys(expensesMonths).indexOf(month) > -1){
            expensesMonths[month] += (+element.transactionCost);
        }
        else{
            expensesMonths[month] = parseFloat(element.transactionCost);
        }
    });

    return expensesMonths;
}

//Return max expense out of all the months
getMaxExpense = (expensesObject) => {
    let maxExpense = 0;
    Object.keys(expensesObject).forEach(element => {
        if(expensesObject[element] > maxExpense)
            maxExpense = expensesObject[element];
    });

    return (Math.round(maxExpense));
}

//Sets the month text labels to correct months
lineChartSetMonths = () => {
    let currentMonthIndex = new Date().getMonth();
    
    let monthTexts = document.querySelectorAll(".graph-month");
    for(let i = monthTexts.length - 1; i >= 0; i--){
        monthTexts[i].innerHTML = months[currentMonthIndex--];
        if(currentMonthIndex < 0)
            currentMonthIndex = 11;
    }
}

//Sets the expense text labels to correct expanses
lineChartSetExpneses = (maxExpense) => {
    let expensesTexts = document.querySelectorAll(".graph-expense");
    expensesTexts[0].innerHTML = maxExpense;
    expensesTexts[1].innerHTML = Math.floor((maxExpense / 100) * 66);
    expensesTexts[2].innerHTML = Math.floor((maxExpense / 100) * 33);
}

//Sets the circles in a line chart to the correct place
lineChartSetCircles = (expensesMonths, maxExpense) => {
    let currentMonthIndex = new Date().getMonth();
    let graphCircles = document.querySelectorAll(".graph-circle");
    let circlePositions = [];

    for(let i = graphCircles.length - 1; i >= 0; i--){
        let monthExpense = parseInt(expensesMonths[months[currentMonthIndex--]]);
        let monthExpensePercent = monthExpense / parseInt(maxExpense);
        monthExpensePercent *= 100;
        console.log(monthExpense + ", " + monthExpensePercent, ", " + (100 - monthExpensePercent));
        
        if(monthExpensePercent >= 100){
            circlePositions.push(8);
            graphCircles[i].setAttribute("cy", 8 + "%");
        }
        else if(monthExpensePercent <= 10){
            circlePositions.push(Math.floor(100 - monthExpensePercent - 10));
            graphCircles[i].setAttribute("cy", (Math.floor(100 - monthExpensePercent - 10) + "%"));
        }
        else{
            circlePositions.push(Math.floor(100 - monthExpensePercent));
            graphCircles[i].setAttribute("cy", (Math.floor(100 - monthExpensePercent) + "%"));
        }
        
        graphCircles[i].firstElementChild.innerHTML = monthExpense;

        if(currentMonthIndex < 0)
            currentMonthIndex = 11;
    }

    lineChartSetConnections(circlePositions);
}

lineChartSetConnections = (circlePositions) => {
    let connections = document.querySelectorAll(".connection");
    let index = 0;
    for(let i = circlePositions.length - 2; i >= 0; i--){
        if(i + 1 < circlePositions.length){
            connections[index].setAttribute("y1", (circlePositions[i + 1] + "%"));
            connections[index++].setAttribute("y2", (circlePositions[i] + "%"));
        }
        
    }

    console.log(circlePositions);
}

displayLineChart = () => {
    let expensesMonths = getExpensesPerMonth();
    let maxExpense = getMaxExpense(expensesMonths);
    
    lineChartSetMonths();
    lineChartSetExpneses(maxExpense);
    lineChartSetCircles(expensesMonths, maxExpense);
}

barChartsetRect = (paymentUsage, maxUsage) => {
    let graphBars = document.querySelectorAll(".bar");

    for(let i = graphBars.length - 1; i >= 0; i--){
        let barPercent = parseInt(paymentUsage[categories[i]]) / parseInt(maxUsage);

        barPercent *= 100;
        graphBars[i].setAttribute("height", barPercent + "%");
        graphBars[i].setAttribute("y", ((90 - barPercent) + "%"));
        graphBars[i].firstElementChild.innerHTML = parseInt(paymentUsage[categories[i]]);
    }
}

barChartSetUsed= (maxUsed) => {
    let expensesTexts = document.querySelectorAll(".graph-used");
    expensesTexts[0].innerHTML = maxUsed;
    expensesTexts[1].innerHTML = Math.floor((maxUsed / 100) * 66);
    expensesTexts[2].innerHTML = Math.floor((maxUsed / 100) * 33);
}

getMaxUsed = (object) => {
    let maxUsed = 0;
    Object.keys(object).forEach(element => {
        if(object[element] > maxUsed)
            maxUsed = object[element];
    });

    return (Math.round(maxUsed) + 10);
}

getUsagePerMonth = () => {
    let transactions = JSON.parse(localStorage.getItem("transactions"));
    let categorys = {};

    categories.forEach(method => {
        categorys[method] = 0;
    })

    transactions.forEach(element => {
        categorys[(element.transactionCategory)] += 1;
    });

    return categorys;
}

displayBarChart = () => {
    if(window.innerWidth <= 600){
        document.querySelectorAll(".bar-graph .graph-label").forEach((text, i) => {
            text.innerHTML = categoriesShort[i];
        });
    }
    else {
        document.querySelectorAll(".bar-graph .graph-label").forEach((text, i) => {
            text.innerHTML = categories[i];
        });
    }

    let paymentUsage = getUsagePerMonth();
    let maxUsage = getMaxUsed(paymentUsage);
    
    barChartSetUsed(maxUsage);
    barChartsetRect(paymentUsage, maxUsage);
}

initLocalStorageVariables = () => {
    if(JSON.parse(localStorage.getItem("currency")) === null || JSON.parse(localStorage.getItem("expenses")) === null || 
     JSON.parse(localStorage.getItem("limit")) === null){
        localStorage.setItem("currency", JSON.stringify("€"));
        localStorage.setItem("expenses", JSON.stringify(0));
        localStorage.setItem("limit", JSON.stringify(0));
       }
}

initLocalVariables = () => {
    currency = JSON.parse(localStorage.getItem("currency"));
    limit = JSON.parse(localStorage.getItem("limit"));
    expenses = JSON.parse(localStorage.getItem("expenses"));
}

initFunctionalVariables = () => {
    if(JSON.parse(localStorage.getItem("darkTheme")) === null || JSON.parse(localStorage.getItem("chartColors")) === null || 
     JSON.parse(localStorage.getItem("currency")) === null){
        localStorage.setItem("darkTheme", JSON.stringify(darkThemeToggle.checked));
        localStorage.setItem("chartColors", JSON.stringify(chartColorToggle.checked));
        localStorage.setItem("currency", JSON.stringify(toggleCurrency.checked ? "€" : "$"));
     }
}

setToggleButtonEvents = () => {
    darkThemeToggle.addEventListener("change", function(){
        localStorage.setItem("darkTheme", JSON.stringify(this.checked));
        setTheme();
    });

    toggleCurrency.addEventListener("change", function(){
        localStorage.setItem("currency", JSON.stringify(this.checked ? "€" : "$"));
        initLocalVariables();
        displayLocalVariables();
    });

    chartColorToggle.addEventListener("change", function(){
        localStorage.setItem("chartColors", JSON.stringify(this.checked));
        setChartColors();
    });

    monthlyLimitInput.addEventListener("change", function(){
        localStorage.setItem("limit", JSON.stringify(this.value));
        initLocalVariables();
        displayLocalVariables();
    });
}

initToggleValues = () => {
    darkThemeToggle.checked = JSON.parse(localStorage.getItem("darkTheme"));
    chartColorToggle.checked = JSON.parse(localStorage.getItem("chartColors"));
    toggleCurrency.checked = JSON.parse(localStorage.getItem("currency")) == "€";
}

setChartColors = () => {
    let circles = document.querySelectorAll(".graph-circle");
    let connections = document.querySelectorAll(".connection");
    let bars = document.querySelectorAll(".bar");

    if(chartColorToggle.checked){
        circles.forEach(circle => circle.classList.add("lineColor"));
        connections.forEach(connection => connection.classList.add("lineColor"));
        bars.forEach(bar => bar.classList.add("barColor"));
    }
    else {
        circles.forEach(circle => circle.classList.remove("lineColor"));
        connections.forEach(connection => connection.classList.remove("lineColor"));
        bars.forEach(bar => bar.classList.remove("barColor"));
    }
}

setTheme = () => {
    let menuItems = document.querySelectorAll(".sidebar-item-link");
    let activeItem = document.querySelector(".sidebar-item-link.active");
    let navbar = document.getElementById("navbar");
    let title = document.querySelector(".title");

    if(!JSON.parse(localStorage.getItem("darkTheme"))){
        menu.classList.add("lightMenu");
        menuItems.forEach(item => item.classList.add("lightColor"));
        activeItem.classList.add("lightActive");
        navbar.classList.add("lightMenu");
        title.classList.add("lightColor");
    }
    else {
        menu.classList.remove("lightMenu");
        menuItems.forEach(item => item.classList.remove("lightColor"));
        activeItem.classList.remove("lightActive");
        navbar.classList.remove("lightMenu");
        title.classList.remove("lightColor");
    }
}

resizeTable = () => {
    if(window.innerWidth <= 600){
        document.querySelectorAll(".hidden").forEach(element => {           
            element.classList.add("sm-hide");
        });
    }
    else{
        document.querySelectorAll(".hidden").forEach(element => {
            element.classList.remove("sm-hide");
        });
    }
}

//Initializes all event listeners and other stuff
init = () => {
    if(isTransactionObjectNull())
        createTransactionObject();

    initLocalStorageVariables();

    if(darkThemeToggle && toggleCurrency && chartColorToggle && monthlyLimitInput){
        initFunctionalVariables();
        setToggleButtonEvents();
        initToggleValues();
    }

    initLocalVariables();

    if(limitDiv && expensesDiv)
        displayLocalVariables();

    if(lineGraph && barGraph){
        displayLineChart();
        displayBarChart();
    }


    if(dateInput)
        dateInput.value = new Date().toDateInputValue();

    if(transactionAddBtn)
        transactionAddBtn.addEventListener("click", checkTransaction);

    if(transactionsTable){
    
        if(transactionsTable.getAttribute("data-limit")){
            if(window.innerWidth <= 600){
                transactionsTable.setAttribute("data-limit", "4");
            }
            else if(window.innerWidth > 600 && window.innerWidth < 1500){
                transactionsTable.setAttribute("data-limit", "5");
            }
            else
                transactionsTable.setAttribute("data-limit", "8");
        }
        
    
        populateTransactionsContainer();
        resizeTable();
    }
            
        


    hamburgerBtn.addEventListener("click", toggleSidebar);

    if(closeModalBtn){
        closeModalBtn.addEventListener("click", function(){
            transactionModal.style.display = "none";
        });
    }

    if(sortOptions){
        sortOptions.forEach(option => option.addEventListener("click", function(){
            sortTransactions(this);
        }));
    }

    setTheme();
    if(chartColorToggle)
        setChartColors();
}


const barGraph = document.querySelector(".bar-graph");
const lineGraph = document.querySelector(".line-graph");
const Wrapper = document.getElementById("Wrapper");
const hamburgerBtn = document.getElementById("hamburger-btn");
const hamburgerBtnLines = document.querySelectorAll(".line");
const menu = document.querySelector(".sidebar");
const dateInput = document.getElementById('date-input');
const transactionAddBtn = document.getElementById("add-btn");
const storageAvailable = typeof(Storage) !== "undefined";
const transactionsTable = document.getElementById("transactions-table-container");
const expensesDiv = document.querySelector(".expenses");
const limitDiv = document.querySelector(".limit");
const transactionModal = document.getElementById("transactionModal");
const body = document.getElementsByTagName("body")[0];
const closeModalBtn = document.querySelector(".modal-close-btn");
const darkThemeToggle = document.getElementById("darkThemeToggle");
const chartColorToggle = document.getElementById("chartColorToggle");
const toggleCurrency = document.getElementById("toggleCurrency");
const monthlyLimitInput = document.getElementById("monthlyLimitInput");
const sortOptions = document.querySelectorAll(".option");

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const categories = ["Entertainment", "Food/Drink", "Transportation", "Subscription", "Other"];
const categoriesShort = ["Ent.", "F/D", "Tsp.", "Subs.", "Othr"];

let sidebarShown = false;
let currency;
let expenses;
let limit;


window.onload = () => {  
/*
    localStorage.setItem("transactions", null);
    localStorage.setItem("currency", null);
    localStorage.setItem("expenses", null);
    localStorage.setItem("limit", null);
    localStorage.setItem("darkTheme", null);
    localStorage.setItem("chartColors", null);
*/
    init();
}

window.onresize = () => {
    if(window.innerWidth <= 600){
        document.querySelectorAll(".bar-graph .graph-label").forEach((text, i) => {
            text.innerHTML = categoriesShort[i];
        });
    }
    else {
        document.querySelectorAll(".bar-graph .graph-label").forEach((text, i) => {
            text.innerHTML = categories[i];
        });
    }

    if(transactionsTable.getAttribute("data-limit")){
        if(window.innerWidth <= 600){
            transactionsTable.setAttribute("data-limit", "4");
            
        }
        else if(window.innerWidth > 600 && window.innerWidth < 1500){
            transactionsTable.setAttribute("data-limit", "5");
        }
        else
            transactionsTable.setAttribute("data-limit", "8");

        emptyTransactionsContainer();
        populateTransactionsContainer();
    }

    resizeTable();
}
