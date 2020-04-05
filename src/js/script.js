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

toggleTransactionDropdown = (e) => {
    let arrowElement = e.target;
    let id = arrowElement.getAttribute("data-transaction-arrow");
    let transactionDropdowns = document.querySelectorAll(".transaction-dropdown");
    
    transactionDropdowns.forEach(dropdown => {
        if(dropdown.getAttribute("data-transaction-id") === id){
            if(dropdown.hasAttribute("data-dropdown-opened")){
                dropdown.removeAttribute("data-dropdown-opened");
                dropdown.classList.remove("show-dropdown");
                arrowElement.classList.remove("rotate-arrow");
            }
            else{
                dropdown.setAttribute("data-dropdown-opened", true);
                dropdown.classList.add("show-dropdown");
                arrowElement.classList.add("rotate-arrow");
            }
            
            return;
        }
    });
}

emptyTransactionsContainer = () => {
    transactionsTable.lastElementChild.remove();
}

function GetSortOrderAsc(prop) {  
    return function(a, b) {  
        if (a > b) {  
            return 1;  
        } else if (a < b) {  
            return -1;  
        }  
        return 0;  
    }  
}  

function GetSortOrderDsc(prop) {  
    return function(a, b) {  
        if (a < b) {  
            return 1;  
        } else if (a > b) {  
            return -1;  
        }  
        return 0;  
    }  
}  


sortTransactions = () => {  
    emptyTransactionsContainer();
    let transactions = JSON.parse(localStorage.getItem("transactions"));
    transactions = sortBySelect.value === "descending" ? transactions.sort(GetSortOrderDsc("transactionCost")) :
        transactions.sort(GetSortOrderAsc("transactionCost"));

    localStorage.setItem("transactions", JSON.stringify(transactions));

    populateTransactionsContainer();

}

filterTransactions = () => {
    emptyTransactionsContainer();
}

recalculateExpenses = () => {
    let transactions = JSON.parse(localStorage.getItem("transactions"));
    let e = 0;

    transactions.forEach(element => {
        e += parseFloat(element.transactionCost);
    });

    document.querySelector(".expenses").innerHTML = e + " " + currency;

    localStorage.setItem("expenses", JSON.stringify(e));
}

editTransaction = (e) => {
    let id = e.target.getAttribute("data-transaction-id");
    let transactions = JSON.parse(localStorage.getItem("transactions"));

    let object, index;

    transactions.forEach((element, i) => {
        if(id == parseInt(element.id)){
            object = element;
            index = i;
            return;
        }
    });

    object.transactionStore = document.getElementById("store-input").value;
    object.transCategory = document.getElementById("category-input").value;
    object.transactionMethod = document.getElementById("type-drpdwn").value;
    object.transactionCost = document.getElementById("cost-input").value;
    object.transactionDate = document.getElementById("date-input").value;

    transactions[index] = object;

    localStorage.setItem("transactions", JSON.stringify(transactions));

    transactionModal.style.display = "none";

    emptyTransactionsContainer();
    populateTransactionsContainer();
    recalculateExpenses();
    displayLineChart();
} 

openTransactionModal = (tr) => {
    let id = tr.getAttribute("data-table-row");
    transactionModal.style.display = "block";
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

populateTransactionsContainer = () => {
    if(!isStorageAvailable()){
        alert("Storage not available, can't display transactions!");
        return;
    }

    let transactions = JSON.parse(localStorage.getItem("transactions"));
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
        date.classList.add("hidden");
        tr.appendChild(date);

        let payment = document.createElement("td");
        payment.innerHTML = object.transactionMethod;
        payment.classList.add("hidden");
        tr.appendChild(payment);

        let amount = document.createElement("td");
        amount.innerHTML = object.transactionCost;
        tr.appendChild(amount);

        let status = document.createElement("td");
        tr.appendChild(status);

        let statusIndicator = document.createElement("div");
        statusIndicator.innerHTML = "Paid";
        statusIndicator.className = "status status-red";
        status.appendChild(statusIndicator);

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
    
    let currentExpenses = JSON.parse(localStorage.getItem("expenses"));
    expenses = (+currentExpenses) + (+cost);
    localStorage.setItem("expenses", JSON.stringify(Math.round(expenses * 100) / 100));
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

    return (Math.round(maxExpense) + 10);
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
        circlePositions.push((100 - (monthExpensePercent + 10)));
        graphCircles[i].setAttribute("cy", ((100 - (monthExpensePercent + 10)) + "%"));
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

//Initializes all event listeners and other stuff
init = () => {
    if(isTransactionObjectNull())
        createTransactionObject();

    initLocalStorageVariables();
    initLocalVariables();

    if(limitDiv && expensesDiv)
        displayLocalVariables();

    if(lineGraph)
        displayLineChart();

    if(dateInput)
        dateInput.value = new Date().toDateInputValue();

    if(transactionAddBtn)
        transactionAddBtn.addEventListener("click", checkTransaction);

    if(!isTransactionObjectNull() && transactionsTable)
        populateTransactionsContainer();

    if(sortBySelect && filterSelect){
        sortBySelect.addEventListener("change", sortTransactions);
        filterSelect.addEventListener("change", filterTransactions);
    }

    hamburgerBtn.addEventListener("click", toggleSidebar);

    if(closeModalBtn)
        closeModalBtn.addEventListener("click", function(){
            transactionModal.style.display = "none";
        });
}


const lineGraph = document.querySelector(".line-graph");
const Wrapper = document.getElementById("Wrapper");
const hamburgerBtn = document.getElementById("hamburger-btn");
const hamburgerBtnLines = document.querySelectorAll(".line");
const menu = document.querySelector(".sidebar");
const dateInput = document.getElementById('date-input');
const transactionAddBtn = document.getElementById("add-btn");
const storageAvailable = typeof(Storage) !== "undefined";
const sortBySelect = document.getElementById("sort-select");
const filterSelect = document.getElementById("filter-select");
const transactionsTable = document.getElementById("transactions-table-container");
const expensesDiv = document.querySelector(".expenses");
const limitDiv = document.querySelector(".limit");
const transactionModal = document.getElementById("transactionModal");
const body = document.getElementsByTagName("body")[0];
const closeModalBtn = document.querySelector(".modal-close-btn");

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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
*/
    //console.log(JSON.parse(localStorage.getItem("expenses")));
    init();

    

}

window.onresize = () => {
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
