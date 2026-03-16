async function name(convertCurrency) {
    let amount = document.getElementById("amount").value;
    let from = document.getElementById("fromCurrency").value;
    let to = document.getElementById("toCurrency").value;
    
    let url = `https://api.exchangerate-api.com/v4/latest/${from}`;

    let response = await fetch(url);
    let date = await response.json();

    let rate = data.rates[to];
    let result = amount * rate;

    document.getElementById("result").innerText =
    `${amount} ${from} = ${result.toFixed(2)} ${to}`;

}