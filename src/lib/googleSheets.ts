import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export const SPREADSHEET_IDS = {
  cashFlow: process.env.GOOGLE_SHEETS_CASHFLOW_ID,
  networkAccounting: process.env.GOOGLE_SHEETS_NETWORK_ACCOUNTING_ID
};

export const getGoogleSheetsClient = async () => {
  const client = new JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth: client });
  return sheets;
};

export const getSheetData = async (spreadsheetId: string, range: string) => {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values;
};

export const updateSheetData = async (spreadsheetId: string, range: string, values: any[][]) => {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  });

  return response.data;
};