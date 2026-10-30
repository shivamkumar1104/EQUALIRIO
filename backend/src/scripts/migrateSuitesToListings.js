import mongoose from "mongoose";
import dotenv from "dotenv";
import Suite from "../models/Suite.js";
import HostProfile from "../models/HostProfile.js";
import StayListing from "../models/StayListing.js";

dotenv.config();

const usage = `Usage:
  npm run migrate:suites -- --host-profile <id> --country <country> --city <city> --beds <count> --currency <ISO-4217-code> [--region <region>] [--public-area <area>] [--apply]

Without --apply, this command only validates and reports candidate draft listings.
Writing requires STAY_MIGRATION_ALLOW_WRITE=true and is blocked in production.`;

const parseArgs = (args) => {
  if (args.includes("--help")) {
    console.log(usage);
    return null;
  }

  const options = {};
  const valueOptions = new Set([
    "--host-profile",
    "--country",
    "--city",
    "--beds",
    "--currency",
    "--region",
    "--public-area",
  ]);

  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option === "--apply") {
      options.apply = true;
      continue;
    }
    if (!valueOptions.has(option) || !args[index + 1] || args[index + 1].startsWith("--")) {
      throw new Error(`Unknown option or missing value: ${option}\n\n${usage}`);
    }
    options[option] = args[index + 1].trim();
    index += 1;
  }

  const required = ["--host-profile", "--country", "--city", "--beds", "--currency"];
  const missing = required.filter((option) => !options[option]);
  if (missing.length) {
    throw new Error(`Missing required options: ${missing.join(", ")}\n\n${usage}`);
  }
  if (!mongoose.isValidObjectId(options["--host-profile"])) {
    throw new Error("--host-profile must be a valid MongoDB ObjectId.");
  }
  if (!/^[A-Z]{3}$/i.test(options["--currency"])) {
    throw new Error("--currency must be a three-letter ISO 4217 code.");
  }
  if (!/^[1-9]\d*$/.test(options["--beds"])) {
    throw new Error("--beds must be a positive whole number.");
  }

  return {
    apply: Boolean(options.apply),
    hostProfileId: options["--host-profile"],
    country: options["--country"],
    city: options["--city"],
    beds: Number(options["--beds"]),
    currency: options["--currency"].toUpperCase(),
    region: options["--region"] || "",
    publicArea: options["--public-area"] || "",
  };
};

const buildListing = (suite, options) => {
  const currency = (suite.currency || "USD").toUpperCase();
  if (currency !== options.currency) {
    throw new Error(`source currency ${currency} does not match configured currency ${options.currency}`);
  }

  const fractionDigits = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).resolvedOptions().maximumFractionDigits;
  const priceMinorExact = suite.pricePerNight * (10 ** fractionDigits);
  const priceMinor = Math.round(priceMinorExact);
  if (!Number.isSafeInteger(priceMinor) || priceMinor <= 0 || Math.abs(priceMinorExact - priceMinor) > 1e-7) {
    throw new Error("nightly price cannot be represented safely in minor currency units");
  }

  return {
    sourceSuite: suite._id,
    host: options.hostProfileId,
    title: suite.name,
    description: [suite.shortDescription, suite.description].filter(Boolean).join("\n\n"),
    propertyType: "hotel",
    location: {
      country: options.country,
      region: options.region,
      city: options.city,
      publicArea: options.publicArea,
    },
    capacity: {
      guests: suite.maxGuests,
      bedrooms: suite.bedrooms,
      beds: options.beds,
      bathrooms: suite.bathrooms,
    },
    amenities: suite.amenities,
    photos: suite.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      isCover: image.isPrimary,
    })),
    nightlyPriceMinor: priceMinor,
    currency,
    status: "draft",
  };
};

const run = async () => {
  const options = parseArgs(process.argv.slice(2));
  if (!options) return;

  if (options.apply && process.env.NODE_ENV === "production") {
    throw new Error("Refusing to apply the migration while NODE_ENV=production.");
  }
  if (options.apply && process.env.STAY_MIGRATION_ALLOW_WRITE !== "true") {
    throw new Error("Set STAY_MIGRATION_ALLOW_WRITE=true to explicitly enable migration writes.");
  }
  if (!process.env.MONGODB_URL?.trim()) {
    throw new Error("MONGODB_URL environment variable is required.");
  }

  await mongoose.connect(process.env.MONGODB_URL);
  try {
    const hostProfile = await HostProfile.findOne({
      _id: options.hostProfileId,
      status: "approved",
    }).select("_id");
    if (!hostProfile) {
      throw new Error("The configured host profile does not exist or is not approved.");
    }

    const suites = await Suite.find({}).sort({ _id: 1 }).lean();
    const existingLinks = await StayListing.find({
      sourceSuite: { $in: suites.map((suite) => suite._id) },
    }).select("sourceSuite").lean();
    const linkCounts = new Map();
    for (const listing of existingLinks) {
      const sourceId = listing.sourceSuite.toString();
      linkCounts.set(sourceId, (linkCounts.get(sourceId) || 0) + 1);
    }

    const report = [];
    const candidates = [];
    for (const suite of suites) {
      const sourceId = suite._id.toString();
      const linkCount = linkCounts.get(sourceId) || 0;
      if (linkCount > 1) {
        report.push({
          suiteId: suite._id,
          name: suite.name,
          result: "blocked",
          reason: "multiple listings already reference this source suite",
        });
        continue;
      }
      if (linkCount === 1) {
        report.push({ suiteId: suite._id, name: suite.name, result: "already_migrated" });
        continue;
      }

      try {
        const candidate = new StayListing(buildListing(suite, options));
        await candidate.validate();
        candidates.push(candidate);
        report.push({ suiteId: suite._id, name: suite.name, result: "ready_as_draft" });
      } catch (error) {
        report.push({
          suiteId: suite._id,
          name: suite.name,
          result: "blocked",
          reason: error.message,
        });
      }
    }

    console.log(JSON.stringify({
      mode: options.apply ? "apply" : "dry-run",
      sourceSuites: suites.length,
      alreadyMigrated: report.filter((item) => item.result === "already_migrated").length,
      ready: candidates.length,
      blocked: report.filter((item) => item.result === "blocked").length,
      records: report,
    }, null, 2));

    if (report.some((item) => item.result === "blocked")) {
      throw new Error("Migration preflight found blocked suites; no listings were written.");
    }
    if (!options.apply || candidates.length === 0) return;

    await StayListing.collection.createIndex({ sourceSuite: 1 }, { unique: true, sparse: true });
    for (const candidate of candidates) {
      await candidate.save();
    }
    console.log(`Created ${candidates.length} draft StayListing records. Source suites were not modified.`);
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error("Suite-to-StayListing migration failed:", error.message);
  process.exitCode = 1;
});
