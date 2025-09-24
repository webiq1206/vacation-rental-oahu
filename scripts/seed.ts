import { db } from "../server/db";
import { 
  users, 
  settings
} from "../shared/schema";
import { hashPassword } from "../server/auth";

async function seed() {
  // Environment check - only run in development
  if (process.env.NODE_ENV === 'production') {
    console.log("🚫 Seed script disabled in production environment");
    console.log("   Use the admin interface to manage content in production");
    return;
  }

  console.log("🌱 Starting minimal development seed...");
  console.log("⚠️  Development mode detected - seeding basic scaffolding only");

  try {
    // Clear existing data (development only)
    console.log("🧹 Clearing existing data...");
    await db.delete(settings);
    await db.delete(users);

    // Create admin user for development access
    console.log("👤 Creating development admin user...");
    await db.insert(users).values({
      email: "admin@localhost.dev",
      password: await hashPassword("admin123"),
      role: "admin",
    });

    // Create minimal system settings required for app functionality
    console.log("⚙️ Setting up essential system settings...");
    const essentialSettings = [
      // Core application settings
      { key: "currency", value: { value: "USD" } },
      { key: "timezone", value: { value: "America/Los_Angeles" } },
      
      // Email configuration (required for functionality)
      { key: "email_provider", value: { value: "resend" } },
      { key: "from_email", value: { value: "noreply@localhost.dev" } },
      { key: "from_name", value: { value: "Development Site" } },
      
      // Payment configuration (test mode)
      { key: "stripe_test_mode", value: { value: true } },
      
      // Basic operational settings
      { key: "notifications_enabled", value: { value: true } },
      { key: "auto_confirmation", value: { value: false } },
      { key: "require_approval", value: { value: true } },
    ];

    for (const setting of essentialSettings) {
      await db.insert(settings).values(setting);
    }

    console.log("✅ Development seed completed successfully!");
    console.log("\n📋 Development Setup Summary:");
    console.log("👤 Admin User: admin@localhost.dev / admin123");
    console.log("⚙️  Essential settings: Currency, timezone, email, payment (test mode)");
    console.log("🏗️  Ready for content creation via admin interface");
    console.log("\n💡 Next steps:");
    console.log("   1. Login to admin panel with the credentials above");
    console.log("   2. Create your property details");
    console.log("   3. Upload your photos");
    console.log("   4. Configure your amenities");
    console.log("   5. Set your pricing rules");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

// Export for potential programmatic use
export { seed };

// Self-execute when run directly
seed()
  .then(() => {
    console.log("🎉 Seed process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seed process failed:", error);
    process.exit(1);
  });