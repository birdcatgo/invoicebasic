import { NextResponse } from 'next/server';
import { getSheetData, SPREADSHEET_IDS } from '@/lib/sheets';
import { updateSheetData } from '@/lib/sheets';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sheet = searchParams.get('sheet');
    const range = searchParams.get('range');

    console.log('API Request:', { sheet, range }); // Debug log

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
    console.log('Sheet data:', data); // Debug log

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sheet data.',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { invoice, section } = await request.json();
    const spreadsheetId = SPREADSHEET_IDS.networkAccounting;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Network accounting spreadsheet ID not configured' },
        { status: 500 }
      );
    }

    const sheetData = await getSheetData(spreadsheetId, 'A:Q');
    const rowIndex = sheetData.findIndex((row: string[]) => 
      row[0] === invoice.Network && row[1] === invoice.Invoice_Number
    );

    if (rowIndex !== -1) {
      let range, values;
      
      if (section === 'unpaidInvoices') {
        // Update Amount Paid, Paid Date, and Due Status
        range = `G${rowIndex + 1}:I${rowIndex + 1}`;
        values = [[
          invoice.Amount_Paid,
          invoice.Paid_Date,
          invoice.Due_Status
        ]];
      } else if (section === 'currentPeriod') {
        // ... existing current period logic ...
      }

      await updateSheetData(spreadsheetId, range, values);
      return NextResponse.json({ message: 'Invoice updated successfully' });
    }

    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}
