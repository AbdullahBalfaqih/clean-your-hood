-- Create Users Table
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    FullName NVARCHAR(100) NOT NULL,
    PhoneNumber NVARCHAR(20) NOT NULL UNIQUE,
    Email NVARCHAR(100) UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Address NVARCHAR(255),
    Latitude DECIMAL(9, 6),
    Longitude DECIMAL(9, 6),
    GoogleMapsURL NVARCHAR(500),
    Role NVARCHAR(50) NOT NULL DEFAULT 'مستخدم', -- 'مستخدم' or 'مدير'
    PointsBalance INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Create Drivers Table
CREATE TABLE Drivers (
    DriverID INT PRIMARY KEY IDENTITY(1,1),
    FullName NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(20) NOT NULL UNIQUE,
    VehicleDetails NVARCHAR(255),
    IsActive BIT NOT NULL DEFAULT 1
);

-- Create Pickups Table
CREATE TABLE Pickups (
    PickupID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID) ON DELETE CASCADE,
    DriverID INT FOREIGN KEY REFERENCES Drivers(DriverID),
    RequestDate DATETIME NOT NULL DEFAULT GETDATE(),
    PickupDate DATE NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'مجدول', -- 'مجدول', 'مكتمل', 'ملغي'
    Notes NVARCHAR(MAX)
);

-- Create PickupItems Table (to log what was in each pickup)
CREATE TABLE PickupItems (
    PickupItemID INT PRIMARY KEY IDENTITY(1,1),
    PickupID INT NOT NULL FOREIGN KEY REFERENCES Pickups(PickupID) ON DELETE CASCADE,
    ItemName NVARCHAR(100) NOT NULL,
    Quantity DECIMAL(10, 2), -- Can be kg or pieces
    Unit NVARCHAR(20) -- 'kg', 'piece'
);

-- Create Donations Table
CREATE TABLE Donations (
    DonationID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID) ON DELETE CASCADE,
    ClothingType NVARCHAR(50) NOT NULL,
    Condition NVARCHAR(50) NOT NULL,
    Quantity INT NOT NULL,
    PickupAddress NVARCHAR(255) NOT NULL,
    Notes NVARCHAR(MAX),
    Status NVARCHAR(50) NOT NULL DEFAULT 'معلق', -- 'معلق', 'مقبول', 'تم الاستلام', 'مرفوض'
    RequestDate DATETIME NOT NULL DEFAULT GETDATE()
);

-- Create FinancialSupport Table
CREATE TABLE FinancialSupport (
    SupportID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID) ON DELETE CASCADE, -- User who confirmed the donation
    DonorName NVARCHAR(100) NOT NULL,
    Amount DECIMAL(18, 2) NOT NULL,
    BankName NVARCHAR(100) NOT NULL,
    ReceiptURL NVARCHAR(500) NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'قيد المراجعة', -- 'قيد المراجعة', 'مقبول', 'مرفوض'
    SubmittedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- Create Feedback Table
CREATE TABLE Feedback (
    FeedbackID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID) ON DELETE CASCADE,
    FeedbackType NVARCHAR(50) NOT NULL, -- 'بلاغ', 'شكوى', 'اقتراح'
    Subject NVARCHAR(255) NOT NULL,
    Details NVARCHAR(MAX) NOT NULL,
    PhotoURL NVARCHAR(500),
    Status NVARCHAR(50) NOT NULL DEFAULT 'جديد', -- 'جديد', 'قيد المراجعة', 'تم الحل'
    SubmittedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- Create News Table
CREATE TABLE News (
    NewsID INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(255) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    Author NVARCHAR(100) NOT NULL,
    ImageURL NVARCHAR(500),
    PublishDate DATETIME NOT NULL DEFAULT GETDATE()
);

-- Create Notifications Table
CREATE TABLE Notifications (
    NotificationID INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(255) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    TargetAudience NVARCHAR(50) NOT NULL DEFAULT 'الكل', -- 'الكل', 'المستخدمون'
    SentAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- Create BinLocations Table
CREATE TABLE BinLocations (
    LocationID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Latitude DECIMAL(9, 6) NOT NULL,
    Longitude DECIMAL(9, 6) NOT NULL,
    GoogleMapsURL NVARCHAR(500)
);

-- Create PointsLog Table (for tracking points history)
CREATE TABLE PointsLog (
    LogID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID) ON DELETE CASCADE,
    Points INT NOT NULL,
    LogType NVARCHAR(50) NOT NULL, -- 'grant', 'redeem', 'deduct'
    Reason NVARCHAR(255),
    SourceID INT, -- Can link to PickupID, DonationID, etc.
    LogDate DATETIME NOT NULL DEFAULT GETDATE()
);

-- Create Badges Table
CREATE TABLE Badges (
    BadgeID INT PRIMARY KEY IDENTITY(1,1),
    BadgeName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    IconKey NVARCHAR(50) -- e.g., 'beginner_recycler'
);

-- Create UserBadges Table (many-to-many relationship)
CREATE TABLE UserBadges (
    UserBadgeID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID) ON DELETE CASCADE,
    BadgeID INT NOT NULL FOREIGN KEY REFERENCES Badges(BadgeID) ON DELETE CASCADE,
    AwardedDate DATETIME NOT NULL DEFAULT GETDATE(),
    UNIQUE (UserID, BadgeID)
);

-- Create Vouchers Table
CREATE TABLE Vouchers (
    VoucherID INT PRIMARY KEY IDENTITY(1,1),
    PartnerName NVARCHAR(100) NOT NULL,
    PartnerLogoURL NVARCHAR(500),
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    PointsRequired INT NOT NULL,
    Quantity INT NOT NULL, -- How many are available
    Status NVARCHAR(50) NOT NULL DEFAULT 'نشط' -- 'نشط', 'غير نشط'
);

-- Create Redemptions Table (for points-to-cash)
CREATE TABLE Redemptions (
    RedemptionID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID) ON DELETE CASCADE,
    PointsRedeemed INT NOT NULL,
    Amount DECIMAL(18, 2) NOT NULL,
    BankName NVARCHAR(100) NOT NULL,
    AccountHolder NVARCHAR(100) NOT NULL,
    AccountNumber NVARCHAR(50) NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'قيد التنفيذ', -- 'قيد التنفيذ', 'مكتمل', 'ملغي'
    RequestDate DATETIME NOT NULL DEFAULT GETDATE(),
    CompletionDate DATETIME
);
