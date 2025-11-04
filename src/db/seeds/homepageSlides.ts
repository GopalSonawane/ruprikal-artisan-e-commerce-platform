import { db } from '@/db';
import { homepageSlides } from '@/db/schema';

async function main() {
    const sampleSlides = [
        {
            title: 'Welcome to Ruprikal',
            subtitle: 'Discover Unique Handmade Treasures & Custom Designs',
            imageUrl: '/images/slides/welcome-banner.jpg',
            linkUrl: '/products',
            buttonText: 'Shop Now',
            displayOrder: 1,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            title: 'Festive Sale Live!',
            subtitle: 'Get up to 30% off on all handmade gifts and decor items',
            imageUrl: '/images/slides/festive-sale.jpg',
            linkUrl: '/category/festive-collection',
            buttonText: 'Explore Offers',
            displayOrder: 2,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            title: 'New Arrivals',
            subtitle: 'Check out our latest collection of printed t-shirts and canvas art',
            imageUrl: '/images/slides/new-arrivals.jpg',
            linkUrl: '/products?sort=newest',
            buttonText: 'View Collection',
            displayOrder: 3,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            title: 'Custom Designs Available',
            subtitle: 'Personalize your gifts with custom photo frames and greeting cards',
            imageUrl: '/images/slides/custom-designs.jpg',
            linkUrl: '/category/gifts',
            buttonText: 'Customize Now',
            displayOrder: 4,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ];

    await db.insert(homepageSlides).values(sampleSlides);
    
    console.log('✅ Homepage slides seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});