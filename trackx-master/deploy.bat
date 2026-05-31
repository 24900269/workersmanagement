@echo off
echo ========================================
echo    Site Manager Deployment Script
echo ========================================
echo.

echo Choose deployment option:
echo 1. GitHub Pages (requires Git)
echo 2. Netlify (drag & drop)
echo 3. Vercel (drag & drop)
echo 4. Surge.sh (requires npm)
echo 5. Firebase (requires npm)
echo.

set /p choice="Enter choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo GitHub Pages Deployment:
    echo 1. Create a new repository on GitHub
    echo 2. Upload your index.html file
    echo 3. Go to Settings ^> Pages ^> Source: Deploy from a branch
    echo 4. Select main branch and save
    echo.
    echo Your app will be live at: https://yourusername.github.io/repository-name/
    pause
)

if "%choice%"=="2" (
    echo.
    echo Netlify Deployment:
    echo 1. Go to https://netlify.com
    echo 2. Sign up/login with GitHub, GitLab, or email
    echo 3. Drag and drop your index.html file to the deploy area
    echo 4. Your site will be live instantly!
    echo.
    start https://netlify.com
    pause
)

if "%choice%"=="3" (
    echo.
    echo Vercel Deployment:
    echo 1. Go to https://vercel.com
    echo 2. Sign up/login with GitHub or email
    echo 3. Click "Import Project"
    echo 4. Upload your files or connect GitHub repo
    echo 5. Deploy automatically
    echo.
    start https://vercel.com
    pause
)

if "%choice%"=="4" (
    echo.
    echo Surge.sh Deployment:
    echo Installing Surge globally...
    npm install -g surge
    echo.
    echo Deploying to Surge...
    surge index.html
    echo.
    echo Your site is now live!
    pause
)

if "%choice%"=="5" (
    echo.
    echo Firebase Hosting Deployment:
    echo Installing Firebase CLI...
    npm install -g firebase-tools
    echo.
    echo Login to Firebase:
    firebase login
    echo.
    echo Initialize hosting:
    firebase init hosting
    echo.
    echo Deploy:
    firebase deploy
    echo.
    echo Your site is now live!
    pause
)

echo.
echo Deployment complete! Check your hosting provider for the live URL.
pause