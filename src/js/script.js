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

        sidebarShown = false;
    }
    else {
        document.getElementsByTagName("body")[0].classList.add("lock-scroll");
        menu.classList.add("show");
        hamburgerBtn.classList.add("close-btn");
        hamburgerBtnLines.forEach(line => {
            line.classList.add("close-btn-line");
        });

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

emptyTransactionsContainer = () => transactionsContainer.innerHTML = "";

function GetSortOrderAsc(prop) {  
    return function(a, b) {  
        if (a[prop] > b[prop]) {  
            return 1;  
        } else if (a[prop] < b[prop]) {  
            return -1;  
        }  
        return 0;  
    }  
}  

function GetSortOrderDsc(prop) {  
    return function(a, b) {  
        if (a[prop] < b[prop]) {  
            return 1;  
        } else if (a[prop] > b[prop]) {  
            return -1;  
        }  
        return 0;  
    }  
}  


sortTransactions = () => {  
    emptyTransactionsContainer();
    let transactions = JSON.parse(localStorage.getItem("transactions"));

    if(sortBySelect.value === "descending")
        console.log(transactions.sort(GetSortOrderDsc("transactionCost")));
    else
        console.log(transactions.sort(GetSortOrderAsc("transactionCost")))

}

filterTransactions = () => {
    emptyTransactionsContainer();
}

populateTransactionsContainer = (containerElement) => {
    if(!isStorageAvailable()){
        alert("Storage not available, can't display transactions!");
        return;
    }

    let transactions = JSON.parse(localStorage.getItem("transactions"));
    let limit = containerElement.getAttribute("data-limit")
    let count = 0;

    transactions.forEach(object => {
        if(limit && count >= limit)
            return;

        let transactionContainer = document.createElement("div");
        transactionContainer.classList.add("transaction");
        containerElement.appendChild(transactionContainer);

        let transactionDetailsContainer = document.createElement("div");
        transactionDetailsContainer.classList.add("transaction-details");
        transactionContainer.appendChild(transactionDetailsContainer);

        let transactionTypeParagraph = document.createElement("p");
        transactionTypeParagraph.classList.add("transaction-type");
        transactionTypeParagraph.innerHTML = object.transactionCategory;
        transactionDetailsContainer.appendChild(transactionTypeParagraph);

        let transactionPrice = document.createElement("p");
        transactionPrice.classList.add("transaction-cost");
        transactionPrice.innerHTML = object.transactionCost + " €";
        transactionDetailsContainer.appendChild(transactionPrice);

        let arrowContainer = document.createElement("div");
        arrowContainer.classList.add("dropdown-arrow");
        transactionDetailsContainer.appendChild(arrowContainer);

        let arrow = document.createElement("div");
        arrow.classList.add("arrow-down");
        arrow.setAttribute("data-transaction-arrow", object.id);
        arrow.addEventListener("click", toggleTransactionDropdown)
        arrowContainer.appendChild(arrow);

        let dropdownContainer = document.createElement("div");
        dropdownContainer.classList.add("transaction-dropdown");
        dropdownContainer.setAttribute("data-transaction-id", object.id);
        transactionContainer.appendChild(dropdownContainer);

        let transactionDate = document.createElement("div");
        transactionDate.classList.add("transaction-date");
        transactionDate.innerHTML = "Date: " + object.transactionDate;
        dropdownContainer.appendChild(transactionDate);

        let transactionItems = document.createElement("div");
        transactionItems.classList.add("transaction-items");
        dropdownContainer.appendChild(transactionItems);

        let name = document.createElement("div");
        name.classList.add("name");
        transactionItems.appendChild(name);

        let span = document.createElement("span");
        name.appendChild(span);

        let icon = document.createElement("i");
        icon.className = "fas fa-store";
        span.appendChild(icon);

        name.innerHTML += object.transactionStore;
        
        let payment = document.createElement("div");
        payment.classList.add("payment");
        transactionItems.appendChild(payment);

        span = document.createElement("span");
        payment.appendChild(span);

        icon = document.createElement("i");
        icon.className = "fas fa-wallet";
        span.appendChild(icon);

        payment.innerHTML += object.transactionMethod;

        let controls = document.createElement("div");
        controls.classList.add("transaction-controls");
        dropdownContainer.appendChild(controls);

        let edit = document.createElement("div");
        edit.className = "btn btn-edit";
        edit.innerHTML = "Edit";
        controls.appendChild(edit);

        let del = document.createElement("div");
        del.className = "btn btn-del";
        del.innerHTML = "Delete";
        controls.appendChild(del);

        count++;
    })
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
        addTransactionToStorage(store.value, transCategory.value, paymentMethod.value, cost.value, date.value);
        
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

isStorageAvailable = () => storageAvailable;
isTransactionObjectNull = () => JSON.parse(localStorage.getItem("transactions")) === null;
createTransactionObject = () => localStorage.setItem("transactions", JSON.stringify([]));

//Initializes all event listeners and other stuff
init = () => {
    if(isTransactionObjectNull())
        createTransactionObject();

    if(dateInput)
        dateInput.value = new Date().toDateInputValue();

    if(transactionAddBtn)
        transactionAddBtn.addEventListener("click", checkTransaction);

    if(!isTransactionObjectNull() && transactionsContainer)
        populateTransactionsContainer(transactionsContainer);

    if(sortBySelect && filterSelect){
        sortBySelect.addEventListener("change", sortTransactions);
        filterSelect.addEventListener("change", filterTransactions);
    }

    hamburgerBtn.addEventListener("click", toggleSidebar);

    transactionsDropdownArrow.forEach(arrow => {
        arrow.addEventListener("click", toggleTransactionDropdown);
    });
}


const hamburgerBtn = document.getElementById("hamburger-btn");
const transactionsDropdownArrow = document.querySelectorAll(".arrow-down");
const hamburgerBtnLines = document.querySelectorAll(".line");
const menu = document.querySelector(".sidebar");
const dateInput = document.getElementById('date-input');
const transactionAddBtn = document.getElementById("add-btn");
const transactionsContainer = document.querySelector(".transactions");
const storageAvailable = typeof(Storage) !== "undefined";
const sortBySelect = document.getElementById("sort-select");
const filterSelect = document.getElementById("filter-select");

let sidebarShown = false;


window.onload = () => {  
    //localStorage.setItem("transactions", null);
    init();
}



