import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/database";
import Category from "../models/Category";
import Tenant from "../models/Tenant";
import User from "../models/User";
import { UserRole } from "../types";
import { logger } from "../utils/logger";

dotenv.config();

const DEFAULT_DEPARTMENTS = [
  { name: "Alumni Department", order: 1 },
  { name: "HOD Department", order: 2 },
  { name: "Staffs Department", order: 3 },
];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureDepartmentsForTenant(
  tenantId: mongoose.Types.ObjectId,
  createdBy: mongoose.Types.ObjectId
) {
  for (const dept of DEFAULT_DEPARTMENTS) {
    const slug = toSlug(dept.name);
    const existing = await Category.findOne({
      tenantId,
      entityType: "department",
      slug,
    });
    if (existing) continue;

    await Category.create({
      name: dept.name,
      slug,
      description: `${dept.name} category`,
      entityType: "department",
      tenantId,
      createdBy,
      isActive: true,
      order: dept.order,
    });
    logger.info(
      `Created department '${dept.name}' for tenant ${tenantId.toString()}`
    );
  }
}

async function seedDepartments() {
  await connectDB();
  logger.info("Seeding default department categories (Alumni, HOD, Staffs)...");

  const tenants = await Tenant.find({});
  if (tenants.length === 0) {
    logger.warn("No tenants found. Nothing to seed.");
    process.exit(0);
  }

  for (const tenant of tenants) {
    // Find a creator user from admin roles within the tenant
    const creator = await User.findOne({
      tenantId: tenant._id,
      role: { $in: [UserRole.COLLEGE_ADMIN, UserRole.HOD, UserRole.STAFF] },
    });

    if (!creator) {
      logger.warn(
        `No admin/hod/staff user found for tenant ${tenant.name}. Skipping...`
      );
      continue;
    }

    await ensureDepartmentsForTenant(
      tenant._id as mongoose.Types.ObjectId,
      creator._id as mongoose.Types.ObjectId
    );
  }

  logger.info("Department seeding completed.");
  process.exit(0);
}

if (require.main === module) {
  seedDepartments().catch((err) => {
    logger.error("Department seeding failed:", err);
    process.exit(1);
  });
}


