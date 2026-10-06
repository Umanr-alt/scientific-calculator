# Scientific Calculator

A lightweight, responsive scientific calculator built with HTML, CSS, and vanilla JavaScript. It is designed to run as a static web app and works well on desktop, tablet, and mobile devices.

## Features

- Basic arithmetic with precedence and parentheses
- Scientific functions including trigonometry, inverse trig, hyperbolic functions, logs, powers, roots, percent and factorial
- Degree / radian / gradian angle modes
- Memory functions: MC, MR, M+, M-
- Calculation history stored using `localStorage`
- Responsive layout for multiple screen sizes
- PWA manifest support with a custom favicon and app icons

## Run locally

From the project root, start a static file server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Files

- `index.html` – calculator structure and UI
- `style.css` – layout and styling
- `script.js` – expression parsing, evaluation, history, memory and keyboard interaction
- `manifest.json` – PWA metadata
- `assets/favicon.svg` – app icon
- `assets/icons/` – manifest icons

## Notes

The calculator does not use JavaScript `eval()`. Instead, it evaluates expressions through a custom tokenizer and recursive-descent parser that supports constant functions and scientific notation safely.
