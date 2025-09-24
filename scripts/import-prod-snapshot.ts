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
import { readFileSync } from 'fs';
import { sql } from 'drizzle-orm';

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

async function validateProductionEmpty() {
  console.log('🔍 Checking if production database is safe to populate...');
  
  const counts = {
    users: (await db.select({ count: sql`count(*)` }).from(users))[0].count,
    property: (await db.select({ count: sql`count(*)` }).from(property))[0].count,
    photos: (await db.select({ count: sql`count(*)` }).from(photos))[0].count,
    amenities: (await db.select({ count: sql`count(*)` }).from(amenities))[0].count,
    attractions: (await db.select({ count: sql`count(*)` }).from(nearby_attractions))[0].count,
    reviews: (await db.select({ count: sql`count(*)` }).from(guest_reviews))[0].count,
    blackoutDates: (await db.select({ count: sql`count(*)` }).from(blackout_dates))[0].count,
    bookings: (await db.select({ count: sql`count(*)` }).from(bookings))[0].count
  };

  const hasExistingData = Object.values(counts).some(count => Number(count) > 0);
  
  if (hasExistingData) {
    console.log('⚠️  Production database contains existing data:');
    Object.entries(counts).forEach(([table, count]) => {
      if (Number(count) > 0) console.log(`   • ${table}: ${count} records`);
    });
    
    const proceed = process.argv.includes('--force');
    if (!proceed) {
      throw new Error('Production database is not empty. Use --force flag to override.');
    }
    console.log('🔄 --force flag detected, proceeding with data import...');
  }
  
  return counts;
}

// Helper function to convert timestamp strings back to Date objects
function convertTimestamps(data: any[]): any[] {
  return data.map(record => {
    const converted = { ...record };
    for (const key in converted) {
      if (key.endsWith('_at') || key.endsWith('_date') || key === 'created_at' || key === 'approved_at' || key === 'submitted_at') {
        if (converted[key] && typeof converted[key] === 'string') {
          converted[key] = new Date(converted[key]);
        }
      }
    }
    return converted;
  });
}

async function importToProduction(snapshotFile: string) {
  console.log('🚀 Starting production database import...');

  let snapshot: DatabaseSnapshot;
  try {
    const snapshotData = readFileSync(snapshotFile, 'utf8');
    snapshot = JSON.parse(snapshotData);
    console.log(`📦 Loaded snapshot from ${snapshot.exportTimestamp}`);
  } catch (error) {
    throw new Error(`Failed to load snapshot file: ${error}`);
  }

  // Validate production state
  await validateProductionEmpty();

  // Start transaction
  console.log('🔒 Starting database transaction...');
  
  try {
    await db.transaction(async (tx) => {
      console.log('🧹 Clearing existing data (if any)...');
      
      // Delete in reverse dependency order to avoid constraint violations
      await tx.delete(property_amenities);
      await tx.delete(guest_reviews);
      await tx.delete(airbnb_reviews);
      await tx.delete(nearby_attractions);
      await tx.delete(photos);
      await tx.delete(holds);
      await tx.delete(external_calendars);
      await tx.delete(bookings);
      await tx.delete(guests);
      await tx.delete(blackout_dates);
      await tx.delete(pricing_rules);
      await tx.delete(property);
      await tx.delete(amenities);
      await tx.delete(amenity_categories);
      await tx.delete(coupons);
      await tx.delete(users);
      await tx.delete(settings);

      console.log('📊 Importing data tables...');
      
      // Insert in dependency order
      if (snapshot.settings.length > 0) {
        await tx.insert(settings).values(convertTimestamps(snapshot.settings));
        console.log(`   ✅ Settings: ${snapshot.settings.length} records`);
      }

      if (snapshot.users.length > 0) {
        await tx.insert(users).values(convertTimestamps(snapshot.users));
        console.log(`   ✅ Users: ${snapshot.users.length} records`);
      }

      if (snapshot.coupons.length > 0) {
        await tx.insert(coupons).values(convertTimestamps(snapshot.coupons));
        console.log(`   ✅ Coupons: ${snapshot.coupons.length} records`);
      }

      if (snapshot.property.length > 0) {
        await tx.insert(property).values(convertTimestamps(snapshot.property));
        console.log(`   ✅ Property: ${snapshot.property.length} records`);
      }

      if (snapshot.blackoutDates.length > 0) {
        await tx.insert(blackout_dates).values(convertTimestamps(snapshot.blackoutDates));
        console.log(`   ✅ Blackout Dates: ${snapshot.blackoutDates.length} records`);
      }

      if (snapshot.pricingRules.length > 0) {
        await tx.insert(pricing_rules).values(convertTimestamps(snapshot.pricingRules));
        console.log(`   ✅ Pricing Rules: ${snapshot.pricingRules.length} records`);
      }

      if (snapshot.amenityCategories.length > 0) {
        await tx.insert(amenity_categories).values(convertTimestamps(snapshot.amenityCategories));
        console.log(`   ✅ Amenity Categories: ${snapshot.amenityCategories.length} records`);
      }

      if (snapshot.amenities.length > 0) {
        await tx.insert(amenities).values(convertTimestamps(snapshot.amenities));
        console.log(`   ✅ Amenities: ${snapshot.amenities.length} records`);
      }

      if (snapshot.photos.length > 0) {
        await tx.insert(photos).values(convertTimestamps(snapshot.photos));
        console.log(`   ✅ Photos: ${snapshot.photos.length} records`);
      }

      if (snapshot.nearbyAttractions.length > 0) {
        await tx.insert(nearby_attractions).values(convertTimestamps(snapshot.nearbyAttractions));
        console.log(`   ✅ Nearby Attractions: ${snapshot.nearbyAttractions.length} records`);
      }

      if (snapshot.bookings.length > 0) {
        await tx.insert(bookings).values(convertTimestamps(snapshot.bookings));
        console.log(`   ✅ Bookings: ${snapshot.bookings.length} records`);
      }

      if (snapshot.guestReviews.length > 0) {
        await tx.insert(guest_reviews).values(convertTimestamps(snapshot.guestReviews));
        console.log(`   ✅ Guest Reviews: ${snapshot.guestReviews.length} records`);
      }

      if (snapshot.guests.length > 0) {
        await tx.insert(guests).values(convertTimestamps(snapshot.guests));
        console.log(`   ✅ Guests: ${snapshot.guests.length} records`);
      }

      if (snapshot.externalCalendars.length > 0) {
        await tx.insert(external_calendars).values(convertTimestamps(snapshot.externalCalendars));
        console.log(`   ✅ External Calendars: ${snapshot.externalCalendars.length} records`);
      }

      if (snapshot.holds.length > 0) {
        await tx.insert(holds).values(convertTimestamps(snapshot.holds));
        console.log(`   ✅ Holds: ${snapshot.holds.length} records`);
      }

      if (snapshot.airbnbReviews.length > 0) {
        await tx.insert(airbnb_reviews).values(convertTimestamps(snapshot.airbnbReviews));
        console.log(`   ✅ Airbnb Reviews: ${snapshot.airbnbReviews.length} records`);
      }

      if (snapshot.propertyAmenities.length > 0) {
        await tx.insert(property_amenities).values(snapshot.propertyAmenities);
        console.log(`   ✅ Property-Amenity Links: ${snapshot.propertyAmenities.length} records`);
      }

      console.log('✅ All data imported successfully within transaction!');
    });

    // Validate import success
    console.log('🔍 Validating import results...');
    const finalCounts = {
      property: (await db.select({ count: sql`count(*)` }).from(property))[0].count,
      photos: (await db.select({ count: sql`count(*)` }).from(photos))[0].count,
      amenities: (await db.select({ count: sql`count(*)` }).from(amenities))[0].count,
      attractions: (await db.select({ count: sql`count(*)` }).from(nearby_attractions))[0].count,
      reviews: (await db.select({ count: sql`count(*)` }).from(guest_reviews))[0].count
    };

    console.log('📊 Final production database counts:');
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`   • ${table}: ${count} records`);
    });

    return finalCounts;

  } catch (error) {
    console.error('❌ Transaction failed, all changes rolled back:', error);
    throw error;
  }
}

async function runSmokeTests() {
  console.log('🧪 Running post-import smoke tests...');
  
  try {
    // Test property exists
    const propertyData = await db.select().from(property).limit(1);
    if (propertyData.length === 0) throw new Error('No property data found');
    
    // Test photos exist
    const photoData = await db.select().from(photos).limit(1);
    if (photoData.length === 0) throw new Error('No photo data found');
    
    // Test amenities exist
    const amenityData = await db.select().from(amenities).limit(1);
    if (amenityData.length === 0) throw new Error('No amenity data found');
    
    console.log('✅ All smoke tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Smoke tests failed:', error);
    throw error;
  }
}

// Run import if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const forceIndex = args.indexOf('--force');
  let snapshotFile = 'scripts/production-data-snapshot.json';
  
  // Remove --force from args and find snapshot file
  if (forceIndex !== -1) {
    args.splice(forceIndex, 1);
  }
  if (args.length > 0) {
    snapshotFile = args[0];
  }
  
  importToProduction(snapshotFile)
    .then(async (counts) => {
      console.log('🎉 Import completed successfully!');
      await runSmokeTests();
      console.log('🚀 Production database is now ready!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Import failed:', error);
      process.exit(1);
    });
}

export { importToProduction };