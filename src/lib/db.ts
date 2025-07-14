import { Pool, type PoolClient } from 'pg';
import { parse } from 'pg-connection-string';

const hasDbCredentials = !!process.env.POSTGRES_URL;

if (!hasDbCredentials) {
    console.warn("WARN: PostgreSQL connection details not found in the .env file (POSTGRES_URL). The application will run in an 'offline' mode where database operations will fail.");
}

let pool: Pool | null = null;
let isInitializing = false;
const isVercel = process.env.VERCEL === '1';

async function initializeDatabase(client: Pool) {
    isInitializing = true;
    try {
        console.log("Checking database schema...");
        const tableCheck = await client.query("SELECT to_regclass('public.\"Users\"') as table_exists;");

        if (tableCheck.rows[0].table_exists) {
            console.log("Database schema already exists.");
            return;
        }

        console.log("Database schema not found. Initializing new schema...");

        const schema = `
            CREATE TABLE "Users" (
                "UserID" SERIAL PRIMARY KEY,
                "FullName" VARCHAR(100) NOT NULL,
                "Email" VARCHAR(100) UNIQUE,
                "PhoneNumber" VARCHAR(20) NOT NULL UNIQUE,
                "PasswordHash" VARCHAR(255) NOT NULL,
                "Role" VARCHAR(50) NOT NULL DEFAULT 'مستخدم',
                "Address" VARCHAR(255),
                "Landmark" VARCHAR(255),
                "Latitude" DECIMAL(9, 6),
                "Longitude" DECIMAL(9, 6),
                "PointsBalance" INT NOT NULL DEFAULT 0,
                "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "PhotoURL" TEXT
            );
            CREATE TABLE "Vehicles" (
                "VehicleID" SERIAL PRIMARY KEY,
                "Type" VARCHAR(100) NOT NULL,
                "PlateNumber" VARCHAR(50) NOT NULL UNIQUE,
                "CapacityKG" INT NOT NULL,
                "Status" VARCHAR(50) NOT NULL DEFAULT 'نشطة'
            );
            CREATE TABLE "Drivers" (
                "DriverID" SERIAL PRIMARY KEY,
                "FullName" VARCHAR(100) NOT NULL,
                "Phone" VARCHAR(20) NOT NULL UNIQUE,
                "VehicleID" INT,
                "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "FK_Drivers_Vehicles" FOREIGN KEY ("VehicleID") REFERENCES "Vehicles"("VehicleID") ON DELETE SET NULL
            );
            CREATE TABLE "Pickups" (
                "PickupID" SERIAL PRIMARY KEY,
                "UserID" INT NOT NULL,
                "DriverID" INT,
                "RequestDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "PickupDate" DATE NOT NULL,
                "Status" VARCHAR(50) NOT NULL DEFAULT 'مجدول',
                "Notes" TEXT,
                CONSTRAINT "FK_Pickups_Users" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE,
                CONSTRAINT "FK_Pickups_Drivers" FOREIGN KEY ("DriverID") REFERENCES "Drivers"("DriverID") ON DELETE SET NULL
            );
            CREATE TABLE "PickupItems" (
                "PickupItemID" SERIAL PRIMARY KEY,
                "PickupID" INT NOT NULL,
                "ItemName" VARCHAR(100) NOT NULL,
                "Quantity" INT NOT NULL,
                CONSTRAINT "FK_PickupItems_Pickups" FOREIGN KEY ("PickupID") REFERENCES "Pickups"("PickupID") ON DELETE CASCADE
            );
            CREATE TABLE "Badges" (
                "BadgeID" SERIAL PRIMARY KEY,
                "BadgeName" VARCHAR(100) NOT NULL UNIQUE,
                "Description" VARCHAR(255) NOT NULL,
                "IconName" VARCHAR(50)
            );
            CREATE TABLE "UserBadges" (
                "UserBadgeID" SERIAL PRIMARY KEY,
                "UserID" INT NOT NULL,
                "BadgeID" INT NOT NULL,
                "EarnedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "FK_UserBadges_Users" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE,
                CONSTRAINT "FK_UserBadges_Badges" FOREIGN KEY ("BadgeID") REFERENCES "Badges"("BadgeID") ON DELETE CASCADE,
                UNIQUE ("UserID", "BadgeID")
            );
            CREATE TABLE "Vouchers" (
                "VoucherID" SERIAL PRIMARY KEY,
                "PartnerName" VARCHAR(100) NOT NULL,
                "PartnerLogoURL" TEXT,
                "Title" VARCHAR(255) NOT NULL,
                "Description" TEXT NOT NULL,
                "PointsRequired" INT NOT NULL,
                "Quantity" INT NOT NULL,
                "Status" VARCHAR(50) NOT NULL DEFAULT 'نشط'
            );
            CREATE TABLE "VoucherRedemptions" (
                "RedemptionID" SERIAL PRIMARY KEY,
                "UserID" INT NOT NULL,
                "VoucherID" INT NOT NULL,
                "RequestDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "Status" VARCHAR(50) DEFAULT 'قيد المراجعة',
                "CouponCode" VARCHAR(255),
                CONSTRAINT "FK_VoucherRedemptions_Users" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE,
                CONSTRAINT "FK_VoucherRedemptions_Vouchers" FOREIGN KEY ("VoucherID") REFERENCES "Vouchers"("VoucherID") ON DELETE CASCADE
            );
            CREATE TABLE "Redemptions" (
                "RedemptionID" SERIAL PRIMARY KEY,
                "UserID" INT NOT NULL,
                "PointsRedeemed" INT NOT NULL,
                "Amount" DECIMAL(18, 2) NOT NULL,
                "BankName" VARCHAR(100) NOT NULL,
                "AccountHolder" VARCHAR(100) NOT NULL,
                "AccountNumber" VARCHAR(50) NOT NULL,
                "Status" VARCHAR(50) NOT NULL DEFAULT 'قيد التنفيذ',
                "RequestDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "FK_Redemptions_Users" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE
            );
            CREATE TABLE "PointsLog" (
                "LogID" SERIAL PRIMARY KEY,
                "UserID" INT NOT NULL,
                "Points" INT NOT NULL,
                "LogType" VARCHAR(50) NOT NULL,
                "Reason" VARCHAR(255),
                "SourceID" INT,
                "LogDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "FK_PointsLog_Users" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE
            );
            CREATE TABLE "PointSettings" (
                "SettingsID" INT PRIMARY KEY,
                "AutoGrantEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
                "RecyclingPerKg" INT NOT NULL DEFAULT 10,
                "OrganicPerKg" INT NOT NULL DEFAULT 5,
                "DonationPerPiece" INT NOT NULL DEFAULT 2
            );
            CREATE TABLE "Feedback" (
                "FeedbackID" SERIAL PRIMARY KEY,
                "UserID" INT NOT NULL,
                "FeedbackType" VARCHAR(50) NOT NULL,
                "Subject" VARCHAR(255) NOT NULL,
                "Details" TEXT NOT NULL,
                "PhotoURL" TEXT,
                "Status" VARCHAR(50) NOT NULL DEFAULT 'جديد',
                "SubmittedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "FK_Feedback_Users" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE
            );
            CREATE TABLE "Donations" (
                "DonationID" SERIAL PRIMARY KEY,
                "UserID" INT NOT NULL,
                "ClothingType" VARCHAR(50) NOT NULL,
                "Condition" VARCHAR(50) NOT NULL,
                "Quantity" INT NOT NULL,
                "PickupAddress" VARCHAR(255) NOT NULL,
                "Notes" TEXT,
                "Status" VARCHAR(50) NOT NULL DEFAULT 'معلق',
                "RequestDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "FK_Donations_Users" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE
            );
            CREATE TABLE "FinancialSupport" (
                "SupportID" SERIAL PRIMARY KEY,
                "UserID" INT NOT NULL,
                "Amount" DECIMAL(18, 2) NOT NULL,
                "BankName" VARCHAR(100) NOT NULL,
                "ReceiptURL" TEXT NOT NULL,
                "Status" VARCHAR(50) NOT NULL DEFAULT 'قيد المراجعة',
                "SubmittedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "FK_FinancialSupport_Users" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE
            );
            CREATE TABLE "News" (
                "NewsID" SERIAL PRIMARY KEY,
                "Title" VARCHAR(255) NOT NULL,
                "Content" TEXT NOT NULL,
                "Author" VARCHAR(100) NOT NULL,
                "ImageURL" TEXT,
                "PublishDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE "Notifications" (
                "NotificationID" SERIAL PRIMARY KEY,
                "Title" VARCHAR(255) NOT NULL,
                "Content" TEXT NOT NULL,
                "TargetAudience" VARCHAR(50) NOT NULL,
                "SentAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "TargetUserID" INT
            );
            CREATE TABLE "BankAccounts" (
                "BankAccountID" SERIAL PRIMARY KEY,
                "BankName" VARCHAR(100) NOT NULL,
                "AccountNumber" VARCHAR(50) NOT NULL,
                "AccountHolderName" VARCHAR(100) NOT NULL
            );
            CREATE TABLE "BinLocations" (
                "LocationID" SERIAL PRIMARY KEY,
                "Name" VARCHAR(100) NOT NULL,
                "Latitude" DECIMAL(9, 6) NOT NULL,
                "Longitude" DECIMAL(9, 6) NOT NULL,
                "GoogleMapsURL" TEXT
            );
            CREATE TABLE "Landmarks" (
                "LandmarkID" SERIAL PRIMARY KEY,
                "Name" VARCHAR(255) NOT NULL,
                "Type" VARCHAR(50) NOT NULL,
                "Latitude" DECIMAL(9, 6) NOT NULL,
                "Longitude" DECIMAL(9, 6) NOT NULL
            );
            CREATE TABLE "GeneralSchedules" (
                "GeneralScheduleID" SERIAL PRIMARY KEY,
                "DayOfWeek" VARCHAR(50) NOT NULL,
                "PickupTime" VARCHAR(100) NOT NULL,
                "IsEnabled" BOOLEAN NOT NULL DEFAULT TRUE
            );
             CREATE TABLE "RecyclingSales" (
                "SaleID" SERIAL PRIMARY KEY,
                "SaleDate" DATE NOT NULL DEFAULT CURRENT_DATE,
                "Buyer" VARCHAR(255) NOT NULL,
                "MaterialType" VARCHAR(100) NOT NULL,
                "QuantityKG" DECIMAL(10, 2) NOT NULL,
                "PricePerKG" DECIMAL(10, 2) NOT NULL,
                "TotalAmount" DECIMAL(18, 2) GENERATED ALWAYS AS ("QuantityKG" * "PricePerKG") STORED,
                "Notes" TEXT
            );
        `;

        await client.query(schema);

        // Insert default data after schema creation
        const defaultData = `
            INSERT INTO "PointSettings" ("SettingsID") VALUES (1);
            INSERT INTO "Badges" ("BadgeName", "Description", "IconName") VALUES
            ('beginner_recycler', 'أول خطوة في عالم التدوير!', 'Star'),
            ('plastic_free_pioneer', 'رائد في تقليل استخدام البلاستيك', 'Award'),
            ('compost_champion', 'بطل تحويل المخلفات العضوية إلى سماد', 'Star'),
            ('waste_warrior', 'محارب النفايات الأول في الحي', 'Shield');
        `;
        await client.query(defaultData);

        console.log("Database schema and default data initialized successfully.");

    } catch (err) {
        console.error("Database initialization failed:", err);
    } finally {
        isInitializing = false;
    }
}

export function getDbPool(): Pool {
    if (!hasDbCredentials) {
        throw new Error("Database not configured. Check your .env file for POSTGRES_URL.");
    }

    if (isVercel) {
        const parsedConfig = parse(process.env.POSTGRES_URL || '');
        const config = {
            ...parsedConfig,
            port: parsedConfig.port ? parseInt(parsedConfig.port, 10) : undefined,
            database: parsedConfig.database ?? undefined,
            ssl: { rejectUnauthorized: false },
            host: parsedConfig.host ?? undefined,
        };

        return new Pool(config);
    }


    if (!pool) {
        console.log("Creating new PostgreSQL connection pool.");
        pool = new Pool({
            connectionString: process.env.POSTGRES_URL,
        });

        pool.on('error', (err: Error, client: PoolClient) => {
            console.error('Unexpected error on idle PostgreSQL client', err);
            process.exit(-1);
        });

        initializeDatabase(pool);
    }
    return pool;
}

export async function query(text: string, params: any[]) {
    if (isInitializing && !isVercel) {
        await new Promise(resolve => {
            const interval = setInterval(() => {
                if (!isInitializing) {
                    clearInterval(interval);
                    resolve(true);
                }
            }, 100);
        });
    }

    const poolInstance = getDbPool();
    const start = Date.now();
    try {
        const res = await poolInstance.query(text, params);
        const duration = Date.now() - start;
        console.log('executed query', { text, duration, rows: res.rowCount });
        return res;
    } finally {
        if (isVercel) {
            await poolInstance.end();
        }
    }
}
