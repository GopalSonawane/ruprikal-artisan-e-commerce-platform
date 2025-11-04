import { db } from '@/db';
import { categories } from '@/db/schema';

async function main() {
    const sampleCategories = [
        {
            name: 'Gifts',
            slug: 'gifts',
            description: 'Unique handmade gifts for every occasion',
            imageUrl: '/images/categories/gifts.jpg',
            parentId: null,
            displayOrder: 1,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'T-Shirts',
            slug: 't-shirts',
            description: 'Trendy printed t-shirts with custom designs',
            imageUrl: '/images/categories/t-shirts.jpg',
            parentId: null,
            displayOrder: 2,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Paintings',
            slug: 'paintings',
            description: 'Beautiful canvas art and wall paintings',
            imageUrl: '/images/categories/paintings.jpg',
            parentId: null,
            displayOrder: 3,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Home Decor',
            slug: 'home-decor',
            description: 'Elegant decorative items for your home',
            imageUrl: '/images/categories/home-decor.jpg',
            parentId: null,
            displayOrder: 4,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Festive Collection',
            slug: 'festive-collection',
            description: 'Special items for festivals and celebrations',
            imageUrl: '/images/categories/festive.jpg',
            parentId: null,
            displayOrder: 5,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ];

    await db.insert(categories).values(sampleCategories);
    
    console.log('✅ Categories seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});