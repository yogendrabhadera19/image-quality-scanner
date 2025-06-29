import fs from 'fs';
import { google } from 'googleapis';
import { parse } from 'fast-csv';
import * as dotenv from 'dotenv';
dotenv.config();

const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const spreadsheetId = process.env.SHEET_ID;
const sheetDateName = new Date().toISOString().split('T')[0]; // e.g., 2025-06-28
const csvPath = process.env.CSV_NAME_AND_PATH;

async function ensureSheetTabExists(sheets, sheetName) {
    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = sheetMeta.data.sheets.find(
        (s) => s.properties.title === sheetName
    );

    if (!sheet) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: {
                                title: sheetName,
                            },
                        },
                    },
                ],
            },
        });
        console.log(`Created new sheet tab: ${sheetName}`);
    } else {
        console.log(`Sheet tab already exists: ${sheetName}`);
    }
}

async function getFirstEmptyRow(sheets, sheetName) {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:A`, // check column A
    });
    return res.data.values ? res.data.values.length + 1 : 1;
}

async function readCSVData(csvFile) {
    return new Promise((resolve, reject) => {
        const data = [];
        let headers = null;

        fs.createReadStream(csvFile)
            .pipe(parse({ headers: true }))
            .on('headers', (h) => {
                headers = h; // capture header row
            })
            .on('data', (row) => data.push(Object.values(row)))
            .on('end', () => resolve([headers, data]))
            .on('error', reject);
    });
}

async function main() {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    await ensureSheetTabExists(sheets, sheetDateName);

    const rowStart = await getFirstEmptyRow(sheets, sheetDateName);
    const [headers, csvData] = await readCSVData(csvPath);

    const range = `${sheetDateName}!A${rowStart}`;
    const values = [headers, ...csvData];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: {
            values,
        },
    });

    console.log(`CSV data uploaded to tab "${sheetDateName}" starting at row ${rowStart}`);
}

main().catch(console.error);
