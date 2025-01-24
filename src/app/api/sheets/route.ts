import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_IDS = {
  networkAccounting: process.env.GOOGLE_SHEETS_NETWORK_ACCOUNTING_ID,
  cashFlow: process.env.GOOGLE_SHEETS_CASHFLOW_ID,
};

async function authorizeGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

async function getSheetData(spreadsheetId: string, range: string) {
  const sheets = await authorizeGoogleSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values || [];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sheet = searchParams.get('sheet');
    const range = searchParams.get('range');

    if (!sheet || !range) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: sheet or range.',
        },
        { status: 400 }
      );
    }

    const spreadsheetId = SPREADSHEET_IDS[sheet as keyof typeof SPREADSHEET_IDS];

    if (!spreadsheetId) {
      return NextResponse.json(
        {
          success: false,
          error: `Sheet '${sheet}' is not defined. Available sheets: ${Object.keys(SPREADSHEET_IDS).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const data = await getSheetData(spreadsheetId, range);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Sheets API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sheet data.',
      },
      { status: 500 }
    );
  }
}
