import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData, SPREADSHEET_IDS } from '../../../lib/googleSheets';
import { google } from 'googleapis';


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sheetName = searchParams.get('sheet');
  const range = searchParams.get('range');

  if (!sheetName || !range) {
    return NextResponse.json({ error: 'Sheet name and range are required' }, { status: 400 });
  }

  try {
    const spreadsheetId = SPREADSHEET_IDS[sheetName as keyof typeof SPREADSHEET_IDS];
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Invalid sheet name' }, { status: 400 });
    }
    const data = await getSheetData(spreadsheetId, range as string);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error reading from Google Sheets:', error);
    return NextResponse.json({ error: 'Failed to read from Google Sheets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { sheetName, range, values } = await request.json();

  if (!sheetName || !range || !values) {
    return NextResponse.json({ error: 'Sheet name, range, and values are required' }, { status: 400 });
  }

  try {
    const spreadsheetId = SPREADSHEET_IDS[sheetName as keyof typeof SPREADSHEET_IDS];
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Invalid sheet name' }, { status: 400 });
    }
    const result = await updateSheetData(spreadsheetId, range as string, values);
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error updating Google Sheets:', error);
    return NextResponse.json({ error: 'Failed to update Google Sheets' }, { status: 500 });
  }
}