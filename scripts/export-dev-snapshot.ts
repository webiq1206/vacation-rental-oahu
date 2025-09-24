import { db } from '../server/db';
import { 
  property, 
  photos, 
  amenities, 
  amenity_categories,
  nearby_attractions, 
  guest_reviews,
  property_amenities,
  settings,
  blackout_dates,
  pricing_rules,
  users,
  coupons,
  bookings,
  guests,
  airbnb_reviews,
  external_calendars,
  holds
} from '../shared/schema';
import { writeFileSync } from 'fs';

interface DatabaseSnapshot {
  users: any[];
  property: any[];
  photos: any[];
  amenities: any[];
  amenityCategories: any[];
  propertyAmenities: any[];
  nearbyAttractions: any[];
  guestReviews: any[];
  settings: any[];
  blackoutDates: any[];
  pricingRules: any[];
  coupons: any[];
  bookings: any[];
  guests: any[];
  airbnbReviews: any[];
  externalCalendars: any[];
  holds: any[];
  exportTimestamp: string;
}

async function exportDevelopmentData() {
  console.log('🔄 Exporting development database snapshot...');

  try {
    const snapshot: DatabaseSnapshot = {
      users: await db.select().from(users),
      property: await db.select().from(property),
      photos: await db.select().from(photos),
      amenities: await db.select().from(amenities),
      amenityCategories: await db.select().from(amenity_categories),
      propertyAmenities: await db.select().from(property_amenities),
      nearbyAttractions: await db.select().from(nearby_attractions),
      guestReviews: await db.select().from(guest_reviews),
      settings: await db.select().from(settings),
      blackoutDates: await db.select().from(blackout_dates),
      pricingRules: await db.select().from(pricing_rules),
      coupons: await db.select().from(coupons),
      bookings: await db.select().from(bookings),
      guests: await db.select().from(guests),
      airbnbReviews: await db.select().from(airbnb_reviews),
      externalCalendars: await db.select().from(external_calendars),
      holds: await db.select().from(holds),
      exportTimestamp: new Date().toISOString()
    };

    // Write to JSON file
    const filename = `scripts/production-data-snapshot.json`;
    writeFileSync(filename, JSON.stringify(snapshot, null, 2));

    console.log('✅ Development data exported successfully!');
    console.log(`📊 Data Summary:`);
    console.log(`   • Users: ${snapshot.users.length}`);
    console.log(`   • Properties: ${snapshot.property.length}`);
    console.log(`   • Photos: ${snapshot.photos.length}`);
    console.log(`   • Amenities: ${snapshot.amenities.length}`);
    console.log(`   • Amenity Categories: ${snapshot.amenityCategories.length}`);
    console.log(`   • Property-Amenity Links: ${snapshot.propertyAmenities.length}`);
    console.log(`   • Nearby Attractions: ${snapshot.nearbyAttractions.length}`);
    console.log(`   • Guest Reviews: ${snapshot.guestReviews.length}`);
    console.log(`   • Settings: ${snapshot.settings.length}`);
    console.log(`   • Blackout Dates: ${snapshot.blackoutDates.length}`);
    console.log(`   • Pricing Rules: ${snapshot.pricingRules.length}`);
    console.log(`   • Coupons: ${snapshot.coupons.length}`);
    console.log(`   • Bookings: ${snapshot.bookings.length}`);
    console.log(`   • Guests: ${snapshot.guests.length}`);
    console.log(`   • Airbnb Reviews: ${snapshot.airbnbReviews.length}`);
    console.log(`   • External Calendars: ${snapshot.externalCalendars.length}`);
    console.log(`   • Holds: ${snapshot.holds.length}`);
    console.log(`📁 Snapshot saved to: ${filename}`);

  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  }
}

// Run export if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportDevelopmentData()
    .then(() => {
      console.log('🎉 Export completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Export failed:', error);
      process.exit(1);
    });
}

export { exportDevelopmentData };