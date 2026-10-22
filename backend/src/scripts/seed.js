/**
 * Database Seed Script
 * Populates MongoDB with luxury hotel info, suites, amenities, FAQs, gallery, and initial reviews.
 *
 * Usage: npm run seed (or node src/scripts/seed.js)
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import Suite from "../models/Suite.js";
import Hotel from "../models/Hotel.js";
import Amenity from "../models/Amenity.js";
import FAQ from "../models/FAQ.js";
import Gallery from "../models/Gallery.js";
import User from "../models/User.js";
import Review from "../models/Review.js";

dotenv.config();

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {
  // fallback
}

const HOTEL_SEED = {
  name: "EQUALIRIO",
  tagline: "Where Nature Meets Modern Equilibrium",
  subheading: "An exclusive luxury eco-sanctuary nestled where lush emerald rainforest meets crystal waters.",
  location: "Rio Sanctuary Bay, Private Coastline",
  address: "100 Serenity Boulevard, Rio Bay, Paradise Coast",
  contact: {
    phone: "+1 (800) 456-EQUALIRIO",
    email: "concierge@equalirio-resort.com",
    whatsapp: "+1 (800) 456-3782",
  },
  social: {
    instagram: "https://instagram.com/equalirio",
    facebook: "https://facebook.com/equalirio",
    twitter: "https://twitter.com/equalirio",
  },
  policies: {
    checkInTime: "15:00",
    checkOutTime: "12:00",
    cancellationPolicy: "Free cancellation up to 48 hours before check-in.",
    petPolicy: "Pets are not permitted on the property.",
    smokingPolicy: "The entire property is smoke-free.",
    minimumAge: 18,
  },
  stats: {
    rating: 4.98,
    reviewCount: 342,
    totalSuites: 18,
    yearsOfExcellence: 12,
  },
  seo: {
    metaTitle: "EQUALIRIO Luxury Resort — Where Nature Meets Equilibrium",
    metaDescription: "Experience unrivalled luxury at EQUALIRIO, an exclusive eco-resort with private villas, Michelin-starred dining and world-class spa.",
    keywords: ["luxury hotel", "eco resort", "private villas", "equalirio"],
  },
  isActive: true,
};

const SUITES_SEED = [
  {
    name: "Infinity Pool Ocean Villa",
    category: "villa",
    shortDescription: "A private oceanfront villa with heated infinity pool and personal butler service.",
    description:
      "Perched gracefully above the water's edge, this private villa features an expansive heated infinity pool, outdoor rainfall shower, floor-to-ceiling glass walls, and a dedicated 24-hour personal butler.",
    pricePerNight: 950,
    currency: "USD",
    maxGuests: 4,
    bedrooms: 1,
    bathrooms: 2,
    size: { sqft: 1990, sqm: 185 },
    view: "ocean",
    isFeatured: true,
    amenities: [
      "Private Heated Infinity Pool",
      "24/7 Personal Butler Service",
      "Freestanding Marble Soaking Tub",
      "Espresso & Botanical Bar",
      "Bose Surround Sound System",
      "Complimentary Sunset Champagne",
    ],
    images: [
      {
        url: "/images/Infinity Pool Ocean Villa exterior.jpg",
        alt: "Infinity Pool Ocean Villa exterior",
        isPrimary: true,
      },
      {
        url: "/images/Villa interior bedroom.jpg",
        alt: "Villa interior bedroom",
      },
      {
        url: "/images/Villa bathroom.jpg",
        alt: "Villa bathroom",
      },
    ],
    addons: [
      { name: "Helicopter Transfer", description: "Private helicopter arrival & departure", price: 800, icon: "helicopter" },
      { name: "Sunset Spa Ritual", description: "90-min couples spa treatment", price: 350, icon: "spa" },
      { name: "Champagne Breakfast", description: "In-villa champagne breakfast for two", price: 120, icon: "champagne" },
    ],
  },
  {
    name: "Royal Equilibre Penthouse",
    category: "penthouse",
    shortDescription: "The crown jewel — rooftop plunge pool, private elevator, wine cellar and stargazing deck.",
    description:
      "The crown jewel of Equalirio. Occupying the top floor, this penthouse offers a private rooftop plunge pool, private elevator access, wine cellar, stargazing telescope deck, and bespoke spa suite.",
    pricePerNight: 1850,
    currency: "USD",
    maxGuests: 6,
    bedrooms: 2,
    bathrooms: 3,
    size: { sqft: 3440, sqm: 320 },
    view: "city",
    isFeatured: true,
    amenities: [
      "Private Rooftop Plunge Pool",
      "Private Elevator Access",
      "In-Suite Wine Cellar",
      "Private Sauna & Steam Room",
      "Chef's Private Dining Prep Room",
      "Helicopter Transfer Included",
    ],
    images: [
      {
        url: "/images/Royal Penthouse living area.jpg",
        alt: "Royal Penthouse living area",
        isPrimary: true,
      },
      {
        url: "/images/Penthouse bedroom.jpg",
        alt: "Penthouse bedroom",
      },
    ],
    addons: [
      { name: "Private Chef", description: "Exclusive 3-course dinner by our Michelin-starred chef", price: 500, icon: "chef" },
      { name: "Helicopter Transfer", description: "Private helicopter arrival & departure", price: 800, icon: "helicopter" },
    ],
  },
  {
    name: "Rainforest Sanctuary Suite",
    category: "suite",
    shortDescription: "A canopy-level eco suite with open-air baths and living walls of tropical greenery.",
    description:
      "Suspended above the forest floor, this eco-harmony suite blurs the boundary between interior and wilderness, with an open-air soaking tub, living wall of tropical plants, and a private forest meditation deck.",
    pricePerNight: 680,
    currency: "USD",
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    size: { sqft: 1290, sqm: 120 },
    view: "garden",
    isFeatured: false,
    amenities: [
      "Open-Air Forest Soaking Tub",
      "Living Tropical Plant Wall",
      "Private Forest Meditation Deck",
      "Organic Botanical Minibar",
      "Solar-Powered Climate Control",
      "Biodegradable Amenities Kit",
    ],
    images: [
      {
        url: "/images/Rainforest Sanctuary Suite exterior.jpg",
        alt: "Rainforest Sanctuary Suite exterior",
        isPrimary: true,
      },
    ],
    addons: [
      { name: "Jungle Yoga Session", description: "Private sunrise yoga in the rainforest", price: 90, icon: "yoga" },
      { name: "Sunset Spa Ritual", description: "90-min botanical spa treatment", price: 280, icon: "spa" },
    ],
  },
  {
    name: "Rio Grand Overwater Bungalow",
    category: "villa",
    shortDescription: "Direct lagoon access with glass floor viewing panels and overwater hammock nets.",
    description:
      "Suspended directly over calm turquoise waters with glass floor viewing panels, direct lagoon access stairs, and a hammock net suspended over the sea.",
    pricePerNight: 1200,
    currency: "USD",
    maxGuests: 4,
    bedrooms: 1,
    bathrooms: 2,
    size: { sqft: 2260, sqm: 210 },
    view: "ocean",
    isFeatured: true,
    amenities: [
      "Glass Floor Lagoon Viewing Panels",
      "Direct Water Access Ladder",
      "Overwater Net Hammock",
      "Kayaks & Stand-Up Paddleboards",
      "Sunset Cocktail Service",
      "Private Dock for Water Taxi",
    ],
    images: [
      {
        url: "/images/Ocean Signature Suite view.jpg",
        alt: "Ocean Signature Suite view",
        isPrimary: true,
      },
    ],
    addons: [
      { name: "Private Sailing Trip", description: "Half-day private catamaran excursion", price: 600, icon: "sail" },
      { name: "Champagne Breakfast", description: "In-suite champagne breakfast for two", price: 120, icon: "champagne" },
    ],
  },
];

const AMENITIES_SEED = [
  {
    title: "Infinite Horizon Pool",
    category: "Wellness",
    image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80",
    description: "A 50-meter temperature-controlled infinity pool that stretches seamlessly into the horizon with submerged sun loungers and cabana bar.",
    isHighlighted: true,
    displayOrder: 1,
  },
  {
    title: "Aurelia Holistic Spa",
    category: "Wellness",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
    description: "Revitalize mind and body with ancient hydrotherapy treatments, volcanic hot stone massages, and organic herbal rituals.",
    isHighlighted: true,
    displayOrder: 2,
  },
  {
    title: "Michelin-Starred Dining",
    category: "Gastronomy",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    description: "World-class culinary creations curated by Chef Alexandre Vane, emphasizing organic sea-to-table seafood and regional botanical infusions.",
    isHighlighted: true,
    displayOrder: 3,
  },
  {
    title: "Private Helipad & Yacht Dock",
    category: "Services",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    description: "VIP arrival via private charter helicopter or direct luxury yacht mooring with expedited private check-in.",
    isHighlighted: true,
    displayOrder: 4,
  },
];

const FAQS_SEED = [
  {
    question: "How do I reach Equalirio Hotel & Resort?",
    answer: "We offer private luxury yacht transfers from the main marine harbor (25 minutes) or direct 10-minute helicopter charters from the airport straight to our private helipad.",
    category: "Transportation",
    displayOrder: 1,
  },
  {
    question: "What is included in the suite rate?",
    answer: "All suite stays include gourmet daily breakfast, 24/7 personal butler concierge, access to Aurelia Spa hydrotherapy pools, water sports equipment (kayaks, paddleboards), and complimentary sunset champagne.",
    category: "Reservations",
    displayOrder: 2,
  },
  {
    question: "Is Equalirio an eco-certified sustainable resort?",
    answer: "Yes. Equalirio operates on 100% solar and hydro energy, features zero-single-use-plastic policies, uses on-site water recycling filtration, and supports local wildlife conservation.",
    category: "General",
    displayOrder: 3,
  },
  {
    question: "What is the check-in and check-out timing?",
    answer: "Standard check-in is at 3:00 PM and check-out is at 12:00 PM. Flexible early check-in or late check-out is complimentary subject to availability for our villa and penthouse guests.",
    category: "Policies",
    displayOrder: 4,
  },
];

const GALLERY_SEED = [
  {
    title: "Sunset over Equalirio Bay",
    category: "Architecture",
    image: { url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80", alt: "Sunset over Equalirio Bay" },
    displayOrder: 1,
    isFeatured: true,
  },
  {
    title: "Private Villa Ocean Pool",
    category: "Suites",
    image: { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80", alt: "Private Villa Ocean Pool" },
    displayOrder: 2,
    isFeatured: true,
  },
  {
    title: "Aurelia Spa Meditation Room",
    category: "Wellness",
    image: { url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1000&q=80", alt: "Aurelia Spa Meditation Room" },
    displayOrder: 3,
    isFeatured: false,
  },
  {
    title: "Rio Gourmet Dining Deck",
    category: "Dining",
    image: { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80", alt: "Rio Gourmet Dining Deck" },
    displayOrder: 4,
    isFeatured: true,
  },
  {
    title: "Overwater Hammock at Dusk",
    category: "Suites",
    image: { url: "https://images.unsplash.com/photo-1439130497086-d143048282cc?auto=format&fit=crop&w=1000&q=80", alt: "Overwater Hammock at Dusk" },
    displayOrder: 5,
    isFeatured: false,
  },
  {
    title: "Lush Eco Rainforest Paths",
    category: "Architecture",
    image: { url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1000&q=80", alt: "Lush Eco Rainforest Paths" },
    displayOrder: 6,
    isFeatured: false,
  },
];

const seed = async () => {
  try {
    if (!process.env.MONGODB_URL) {
      throw new Error("MONGODB_URL is not set in .env");
    }

    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ Connected to MongoDB");

    // 1. Hotel info
    await Hotel.deleteMany({});
    const seededHotel = await Hotel.create(HOTEL_SEED);
    console.log(`🏨 Seeded Hotel: ${seededHotel.name}`);

    // 2. Suites
    await Suite.deleteMany({});
    const suitesWithSlug = SUITES_SEED.map((s) => ({
      ...s,
      slug: s.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim()
    }));
    const insertedSuites = await Suite.insertMany(suitesWithSlug);
    console.log(`🛏  Seeded ${insertedSuites.length} suites`);

    // 3. Amenities
    await Amenity.deleteMany({});
    const insertedAmenities = await Amenity.insertMany(AMENITIES_SEED);
    console.log(`✨ Seeded ${insertedAmenities.length} amenities`);

    // 4. FAQs
    await FAQ.deleteMany({});
    const insertedFAQs = await FAQ.insertMany(FAQS_SEED);
    console.log(`❓ Seeded ${insertedFAQs.length} FAQs`);

    // 5. Gallery
    await Gallery.deleteMany({});
    const insertedGallery = await Gallery.insertMany(GALLERY_SEED);
    console.log(`📸 Seeded ${insertedGallery.length} gallery items`);

    // 6. Demo Users & Reviews
    let demoUser = await User.findOne({ email: "guest.elena@equalirio-resort.com" });
    if (!demoUser) {
      demoUser = await User.create({
        name: "Elena Rostova",
        email: "guest.elena@equalirio-resort.com",
        password: "Password123!",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        role: "user",
      });
    }

    let demoUser2 = await User.findOne({ email: "guest.marcus@equalirio-resort.com" });
    if (!demoUser2) {
      demoUser2 = await User.create({
        name: "Dr. Marcus Vance",
        email: "guest.marcus@equalirio-resort.com",
        password: "Password123!",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        role: "user",
      });
    }

    await Review.deleteMany({});
    if (insertedSuites.length > 0) {
      await Review.create([
        {
          user: demoUser._id,
          suite: insertedSuites[0]._id,
          ratings: { overall: 5, cleanliness: 5, service: 5, location: 5, value: 5, amenities: 5 },
          title: "An Oasis of Pure Serenity",
          comment: "Equalirio redefined luxury for me. The seamless integration of eco-sustainable architecture with 6-star service and dining is unparalleled anywhere in the world.",
          guestType: "couple",
          stayedInMonth: "August 2026",
          status: "approved",
          isVerifiedStay: true,
        },
        {
          user: demoUser2._id,
          suite: insertedSuites[1]?._id || insertedSuites[0]._id,
          ratings: { overall: 5, cleanliness: 5, service: 5, location: 5, value: 5, amenities: 5 },
          title: "Unrivaled Butler Service & Views",
          comment: "Our butler Carlos anticipated every single need before we even voiced it. Sunset over the ocean from our private infinity pool was a memory we will treasure forever.",
          guestType: "couple",
          stayedInMonth: "July 2026",
          status: "approved",
          isVerifiedStay: true,
        },
      ]);
      console.log(`⭐ Seeded verified guest reviews`);
    }

    // Allow post-save aggregate recalculations to complete
    await new Promise((resolve) => setTimeout(resolve, 1500));

    await mongoose.disconnect();
    console.log("\n🎉 Full database seed complete! Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
