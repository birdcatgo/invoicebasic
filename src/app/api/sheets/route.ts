import { NextResponse } from 'next/server';
import { getSheetData, SPREADSHEET_IDS } from '@/lib/sheets';

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
