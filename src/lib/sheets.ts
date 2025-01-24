import { NextApiRequest, NextApiResponse } from 'next';
import { getSheetData, updateSheetData, SPREADSHEET_IDS } from '@/lib/sheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const sheetName = req.query.sheet as string;
      const range = req.query.range as string;

      const spreadsheetId = SPREADSHEET_IDS[sheetName];
      const data = await getSheetData(spreadsheetId, range);

      res.status(200).json({ data });
    } else if (req.method === 'PUT') {
      const { invoice } = req.body;
      const sheetName = 'networkAccounting';
      const spreadsheetId = SPREADSHEET_IDS[sheetName];

      const sheetData = await getSheetData(spreadsheetId, 'A:Q');
      const rowIndex = sheetData.findIndex((row: string[]) => row[5] === invoice.Invoice_Number);

      if (rowIndex !== -1) {
        const range = `G${rowIndex + 1}:H${rowIndex + 1}`;
        const values = [[invoice.Amount_Paid, invoice.Date_Paid]];
        await updateSheetData(spreadsheetId, range, values);
        res.status(200).json({ message: 'Invoice updated successfully' });
      } else {
        res.status(404).json({ error: 'Invoice not found' });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in sheets API:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
}