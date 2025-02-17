const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const getValue = (queryParams, bodyParams, keys) => {
  for (const key of keys) {
    if (queryParams && queryParams[key] !== undefined) return queryParams[key];
    if (bodyParams && bodyParams[key] !== undefined) return bodyParams[key];
    if (Array.isArray(bodyParams)) {
      for (const obj of bodyParams) {
        if (obj[key] !== undefined) return obj[key];
      }
    }
  }
  return null;
};

app.post("/dlr-webhook", async (req, res) => {
  const queryParams = req.query;
  const bodyParams = req.body;

  const to = getValue(queryParams, bodyParams, ["p", "to_number"]) || "Unknown";
  const from = getValue(queryParams, bodyParams, ["P", "from_sender"]) || "Unknown";
  const time = getValue(queryParams, bodyParams, ["t", "received_time", "received_at"]) || null;
  const message_status = getValue(queryParams, bodyParams, ["d", "message_status"]) || null;
  const reason_code = getValue(queryParams, bodyParams, ["2", "reason_code"]) || null;
  const delivered_date = getValue(queryParams, bodyParams, ["3", "delivered_date"]) || null;
  const status_error = getValue(queryParams, bodyParams, ["4", "status_error"]) || null;
  const guid = getValue(queryParams, bodyParams, ["5", "guid"]);
  const seq_number = getValue(queryParams, bodyParams, ["6", "seq_number"]) || null;
  const message_id = getValue(queryParams, bodyParams, ["7", "message_id"]) || null;
  const circle = getValue(queryParams, bodyParams, ["8", "circle"]) || null;
  const operator = getValue(queryParams, bodyParams, ["9", "operator"]) || null;
  const text_status = getValue(queryParams, bodyParams, ["13", "text_status"]) || null;
  const submit_date = getValue(queryParams, bodyParams, ["14", "submit_date"]) || null;
  const msg_status = getValue(queryParams, bodyParams, ["16", "msg_status"]) || null;
  const additional_param_1 = getValue(queryParams, bodyParams, ["21", "additional_param_1"]) || null;
  const additional_param_2 = getValue(queryParams, bodyParams, ["22", "additional_param_2"]) || null;
  const additional_param_3 = getValue(queryParams, bodyParams, ["23", "additional_param_3"]) || null;
  const additional_param_4 = getValue(queryParams, bodyParams, ["24", "additional_param_4"]) || null;
  const additional_param_5 = getValue(queryParams, bodyParams, ["25", "additional_param_5"]) || null;
  const msg_splits = getValue(queryParams, bodyParams, ["29", "msg_splits"]) || null;
  const tag = getValue(queryParams, bodyParams, ["TAG", "tag"]) || null;

  if (guid) {
    try {
      await pool.query(
        `INSERT INTO dlr_data (
          to_number, from_sender, received_time, message_status, reason_code, 
          delivered_date, status_error, guid, seq_number, message_id, circle, operator, 
          text_status, submit_date, msg_status, additional_param_1, additional_param_2, 
          additional_param_3, additional_param_4, additional_param_5, msg_splits, tag
        ) VALUES (
          COALESCE($1, 'Unknown'), COALESCE($2, 'Unknown'), $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
        ) ON CONFLICT (guid) DO NOTHING`,
        [
          to, from, time, message_status, reason_code, delivered_date, status_error, guid,
          seq_number, message_id, circle, operator, text_status, submit_date, msg_status,
          additional_param_1, additional_param_2, additional_param_3, additional_param_4,
          additional_param_5, msg_splits, tag,
        ]
      );
      res.status(200).send("DLR stored successfully");
    } catch (error) {
      res.status(500).send("Error storing data");
    }
  } else {
    res.status(400).send("Invalid DLR data");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
