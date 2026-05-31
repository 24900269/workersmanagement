# Site Manager - Civil Construction App

A mobile-first web application for managing construction site workers, attendance, and salary calculations.

## Features

- **Worker Management**: Add, view, and remove workers with details
- **Attendance Tracking**: Mark daily attendance with calendar view
- **Salary Calculation**: Automatic salary computation based on attendance
- **Data Persistence**: All data stored locally in browser (no backend required)
- **Mobile Optimized**: Responsive design for phones and tablets

## Deployment

This is a static web application that can be deployed to any hosting service.

### Quick Deploy Options

#### 1. GitHub Pages (Free)
```bash
# Create a new repository on GitHub
# Upload your index.html file
# Go to Settings > Pages > Source: Deploy from a branch
# Select main branch and save
# Your app will be live at: https://yourusername.github.io/repository-name/
```

#### 2. Netlify (Free)
```bash
# Go to netlify.com
# Drag and drop your index.html file
# Site will be live instantly
```

#### 3. Vercel (Free)
```bash
# Go to vercel.com
# Import your GitHub repo or upload files
# Deploy automatically
```

#### 4. Firebase Hosting (Free tier available)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

#### 5. Surge.sh (Free)
```bash
npm install -g surge
surge index.html
```

## Usage

1. **Add Workers**: Tap "Workers" → "+ Add" → Fill worker details
2. **Mark Attendance**: Tap "Attendance" → Select worker → Click dates
3. **Calculate Salary**: Tap "Salary" → Select worker → Adjust if needed
4. **View Records**: Tap "Records" for monthly summaries

## Data Storage

- All data is stored in browser's localStorage
- Data persists across sessions on the same device/browser
- No backend or database required
- Data is isolated per domain/browser

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled

## Development

Built with:
- HTML5
- CSS3 (Custom properties, Flexbox, Grid)
- Vanilla JavaScript (ES6+)
- localStorage API

## License

Open source - modify and use as needed.