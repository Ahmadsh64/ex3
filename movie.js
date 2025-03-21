const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 7876;

app.set('view engine', 'ejs');
app.use(express.static('public'));

const db = new sqlite3.Database('rtfilms.db');

app.get('/', (req, res) => {
    const title = req.query.title;

    if (!title){
        return res.status(400).send('Missing title parameter')
    }

    db.get('SELECT * FROM Films WHERE Title = ?', [title], (err, film) =>{
        if (err || !film) {
            res.status(404).send('Movie not found');
            return;
        }

        const posterPathPng = path.join(__dirname, 'public', 'movies', film.FilmCode, 'poster.png');
        const posterPathJpg = path.join(__dirname, 'public', 'movies', film.FilmCode, 'poster.jpg');
        
        let posterFormat = null;
        if (fs.existsSync(posterPathPng)){
            posterFormat = "png";
        }else if (fs.existsSync(posterPathJpg)){
            posterFormat = "jpg";
        }

        db.all("SELECT Attribute, Value FROM FilmDetails WHERE FilmCode = ? ORDER BY Attribute DESC", [film.FilmCode], (err, FilmDetails)=>{
            if (err){
                console.error('Error retrieving film details: ' + err.message);
                return res.status(500).send('Internal Server Error');
            }

            db.all('SELECT * FROM Reviews WHERE FilmCode = ?', [film.FilmCode], (err, reviews) => {
                if (err){
                    res.status(500).send('Database error');
                    return;
                }

                res.render('movie', { film, FilmDetails, reviews, posterFormat});
            });
        });
    });
});

app.listen(PORT, () =>{
    console.log(`Server is running on http://localhost:${PORT}/?title=`);
});