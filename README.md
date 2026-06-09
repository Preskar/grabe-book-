# 📚 GradeBook – Pupil Marks Calculator

A simple, browser-based tool that helps educators input pupil scores and automatically calculates averages, assigns letter grades, and generates a class summary — no installation required.

## 📁 Project Structure

```
gradebook/
├── index.html   → Page structure (HTML only — no styles or logic)
├── style.css    → All visual styles (colours, layout, buttons, badges)
├── app.js       → All logic (data, calculations, rendering, export)
└── README.md    → This file
```

Each file has one job:
- **index.html** — defines *what* is on the page
- **style.css**  — defines *how it looks*
- **app.js**     — defines *how it behaves*

## ✨ Features

- Add / remove subjects dynamically (Math, English, Science, etc.)
- Enter scores (0–100) per pupil per subject
- Auto-calculates average marks instantly as you type
- Letter grades assigned automatically based on score ranges
- Class summary — total pupils, class average, highest/lowest score, pass count, grade distribution
- Export to CSV — download the full gradebook as a spreadsheet
- No dependencies — runs entirely in the browser, no server needed

## 🎓 Grading Scale

| Grade | Score Range | Remarks    |
|-------|-------------|------------|
| A     | 80 – 100%   | Excellent  |
| B     | 65 – 79%    | Good       |
| C     | 50 – 64%    | Average    |
| D     | 40 – 49%    | Below Avg  |
| F     | 0  – 39%    | Fail       |

## 🚀 Getting Started

### Prerequisites

- Any modern web browser (Chrome, Firefox, Edge, Safari)
- No server, Python, or Node.js required

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/gradebook.git
   cd gradebook
   ```

2. **Open the app**
   ```bash
   open index.html        # macOS
   start index.html       # Windows
   xdg-open index.html    # Linux
   ```

That's it — no build step, no dependencies.

## 📖 How to Use

1. **Set up subjects** — add or remove subjects using the tags at the top
2. **Add pupils** — click **+ Add Pupil** and type the pupil's name
3. **Enter scores** — type marks (0–100); averages and grades update instantly
4. **View summary** — the Class Summary card shows overall statistics
5. **Export** — click **⬇ Export CSV** to download a spreadsheet

## 🌐 Deploy with GitHub Pages

1. Push the repo to GitHub
2. Go to **Settings → Pages**
3. Set source to **main branch / root**
4. Live at `https://YOUR-USERNAME.github.io/gradebook`

## 🤝 Contributing

Pull requests are welcome! Open an issue for bugs or feature suggestions.

## 📄 License

MIT License — free to use, modify, and distribute.
