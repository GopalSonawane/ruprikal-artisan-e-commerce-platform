import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, like, and, or, desc, asc, gte, lte } from 'drizzle-orm';

// Helper function to generate unique order number
async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  
  // Get the last order number for the current year
  const lastOrder = await db.select()
    .from(orders)
    .where(like(orders.orderNumber, `${prefix}%`))
    .orderBy(desc(orders.orderNumber))
    .limit(1);
  
  let nextNumber = 1;
  if (lastOrder.length > 0) {
    const lastNumber = parseInt(lastOrder[0].orderNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate status
function isValidStatus(status: string): boolean {
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  return validStatuses.includes(status);
}

// Helper function to validate payment status
function isValidPaymentStatus(status: string): boolean {
  const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
  return validStatuses.includes(status);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const orderNumber = searchParams.get('orderNumber');

    // Single order fetch by ID or orderNumber
    if (id || orderNumber) {
      let whereCondition;
      
      if (id) {
        if (isNaN(parseInt(id))) {
          return NextResponse.json({ 
            error: "Valid ID is required",
            code: "INVALID_ID" 
          }, { status: 400 });
        }
        whereCondition = eq(orders.id, parseInt(id));
      } else if (orderNumber) {
        whereCondition = eq(orders.orderNumber, orderNumber);
      }

      const order = await db.select()
        .from(orders)
        .where(whereCondition)
        .limit(1);

      if (order.length === 0) {
        return NextResponse.json({ 
          error: 'Order not found',
          code: "ORDER_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(order[0], { status: 200 });
    }

    // List orders with filters, search, and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sort = searchParams.get('sort') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'desc';

    let query = db.select().from(orders);
    const conditions = [];

    // Filter by userId
    if (userId) {
      conditions.push(eq(orders.userId, userId));
    }

    // Filter by status
    if (status) {
      conditions.push(eq(orders.status, status));
    }

    // Filter by payment status
    if (paymentStatus) {
      conditions.push(eq(orders.paymentStatus, paymentStatus));
    }

    // Filter by date range
    if (startDate) {
      conditions.push(gte(orders.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(orders.createdAt, endDate));
    }

    // Search functionality
    if (search) {
      const searchCondition = or(
        like(orders.orderNumber, `%${search}%`),
        like(orders.customerName, `%${search}%`),
        like(orders.customerEmail, `%${search}%`),
        like(orders.customerPhone, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = orders[sort as keyof typeof orders] ?? orders.createdAt;
    query = order === 'asc' 
      ? query.orderBy(asc(sortColumn))
      : query.orderBy(desc(sortColumn));

    // Apply pagination
    const results = await query.limit(limit).offset(offset);

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
    const {
      userId,
      subtotal,
      shippingCharge,
      totalAmount,
      paymentMethod,
      shippingAddress,
      billingAddress,
      pincode,
      customerName,
      customerEmail,
      customerPhone,
      discountAmount,
      discountCode,
      taxAmount,
      status,
      paymentStatus,
      razorpayOrderId,
      razorpayPaymentId
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: "userId is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (!subtotal || subtotal < 0) {
      return NextResponse.json({ 
        error: "Valid subtotal is required",
        code: "INVALID_SUBTOTAL" 
      }, { status: 400 });
    }

    if (!shippingCharge || shippingCharge < 0) {
      return NextResponse.json({ 
        error: "Valid shippingCharge is required",
        code: "INVALID_SHIPPING_CHARGE" 
      }, { status: 400 });
    }

    if (!totalAmount || totalAmount < 0) {
      return NextResponse.json({ 
        error: "Valid totalAmount is required",
        code: "INVALID_TOTAL_AMOUNT" 
      }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ 
        error: "paymentMethod is required",
        code: "MISSING_PAYMENT_METHOD" 
      }, { status: 400 });
    }

    if (!shippingAddress) {
      return NextResponse.json({ 
        error: "shippingAddress is required",
        code: "MISSING_SHIPPING_ADDRESS" 
      }, { status: 400 });
    }

    if (!billingAddress) {
      return NextResponse.json({ 
        error: "billingAddress is required",
        code: "MISSING_BILLING_ADDRESS" 
      }, { status: 400 });
    }

    if (!pincode) {
      return NextResponse.json({ 
        error: "pincode is required",
        code: "MISSING_PINCODE" 
      }, { status: 400 });
    }

    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ 
        error: "customerName is required",
        code: "MISSING_CUSTOMER_NAME" 
      }, { status: 400 });
    }

    if (!customerEmail || !customerEmail.trim()) {
      return NextResponse.json({ 
        error: "customerEmail is required",
        code: "MISSING_CUSTOMER_EMAIL" 
      }, { status: 400 });
    }

    if (!isValidEmail(customerEmail)) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL_FORMAT" 
      }, { status: 400 });
    }

    if (!customerPhone || !customerPhone.trim()) {
      return NextResponse.json({ 
        error: "customerPhone is required",
        code: "MISSING_CUSTOMER_PHONE" 
      }, { status: 400 });
    }

    // Validate optional amounts
    if (discountAmount !== undefined && discountAmount < 0) {
      return NextResponse.json({ 
        error: "discountAmount must be positive or zero",
        code: "INVALID_DISCOUNT_AMOUNT" 
      }, { status: 400 });
    }

    if (taxAmount !== undefined && taxAmount < 0) {
      return NextResponse.json({ 
        error: "taxAmount must be positive or zero",
        code: "INVALID_TAX_AMOUNT" 
      }, { status: 400 });
    }

    // Validate status if provided
    if (status && !isValidStatus(status)) {
      return NextResponse.json({ 
        error: "Invalid status value",
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Validate payment status if provided
    if (paymentStatus && !isValidPaymentStatus(paymentStatus)) {
      return NextResponse.json({ 
        error: "Invalid payment status value",
        code: "INVALID_PAYMENT_STATUS" 
      }, { status: 400 });
    }

    // Generate unique order number
    const orderNumber = await generateOrderNumber();
    const now = new Date().toISOString();

    // Create order
    const newOrder = await db.insert(orders)
      .values({
        userId,
        orderNumber,
        status: status || 'pending',
        subtotal,
        discountAmount: discountAmount || 0,
        discountCode: discountCode || null,
        shippingCharge,
        taxAmount: taxAmount || 0,
        totalAmount,
        paymentMethod,
        paymentStatus: paymentStatus || 'pending',
        razorpayOrderId: razorpayOrderId || null,
        razorpayPaymentId: razorpayPaymentId || null,
        shippingAddress: JSON.stringify(shippingAddress),
        billingAddress: JSON.stringify(billingAddress),
        pincode,
        customerName: customerName.trim(),
        customerEmail: customerEmail.toLowerCase().trim(),
        customerPhone: customerPhone.trim(),
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newOrder[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if order exists
    const existingOrder = await db.select()
      .from(orders)
      .where(eq(orders.id, parseInt(id)))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({ 
        error: 'Order not found',
        code: "ORDER_NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const {
      status,
      paymentStatus,
      razorpayOrderId,
      razorpayPaymentId,
      shippingAddress,
      billingAddress
    } = body;

    // Validate status if provided
    if (status && !isValidStatus(status)) {
      return NextResponse.json({ 
        error: "Invalid status value",
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Validate payment status if provided
    if (paymentStatus && !isValidPaymentStatus(paymentStatus)) {
      return NextResponse.json({ 
        error: "Invalid payment status value",
        code: "INVALID_PAYMENT_STATUS" 
      }, { status: 400 });
    }

    // Build update object
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (status !== undefined) updates.status = status;
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;
    if (razorpayOrderId !== undefined) updates.razorpayOrderId = razorpayOrderId;
    if (razorpayPaymentId !== undefined) updates.razorpayPaymentId = razorpayPaymentId;
    if (shippingAddress !== undefined) updates.shippingAddress = JSON.stringify(shippingAddress);
    if (billingAddress !== undefined) updates.billingAddress = JSON.stringify(billingAddress);

    // Update order
    const updatedOrder = await db.update(orders)
      .set(updates)
      .where(eq(orders.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedOrder[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if order exists
    const existingOrder = await db.select()
      .from(orders)
      .where(eq(orders.id, parseInt(id)))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({ 
        error: 'Order not found',
        code: "ORDER_NOT_FOUND" 
      }, { status: 404 });
    }

    // Check if order can be deleted (only pending or cancelled orders)
    const orderStatus = existingOrder[0].status;
    if (orderStatus !== 'pending' && orderStatus !== 'cancelled') {
      return NextResponse.json({ 
        error: `Cannot delete order with status '${orderStatus}'. Only pending or cancelled orders can be deleted.`,
        code: "CANNOT_DELETE_ORDER" 
      }, { status: 400 });
    }

    // Delete order
    const deletedOrder = await db.delete(orders)
      .where(eq(orders.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Order deleted successfully',
      order: deletedOrder[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}