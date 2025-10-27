import { db } from '@/db';
import { categories } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date().toISOString();
    
    const sampleCategories = [
        {
            name: 'Handmade Gifts',
            slug: 'handmade-gifts',
            description: 'Unique handcrafted gifts for every occasion',
            imageUrl: '/images/categories/handmade-gifts.jpg',
            parentId: null,
            displayOrder: 1,
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Printed T-Shirts',
            slug: 'printed-t-shirts',
            description: 'Custom designed t-shirts with vibrant prints',
            imageUrl: '/images/categories/printed-t-shirts.jpg',
            parentId: null,
            displayOrder: 2,
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Paintings',
            slug: 'paintings',
            description: 'Beautiful artwork and paintings for your space',
            imageUrl: '/images/categories/paintings.jpg',
            parentId: null,
            displayOrder: 3,
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Home Decor',
            slug: 'home-decor',
            description: 'Elegant home decor items to beautify your home',
            imageUrl: '/images/categories/home-decor.jpg',
            parentId: null,
            displayOrder: 4,
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Festive Collection',
            slug: 'festive-collection',
            description: 'Special festive items for celebrations',
            imageUrl: '/images/categories/festive-collection.jpg',
            parentId: null,
            displayOrder: 5,
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        }
    ];

    await db.insert(categories).values(sampleCategories);
    
    console.log('✅ Categories seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});