import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export const SPREADSHEET_IDS = {
  networkAccounting: process.env.GOOGLE_SHEETS_NETWORK_ACCOUNTING_ID || '',
  cashFlow: process.env.GOOGLE_SHEETS_CASHFLOW_ID || '',
} as const;

export async function authorizeGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function getSheetData(spreadsheetId: string, range: string) {
  if (!spreadsheetId) {
    throw new Error('Spreadsheet ID is required');
  }
  
  const sheets = await authorizeGoogleSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values || [];
}

export async function updateSheetData(spreadsheetId: string, range: string, values: any[][], options?: {
  includeNetwork?: boolean;  // If true, also update network-specific sheet
  networkName?: string;
}) {
  if (!spreadsheetId) {
    throw new Error('Spreadsheet ID is required');
  }

  const sheets = await authorizeGoogleSheets();
  
  // Update main summary sheet
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  });

  // If network update is requested, update the network-specific sheet
  if (options?.includeNetwork && options.networkName) {
    try {
      // Get the network's sheet data
      const networkRange = `${options.networkName}!A:Z`;
      const networkData = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: networkRange,
      });

      if (networkData.data.values) {
        // Find the matching row in the network sheet
        const rowIndex = networkData.data.values.findIndex(
          (row: string[]) => row[2] === values[0][2]  // Match by Pay Period
        );

        if (rowIndex !== -1) {
          // Update the network sheet
          const networkUpdateRange = `${options.networkName}!C${rowIndex + 1}:D${rowIndex + 1}`;
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: networkUpdateRange,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [[values[0][1], values[0][0]]]  // [Amount Due, Invoice Number]
            },
          });
        }
      }
    } catch (error) {
      console.error(`Failed to update network sheet for ${options.networkName}:`, error);
      // Continue even if network sheet update fails
    }
  }

  return response.data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const sheetName = req.query.sheet as keyof typeof SPREADSHEET_IDS;
      const range = req.query.range as string;

      if (!sheetName || !range) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const spreadsheetId = SPREADSHEET_IDS[sheetName];
      if (!spreadsheetId) {
        return res.status(400).json({ error: 'Invalid sheet name' });
      }

      const data = await getSheetData(spreadsheetId, range);
      return res.status(200).json({ data });

    } else if (req.method === 'PUT') {
      const { invoice, section } = req.body;
      const spreadsheetId = SPREADSHEET_IDS.networkAccounting;

      if (!spreadsheetId) {
        return res.status(500).json({ error: 'Network accounting spreadsheet ID not configured' });
      }

      const sheetData = await getSheetData(spreadsheetId, 'A:Q');
      const rowIndex = sheetData.findIndex((row: string[]) => 
        row[0] === invoice.Network && row[3] === invoice.Pay_Period
      );

      if (rowIndex !== -1) {
        let range, values;
        
        if (section === 'currentPeriod') {
          // Update Amount Due and Invoice Number
          range = `B${rowIndex + 1}:C${rowIndex + 1}`;
          values = [[invoice.Invoice_Number, invoice.Amount_Due]];
          
          await updateSheetData(spreadsheetId, range, values, {
            includeNetwork: true,
            networkName: invoice.Network
          });
        } else {
          // Existing unpaid invoice update logic
          range = `G${rowIndex + 1}:H${rowIndex + 1}`;
          values = [[invoice.Amount_Paid, invoice.Date_Paid]];
          await updateSheetData(spreadsheetId, range, values);
        }
        
        return res.status(200).json({ message: 'Invoice updated successfully' });
      } else {
        return res.status(404).json({ error: 'Invoice not found' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in sheets API:', error);
    return res.status(500).json({ error: 'An error occurred' });
  }
}