/**
 * movie.js - תיאורים של קוד Node.js שמציג מידע על סרטים וביקורות שלהם
 * 
 * כותב: [אחמד שלאעטה 212811244,נרמין עראידה 212845762]
 * תאריך כתיבה: [15/03/2025]
 * תיאור:
 * קובץ זה מקבל את פרמטר ה-title מה-URL, שולף מידע על הסרט מהמסד נתונים (SQLite),
 * כולל את פרטי הסרט, ביקורות, ותמונות קשורות, ומציג אותם בעמוד ה-EJS.
 * הקוד מבצע חישוב של חלוקת הביקורות לשתי עמודות, מציג את המידע על הסרט, והמציג פס ירוק בתחתית העמוד עם
 * מספר הביקורות.
 * 
 * הרחבות מייבא:
 * 1. express - מאפשרת יצירת אפליקציה מבוססת Node.js.
 * 2. sqlite3 - מאפשרת אינטראקציה עם בסיס נתונים SQLite.
 * 3. fs - מאפשרת גישה למערכת הקבצים, בעיקר לצורך בדיקת קיום קבצים.
 * 4. path - עוזרת בניהול נתיבים לקבצים.
 */
const express = require('express');// ייבוא Express - מספקת מבנה ליצירת אפליקציות Web
const sqlite3 = require('sqlite3').verbose();// ייבוא SQLite3 - לניהול מסד נתונים
const fs = require('fs');// ייבוא מודול FS - לצורך בדיקות קבצים במערכת
const path = require('path');// ייבוא Path - לניהול נתיבי קבצים

const app = express();
const PORT = 7876;

app.set('view engine', 'ejs');// הגדרת מנוע תצוגה EJS
app.use(express.static('public'));// הגדרת תיקיית קבצים סטטיים

const db = new sqlite3.Database('rtfilms.db');// חיבור למסד הנתונים SQLite
// הגדרת נתיב להצגת סרט לפי שם
app.get('/', (req, res) => {
    const title = req.query.title;

    if (!title){
        return res.status(400).send('Missing title parameter')
    }
// שליפת פרטי הסרט
    db.get('SELECT * FROM Films WHERE Title = ?', [title], (err, film) =>{
        if (err || !film) {
            res.status(404).send('Movie not found');
            return;
        }
// קביעת נתיב התמונות בהתאם לסוג הקובץ
        const posterPathPng = path.join(__dirname, 'public', 'movies', film.FilmCode, 'poster.png');
        const posterPathJpg = path.join(__dirname, 'public', 'movies', film.FilmCode, 'poster.jpg');
        
        let posterFormat = null;
        if (fs.existsSync(posterPathPng)){
            posterFormat = "png";
        }else if (fs.existsSync(posterPathJpg)){
            posterFormat = "jpg";
        }
// שליפת פרטי הסרט הנוספים (FilmDetails)
        db.all("SELECT Attribute, Value FROM FilmDetails WHERE FilmCode = ? ORDER BY Attribute DESC", [film.FilmCode], (err, FilmDetails)=>{
            if (err){
                console.error('Error retrieving film details: ' + err.message);
                return res.status(500).send('Internal Server Error');
            }
// שליפת ביקורות הסרט
            db.all('SELECT * FROM Reviews WHERE FilmCode = ?', [film.FilmCode], (err, reviews) => {
                if (err){
                    res.status(500).send('Database error');
                    return;
                }
// החזרת הנתונים לתצוגה ב-EJS
                res.render('movie', { film, FilmDetails, reviews, posterFormat});
            });
        });
    });
});

app.listen(PORT, () =>{
    console.log(`Server is running on http://localhost:${PORT}/?title=`);
});