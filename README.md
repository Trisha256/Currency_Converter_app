# Currency Converter App

A simple, beginner-friendly currency converter built with **HTML**, **CSS**, and **JavaScript**. Enter an amount, choose currencies, and convert using live exchange rates.

## Demo
- Run locally by opening `index.html` in your browser.

## Features
- Convert an entered amount between currencies
- Fetches live exchange rates from a public API
- Lightweight, no build tools required

## Tech Stack
- HTML
- CSS
- JavaScript (Fetch API)

## Getting Started

### Prerequisites
- Any modern web browser (Chrome, Edge, Firefox, Safari)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Trisha256/Currency_Converter_app.git
   ```
2. Open the project folder.
3. Open `index.html` in your browser.

> Tip: For best results (and to avoid CORS/file restrictions in some browsers), run a local server:
> 
> ```bash
> # Python
> python -m http.server 8000
> ```
> 
> Then visit `http://localhost:8000`.

## Usage
1. Enter an amount.
2. Choose the **From** currency.
3. Choose the **To** currency.
4. Click **Convert**.

## API
This project uses the ExchangeRate-API endpoint:
- `https://api.exchangerate-api.com/v4/latest/{BASE}`

## Project Structure
```text
.
├─ index.html
├─ style.css
├─ script.js
└─ README.md
```

## Notes / Known Issues
- The current UI in `index.html` includes a **From** currency dropdown, but the JavaScript expects a **To** dropdown (`toCurrency`). Consider adding a second `<select id="toCurrency">...</select>`.
- In `script.js`, the function and variable names likely need small fixes (e.g., `data` vs `date`).

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you’d like to change.

## License
No license specified yet. If you want, add a `LICENSE` file (MIT is a common choice for small projects).