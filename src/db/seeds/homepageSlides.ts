import { db } from '@/db';
import { homepageSlides } from '@/db/schema';

async function main() {
    const sampleSlides = [
        {
            title: 'Handcrafted with Love',
            subtitle: 'Discover unique handmade gifts',
            imageUrl: '/images/slides/handmade-banner.jpg',
            linkUrl: '/category/handmade-gifts',
            buttonText: 'Shop Now',
            displayOrder: 1,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            title: 'Express Yourself',
            subtitle: 'Trendy printed t-shirts for everyone',
            imageUrl: '/images/slides/tshirts-banner.jpg',
            linkUrl: '/category/printed-t-shirts',
            buttonText: 'Explore Collection',
            displayOrder: 2,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            title: 'Art for Your Walls',
            subtitle: 'Beautiful paintings to brighten your space',
            imageUrl: '/images/slides/paintings-banner.jpg',
            linkUrl: '/category/paintings',
            buttonText: 'View Gallery',
            displayOrder: 3,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            title: 'Transform Your Home',
            subtitle: 'Elegant decor items starting at ₹299',
            imageUrl: '/images/slides/decor-banner.jpg',
            linkUrl: '/category/home-decor',
            buttonText: 'Browse Decor',
            displayOrder: 4,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            title: 'Festive Specials',
            subtitle: 'Get 20% off on festive collection',
            imageUrl: '/images/slides/festive-banner.jpg',
            linkUrl: '/category/festive-collection',
            buttonText: 'Celebrate Now',
            displayOrder: 5,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    await db.insert(homepageSlides).values(sampleSlides);
    
    console.log('✅ Homepage slides seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});