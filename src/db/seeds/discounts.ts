import { db } from '@/db';
import { discounts } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date().toISOString();
    
    const sampleDiscounts = [
        {
            code: 'WELCOME10',
            type: 'percentage',
            value: 10,
            minOrderAmount: 500,
            maxDiscount: 200,
            usageLimit: 100,
            usedCount: 0,
            validFrom: new Date('2024-01-01').toISOString(),
            validUntil: new Date('2024-12-31').toISOString(),
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            code: 'RUPRI50',
            type: 'fixed',
            value: 50,
            minOrderAmount: 1000,
            maxDiscount: null,
            usageLimit: 500,
            usedCount: 0,
            validFrom: new Date('2024-01-01').toISOString(),
            validUntil: new Date('2024-12-31').toISOString(),
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            code: 'FESTIVAL20',
            type: 'percentage',
            value: 20,
            minOrderAmount: 1500,
            maxDiscount: 500,
            usageLimit: 200,
            usedCount: 0,
            validFrom: new Date('2024-01-01').toISOString(),
            validUntil: new Date('2024-12-31').toISOString(),
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            code: 'FIRSTORDER',
            type: 'percentage',
            value: 15,
            minOrderAmount: 799,
            maxDiscount: 300,
            usageLimit: 1000,
            usedCount: 0,
            validFrom: new Date('2024-01-01').toISOString(),
            validUntil: new Date('2024-12-31').toISOString(),
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            code: 'BULK100',
            type: 'fixed',
            value: 100,
            minOrderAmount: 2500,
            maxDiscount: null,
            usageLimit: 50,
            usedCount: 0,
            validFrom: new Date('2024-01-01').toISOString(),
            validUntil: new Date('2024-12-31').toISOString(),
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        }
    ];

    await db.insert(discounts).values(sampleDiscounts);
    
    console.log('✅ Discounts seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});