import { db } from '@/db';
import { shippingRules } from '@/db/schema';

async function main() {
    const sampleShippingRules = [
        {
            pincodeStart: '400001',
            pincodeEnd: '400099',
            state: 'Maharashtra',
            deliveryDays: 3,
            shippingCharge: 50,
            isCodAvailable: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            pincodeStart: '110001',
            pincodeEnd: '110099',
            state: 'Delhi',
            deliveryDays: 3,
            shippingCharge: 50,
            isCodAvailable: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            pincodeStart: '560001',
            pincodeEnd: '560099',
            state: 'Karnataka',
            deliveryDays: 4,
            shippingCharge: 60,
            isCodAvailable: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            pincodeStart: '600001',
            pincodeEnd: '600099',
            state: 'Tamil Nadu',
            deliveryDays: 4,
            shippingCharge: 60,
            isCodAvailable: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            pincodeStart: '700001',
            pincodeEnd: '700099',
            state: 'West Bengal',
            deliveryDays: 5,
            shippingCharge: 70,
            isCodAvailable: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            pincodeStart: '500001',
            pincodeEnd: '500099',
            state: 'Telangana',
            deliveryDays: 4,
            shippingCharge: 60,
            isCodAvailable: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            pincodeStart: '380001',
            pincodeEnd: '380099',
            state: 'Gujarat',
            deliveryDays: 4,
            shippingCharge: 65,
            isCodAvailable: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            pincodeStart: '302001',
            pincodeEnd: '302099',
            state: 'Rajasthan',
            deliveryDays: 5,
            shippingCharge: 70,
            isCodAvailable: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            pincodeStart: '226001',
            pincodeEnd: '226099',
            state: 'Uttar Pradesh',
            deliveryDays: 5,
            shippingCharge: 70,
            isCodAvailable: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            pincodeStart: '160001',
            pincodeEnd: '160099',
            state: 'Punjab',
            deliveryDays: 4,
            shippingCharge: 65,
            isCodAvailable: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ];

    await db.insert(shippingRules).values(sampleShippingRules);
    
    console.log('✅ Shipping rules seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});