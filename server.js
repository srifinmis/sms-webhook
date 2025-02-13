const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});
pool.connect()
    .then(() => console.log("Connected to PostgreSQL"))
    .catch((err) => {
        console.error("Error connecting to PostgreSQL:", err);
        process.exit(1); 
    });

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.get("/dlr-webhook", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM dlr_data ORDER BY received_at DESC");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching DLR data:", error);
        res.status(500).send("Error retrieving data");
    }
});

app.post("/dlr-webhook", async (req, res) => {
    const { status, statuscode, statustext, messageack } = req.body;

    console.log(`Received DLR - Status: ${status}, Status Code: ${statuscode}, Status Text: ${statustext}`);

    if (messageack?.guids?.length) {
        try {
            for (const { guid, submitdate } of messageack.guids) {
                console.log(`Storing GUID: ${guid}, Submit Date: ${submitdate}`);

                await pool.query(
                    `INSERT INTO dlr_data (status, statuscode, statustext, guid, submitdate)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (guid) DO NOTHING`,
                    [status, statuscode, statustext, guid, submitdate]
                );
            }
            res.status(200).send("DLR stored successfully");
        } catch (error) {
            console.error("Error inserting DLR data:", error);
            res.status(500).send("Error storing data");
        }
    } else {
        console.log("No GUIDs found in the message acknowledgment.");
        res.status(400).send("No valid DLR data provided");
    }
});

app.listen(PORT, () => {
        console.log(`DLR Webhook server running on http://localhost:${PORT}`);
    });
