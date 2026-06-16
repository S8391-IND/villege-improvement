import { db, pool } from "./index.js";
import {
  usersTable, announcementsTable, meetingsTable,
  listingsTable, notificationsTable
} from "./schema/index.js";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminHash = await bcrypt.hash("admin123", 10);
  const [admin] = await db.insert(usersTable).values({
    name: "Admin User",
    email: "admin@village.com",
    passwordHash: adminHash,
    role: "admin",
    houseNumber: "A-01",
    familyCount: 2,
    phone: "+91-9876543210",
    bio: "Community administrator",
  }).returning().onConflictDoNothing();

  // Create resident users
  const residents = [
    { name: "Priya Sharma", email: "priya@village.com", house: "B-12", family: 4, phone: "+91-9876543211" },
    { name: "Rahul Verma", email: "rahul@village.com", house: "C-05", family: 3, phone: "+91-9876543212" },
    { name: "Sunita Patel", email: "sunita@village.com", house: "D-08", family: 2, phone: "+91-9876543213" },
    { name: "Amit Kumar", email: "amit@village.com", house: "E-03", family: 5, phone: "+91-9876543214" },
    { name: "Kavya Reddy", email: "kavya@village.com", house: "F-11", family: 2, phone: "+91-9876543215" },
  ];

  const residentHash = await bcrypt.hash("password123", 10);
  const createdResidents = [];
  for (const r of residents) {
    const [user] = await db.insert(usersTable).values({
      name: r.name, email: r.email, passwordHash: residentHash,
      role: "resident", houseNumber: r.house, familyCount: r.family, phone: r.phone,
    }).returning().onConflictDoNothing();
    if (user) createdResidents.push(user);
  }

  const adminUser = admin ?? await db.query.usersTable.findFirst({ where: (u, { eq }) => eq(u.email, "admin@village.com") });
  if (!adminUser) { console.error("Admin not found"); process.exit(1); }

  // Announcements
  await db.insert(announcementsTable).values([
    { title: "Water Supply Maintenance", content: "There will be a planned water supply interruption on Sunday from 8 AM to 2 PM for maintenance work. Please store water in advance.", authorId: adminUser.id },
    { title: "Community Diwali Celebration", content: "Join us for the annual Diwali celebration in the community hall on October 28th at 7 PM. There will be cultural programs, fireworks, and a potluck dinner.", authorId: adminUser.id },
    { title: "New Parking Rules", content: "Starting from next month, all vehicles must display their house number on the dashboard. Visitors must register at the security gate. Violating vehicles will be towed.", authorId: adminUser.id },
    { title: "Swimming Pool Renovation Complete", content: "The community swimming pool has been renovated and is now open for residents. New timings: 6 AM - 10 AM and 4 PM - 8 PM daily.", authorId: adminUser.id },
  ]).onConflictDoNothing();

  // Meetings
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  await db.insert(meetingsTable).values([
    { title: "Monthly Residents Meeting", description: "Discuss maintenance budget, upcoming projects, and resident grievances.", meetingUrl: "https://meet.google.com/abc-defg-hij", scheduledAt: nextWeek, authorId: adminUser.id },
    { title: "Security Committee Meeting", description: "Review CCTV installation, visitor management, and emergency protocols.", meetingUrl: "https://zoom.us/j/123456789", scheduledAt: nextMonth, authorId: adminUser.id },
  ]).onConflictDoNothing();

  // Marketplace listings
  if (createdResidents.length > 0) {
    await db.insert(listingsTable).values([
      { title: "Teak Wood Sofa Set", description: "3+2 seater solid teak wood sofa set with cushions. 5 years old, well maintained. Moving out so selling.", category: "Furniture", price: "8500", authorId: createdResidents[0]?.id ?? adminUser.id },
      { title: "Samsung 43\" TV", description: "Samsung 43-inch Smart TV, 4K resolution. Works perfectly. Selling due to upgrade.", category: "Electronics", price: "15000", authorId: createdResidents[1]?.id ?? adminUser.id },
      { title: "Bicycle for Sale", description: "Hero Sprint 21-speed bicycle. Used for 2 years. Good condition with new tires.", category: "Sports", price: "3500", authorId: createdResidents[2]?.id ?? adminUser.id },
      { title: "Home Tutor Available", description: "Experienced tutor available for classes 6-10. Subjects: Math, Science, English. Flexible timings.", category: "Services", price: "500", authorId: createdResidents[3]?.id ?? adminUser.id },
      { title: "Mixer Grinder", description: "Preethi mixer grinder with 3 jars. 750W. 3 years old but works great. Selling as bought new one.", category: "Appliances", price: "1800", authorId: createdResidents[4]?.id ?? adminUser.id },
    ]).onConflictDoNothing();
  }

  console.log("✅ Database seeded successfully!");
  console.log("   Admin login: admin@village.com / admin123");
  console.log("   Resident login: priya@village.com / password123");
  await pool.end();
}

seed().catch((e) => { console.error(e); process.exit(1); });
