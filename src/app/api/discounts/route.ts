import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { discounts } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const code = searchParams.get('code');

    // Single record fetch by ID or code
    if (id || code) {
      const whereCondition = id 
        ? eq(discounts.id, parseInt(id))
        : eq(discounts.code, code as string);

      const record = await db.select()
        .from(discounts)
        .where(whereCondition)
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ 
          error: 'Discount not found',
          code: 'DISCOUNT_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with pagination, filtering, and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const isActiveParam = searchParams.get('isActive');
    const typeParam = searchParams.get('type');

    let query = db.select().from(discounts);
    const conditions = [];

    // Search in code
    if (search) {
      conditions.push(like(discounts.code, `%${search}%`));
    }

    // Filter by isActive
    if (isActiveParam !== null) {
      const isActive = isActiveParam === 'true';
      conditions.push(eq(discounts.isActive, isActive));
    }

    // Filter by type
    if (typeParam) {
      conditions.push(eq(discounts.type, typeParam));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(discounts.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, type, value, minOrderAmount, maxDiscount, usageLimit, usedCount, validFrom, validUntil, isActive } = body;

    // Validate required fields
    if (!code || !code.trim()) {
      return NextResponse.json({ 
        error: 'Code is required',
        code: 'CODE_REQUIRED'
      }, { status: 400 });
    }

    if (!type || !type.trim()) {
      return NextResponse.json({ 
        error: 'Type is required',
        code: 'TYPE_REQUIRED'
      }, { status: 400 });
    }

    if (!['percentage', 'fixed'].includes(type)) {
      return NextResponse.json({ 
        error: 'Type must be either "percentage" or "fixed"',
        code: 'INVALID_TYPE'
      }, { status: 400 });
    }

    if (value === undefined || value === null) {
      return NextResponse.json({ 
        error: 'Value is required',
        code: 'VALUE_REQUIRED'
      }, { status: 400 });
    }

    if (typeof value !== 'number' || value <= 0) {
      return NextResponse.json({ 
        error: 'Value must be a positive number',
        code: 'INVALID_VALUE'
      }, { status: 400 });
    }

    if (!validFrom || !validFrom.trim()) {
      return NextResponse.json({ 
        error: 'Valid from date is required',
        code: 'VALID_FROM_REQUIRED'
      }, { status: 400 });
    }

    if (!validUntil || !validUntil.trim()) {
      return NextResponse.json({ 
        error: 'Valid until date is required',
        code: 'VALID_UNTIL_REQUIRED'
      }, { status: 400 });
    }

    // Validate date order
    const validFromDate = new Date(validFrom);
    const validUntilDate = new Date(validUntil);

    if (isNaN(validFromDate.getTime()) || isNaN(validUntilDate.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid date format',
        code: 'INVALID_DATE_FORMAT'
      }, { status: 400 });
    }

    if (validFromDate >= validUntilDate) {
      return NextResponse.json({ 
        error: 'Valid from date must be before valid until date',
        code: 'INVALID_DATE_RANGE'
      }, { status: 400 });
    }

    // Check for duplicate code
    const existingDiscount = await db.select()
      .from(discounts)
      .where(eq(discounts.code, code.trim().toUpperCase()))
      .limit(1);

    if (existingDiscount.length > 0) {
      return NextResponse.json({ 
        error: 'Discount code already exists',
        code: 'DUPLICATE_CODE'
      }, { status: 400 });
    }

    // Prepare insert data with defaults
    const now = new Date().toISOString();
    const insertData = {
      code: code.trim().toUpperCase(),
      type,
      value,
      minOrderAmount: minOrderAmount !== undefined ? minOrderAmount : 0,
      maxDiscount: maxDiscount !== undefined ? maxDiscount : null,
      usageLimit: usageLimit !== undefined ? usageLimit : null,
      usedCount: usedCount !== undefined ? usedCount : 0,
      validFrom,
      validUntil,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: now,
      updatedAt: now,
    };

    const newDiscount = await db.insert(discounts)
      .values(insertData)
      .returning();

    return NextResponse.json(newDiscount[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(discounts)
      .where(eq(discounts.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Discount not found',
        code: 'DISCOUNT_NOT_FOUND'
      }, { status: 404 });
    }

    const body = await request.json();
    const { code, type, value, minOrderAmount, maxDiscount, usageLimit, usedCount, validFrom, validUntil, isActive } = body;

    // Validate type if provided
    if (type && !['percentage', 'fixed'].includes(type)) {
      return NextResponse.json({ 
        error: 'Type must be either "percentage" or "fixed"',
        code: 'INVALID_TYPE'
      }, { status: 400 });
    }

    // Validate value if provided
    if (value !== undefined && (typeof value !== 'number' || value <= 0)) {
      return NextResponse.json({ 
        error: 'Value must be a positive number',
        code: 'INVALID_VALUE'
      }, { status: 400 });
    }

    // Validate dates if both provided
    if (validFrom && validUntil) {
      const validFromDate = new Date(validFrom);
      const validUntilDate = new Date(validUntil);

      if (isNaN(validFromDate.getTime()) || isNaN(validUntilDate.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid date format',
          code: 'INVALID_DATE_FORMAT'
        }, { status: 400 });
      }

      if (validFromDate >= validUntilDate) {
        return NextResponse.json({ 
          error: 'Valid from date must be before valid until date',
          code: 'INVALID_DATE_RANGE'
        }, { status: 400 });
      }
    }

    // Check for duplicate code if code is being changed
    if (code && code.trim().toUpperCase() !== existing[0].code) {
      const duplicateCheck = await db.select()
        .from(discounts)
        .where(eq(discounts.code, code.trim().toUpperCase()))
        .limit(1);

      if (duplicateCheck.length > 0) {
        return NextResponse.json({ 
          error: 'Discount code already exists',
          code: 'DUPLICATE_CODE'
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (code !== undefined) updateData.code = code.trim().toUpperCase();
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = value;
    if (minOrderAmount !== undefined) updateData.minOrderAmount = minOrderAmount;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
    if (usedCount !== undefined) updateData.usedCount = usedCount;
    if (validFrom !== undefined) updateData.validFrom = validFrom;
    if (validUntil !== undefined) updateData.validUntil = validUntil;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await db.update(discounts)
      .set(updateData)
      .where(eq(discounts.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(discounts)
      .where(eq(discounts.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Discount not found',
        code: 'DISCOUNT_NOT_FOUND'
      }, { status: 404 });
    }

    const deleted = await db.delete(discounts)
      .where(eq(discounts.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Discount deleted successfully',
      discount: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}