import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shippingRules } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single shipping rule by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const shippingRule = await db
        .select()
        .from(shippingRules)
        .where(eq(shippingRules.id, parseInt(id)))
        .limit(1);

      if (shippingRule.length === 0) {
        return NextResponse.json(
          { error: 'Shipping rule not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(shippingRule[0], { status: 200 });
    }

    // List shipping rules with filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const isActiveParam = searchParams.get('isActive');
    const state = searchParams.get('state');
    const isCodAvailableParam = searchParams.get('isCodAvailable');
    const pincode = searchParams.get('pincode');

    let query = db.select().from(shippingRules);

    // Build conditions array
    const conditions = [];

    // Filter by isActive
    if (isActiveParam !== null) {
      const isActive = isActiveParam === 'true';
      conditions.push(eq(shippingRules.isActive, isActive));
    }

    // Filter by state
    if (state) {
      conditions.push(eq(shippingRules.state, state));
    }

    // Filter by isCodAvailable
    if (isCodAvailableParam !== null) {
      const isCodAvailable = isCodAvailableParam === 'true';
      conditions.push(eq(shippingRules.isCodAvailable, isCodAvailable));
    }

    // Pincode lookup - find rule where pincode is between pincodeStart and pincodeEnd
    if (pincode) {
      conditions.push(lte(shippingRules.pincodeStart, pincode));
      conditions.push(gte(shippingRules.pincodeEnd, pincode));
    }

    // Apply conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply ordering, limit and offset
    const results = await query
      .orderBy(desc(shippingRules.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pincodeStart, pincodeEnd, state, deliveryDays, shippingCharge, isCodAvailable, isActive } = body;

    // Validate required fields
    if (!pincodeStart || typeof pincodeStart !== 'string' || pincodeStart.trim() === '') {
      return NextResponse.json(
        { error: 'pincodeStart is required and must be a non-empty string', code: 'MISSING_PINCODE_START' },
        { status: 400 }
      );
    }

    if (!pincodeEnd || typeof pincodeEnd !== 'string' || pincodeEnd.trim() === '') {
      return NextResponse.json(
        { error: 'pincodeEnd is required and must be a non-empty string', code: 'MISSING_PINCODE_END' },
        { status: 400 }
      );
    }

    if (!state || typeof state !== 'string' || state.trim() === '') {
      return NextResponse.json(
        { error: 'state is required and must be a non-empty string', code: 'MISSING_STATE' },
        { status: 400 }
      );
    }

    if (deliveryDays === undefined || deliveryDays === null) {
      return NextResponse.json(
        { error: 'deliveryDays is required', code: 'MISSING_DELIVERY_DAYS' },
        { status: 400 }
      );
    }

    if (shippingCharge === undefined || shippingCharge === null) {
      return NextResponse.json(
        { error: 'shippingCharge is required', code: 'MISSING_SHIPPING_CHARGE' },
        { status: 400 }
      );
    }

    // Validate deliveryDays
    const parsedDeliveryDays = parseInt(deliveryDays);
    if (isNaN(parsedDeliveryDays) || parsedDeliveryDays <= 0) {
      return NextResponse.json(
        { error: 'deliveryDays must be a positive integer', code: 'INVALID_DELIVERY_DAYS' },
        { status: 400 }
      );
    }

    // Validate shippingCharge
    const parsedShippingCharge = parseFloat(shippingCharge);
    if (isNaN(parsedShippingCharge) || parsedShippingCharge < 0) {
      return NextResponse.json(
        { error: 'shippingCharge must be a non-negative number', code: 'INVALID_SHIPPING_CHARGE' },
        { status: 400 }
      );
    }

    const currentTimestamp = new Date().toISOString();

    // Prepare insert data with defaults
    const insertData = {
      pincodeStart: pincodeStart.trim(),
      pincodeEnd: pincodeEnd.trim(),
      state: state.trim(),
      deliveryDays: parsedDeliveryDays,
      shippingCharge: parsedShippingCharge,
      isCodAvailable: isCodAvailable !== undefined ? Boolean(isCodAvailable) : true,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };

    const newShippingRule = await db
      .insert(shippingRules)
      .values(insertData)
      .returning();

    return NextResponse.json(newShippingRule[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);

    // Check if record exists
    const existing = await db
      .select()
      .from(shippingRules)
      .where(eq(shippingRules.id, parsedId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Shipping rule not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { pincodeStart, pincodeEnd, state, deliveryDays, shippingCharge, isCodAvailable, isActive } = body;

    // Prepare update data
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    // Validate and add fields to update
    if (pincodeStart !== undefined) {
      if (typeof pincodeStart !== 'string' || pincodeStart.trim() === '') {
        return NextResponse.json(
          { error: 'pincodeStart must be a non-empty string', code: 'INVALID_PINCODE_START' },
          { status: 400 }
        );
      }
      updates.pincodeStart = pincodeStart.trim();
    }

    if (pincodeEnd !== undefined) {
      if (typeof pincodeEnd !== 'string' || pincodeEnd.trim() === '') {
        return NextResponse.json(
          { error: 'pincodeEnd must be a non-empty string', code: 'INVALID_PINCODE_END' },
          { status: 400 }
        );
      }
      updates.pincodeEnd = pincodeEnd.trim();
    }

    if (state !== undefined) {
      if (typeof state !== 'string' || state.trim() === '') {
        return NextResponse.json(
          { error: 'state must be a non-empty string', code: 'INVALID_STATE' },
          { status: 400 }
        );
      }
      updates.state = state.trim();
    }

    if (deliveryDays !== undefined) {
      const parsedDeliveryDays = parseInt(deliveryDays);
      if (isNaN(parsedDeliveryDays) || parsedDeliveryDays <= 0) {
        return NextResponse.json(
          { error: 'deliveryDays must be a positive integer', code: 'INVALID_DELIVERY_DAYS' },
          { status: 400 }
        );
      }
      updates.deliveryDays = parsedDeliveryDays;
    }

    if (shippingCharge !== undefined) {
      const parsedShippingCharge = parseFloat(shippingCharge);
      if (isNaN(parsedShippingCharge) || parsedShippingCharge < 0) {
        return NextResponse.json(
          { error: 'shippingCharge must be a non-negative number', code: 'INVALID_SHIPPING_CHARGE' },
          { status: 400 }
        );
      }
      updates.shippingCharge = parsedShippingCharge;
    }

    if (isCodAvailable !== undefined) {
      updates.isCodAvailable = Boolean(isCodAvailable);
    }

    if (isActive !== undefined) {
      updates.isActive = Boolean(isActive);
    }

    const updated = await db
      .update(shippingRules)
      .set(updates)
      .where(eq(shippingRules.id, parsedId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);

    // Check if record exists
    const existing = await db
      .select()
      .from(shippingRules)
      .where(eq(shippingRules.id, parsedId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Shipping rule not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(shippingRules)
      .where(eq(shippingRules.id, parsedId))
      .returning();

    return NextResponse.json(
      {
        message: 'Shipping rule deleted successfully',
        deletedRecord: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}