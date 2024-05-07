const pg = require("pg");
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_icecream_shop');
const express = require("express");
const app = express();

app.use(express.json());
app.use(require('morgan')('dev'));


// READ
app.get('/api/flavors', async (req, res, next) => {
    try {
        const SQL = `SELECT * FROM flavors`;
        const response = await client.query(SQL);
        res.send(response.rows);
    }   catch (error) {
        next(error);
    }
});

app.get('/api/flavors/:id', async (req, res, next) => {
    try {
        const { id } = req.params; 
        const SQL = `SELECT * FROM flavors WHERE id = $1`; 
        const response = await client.query(SQL, [id]);  
        if (response.rows.length > 0) {
            res.send(response.rows[0]); 
        } else {
            res.status(404).send({ message: "Flavor not found" }); 
        }
    } catch (error) {
        next(error);
    }
});

// CREATE
app.post('/api/flavors', async(req, res, next) => {
    try {
        const is_favorite = req.body.is_favorite === true; 
        const SQL = /* sql */ `
        INSERT INTO flavors(txt, is_favorite)
        VALUES($1, $2)
        RETURNING *
        `;
        const response = await client.query(SQL, [req.body.txt, is_favorite]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});

// UPDATE
app.put('/api/flavors/:id', async(req, res, next) => {
    try {
        const is_favorite = req.body.is_favorite === true; 
        const SQL = /* sql */`
        UPDATE flavors
        SET txt=$1, is_favorite=$2, updated_at=now()
        WHERE id=$3
        RETURNING *
        `;

        const response = await client.query(SQL, [
            req.body.txt,
            is_favorite,
            req.params.id]
        );
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});

// DELETE
app.delete('/api/flavors/:id', async(req, res, next) => {
    try {
        const SQL = /* sql */ `
        DELETE from flavors
        WHERE id=$1
        `;
        await client.query(SQL, [req.params.id])
        res.sendStatus(204);
    } catch (error) {
        next(error)
    }
});

const init = async () => {
    await client.connect();
    console.log('connected to Database');
    let SQL = /* sql */ `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        is_favorite BOOLEAN DEFAULT false NOT NULL,
        txt VARCHAR (255)
    )
    `;
    await client.query(SQL);
    console.log('tables created');


    SQL = /* sql */ `
    INSERT INTO flavors(txt) VALUES('Vanilla');
    INSERT INTO flavors(txt, is_favorite) VALUES('Chocolate', true);
    INSERT INTO flavors(txt, is_favorite) VALUES('Coffee', true);
    INSERT INTO flavors(txt) VALUES('Strawberry');
    INSERT INTO flavors(txt) VALUES('Mint Chocolate Chip');
    INSERT INTO flavors(txt, is_favorite) VALUES('Butter Pecan', false);
    INSERT INTO flavors(txt, is_favorite) VALUES('Chocolate Chip Cookie Dough', true);
    INSERT INTO flavors(txt) VALUES('Cookies and Cream');
    INSERT INTO flavors(txt, is_favorite) VALUES('Pistachio', false);
    INSERT INTO flavors(txt) VALUES('Rocky Road');
`;
    await client.query(SQL);
    console.log('data seeded');
 
    const port = process.env.PORT || 3000
    app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
