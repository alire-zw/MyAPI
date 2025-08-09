# Alireza API - سرویس وب دیتابیس

یک سرویس وب کامل با Node.js و MySQL برای مدیریت کاربران

## ویژگی‌ها

- ✅ MySQL با Connection Pool
- ✅ API کامل برای مدیریت کاربران
- ✅ احراز هویت با JWT
- ✅ رمزگذاری رمز عبور با bcrypt
- ✅ پیام‌های خطا به فارسی
- ✅ CORS فعال
- ✅ Validation کامل

## نصب و راه‌اندازی

### پیش‌نیازها

- Node.js (نسخه ۱۴ یا بالاتر)
- MySQL Server
- npm یا yarn

### مراحل نصب

۱. نصب وابستگی‌ها:
```bash
npm install
```

۲. تنظیم فایل `config.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=alireza_db
DB_PORT=3306
JWT_SECRET=your-secret-key-here
PORT=3000
```

۳. راه‌اندازی دیتابیس:
```bash
npm run init-db
```

۴. اجرای سرور:
```bash
npm start
```

یا برای توسعه:
```bash
npm run dev
```

## API Endpoints

### احراز هویت

#### ثبت نام کاربر جدید
```
POST /api/users/register
```

**Body:**
```json
{
  "userName": "testuser",
  "userPassword": "123456"
}
```

#### ورود کاربر
```
POST /api/users/login
```

**Body:**
```json
{
  "userName": "testuser",
  "userPassword": "123456"
}
```

### مدیریت کاربران

#### دریافت همه کاربران
```
GET /api/users
```

#### دریافت کاربر با ID
```
GET /api/users/:id
```

#### بروزرسانی کاربر
```
PUT /api/users/:id
```

**Body:**
```json
{
  "userName": "newusername",
  "userPassword": "newpassword",
  "isBanned": false
}
```

#### حذف کاربر
```
DELETE /api/users/:id
```

#### تغییر وضعیت مسدودیت
```
PATCH /api/users/:id/ban
```

### مدیریت اشتراک‌ها

#### دریافت همه اشتراک‌ها
```
GET /api/subscriptions
```

#### دریافت اشتراک با ID
```
GET /api/subscriptions/:id
```

#### دریافت اشتراک‌های کاربر
```
GET /api/subscriptions/user/:userId
```

#### ایجاد اشتراک جدید
```
POST /api/subscriptions
```

**Body:**
```json
{
  "selectedUser": 1,
  "selectedAPI": "Fragment",
  "selectedSubscribe": "Trial"
}
```

#### بروزرسانی اشتراک
```
PUT /api/subscriptions/:id
```

**Body:**
```json
{
  "selectedAPI": "Item2",
  "selectedSubscribe": "1 Month"
}
```

#### حذف اشتراک
```
DELETE /api/subscriptions/:id
```

#### لغو کلید API
```
PATCH /api/subscriptions/:id/revoke
```

#### بازسازی کلید API
```
PATCH /api/subscriptions/:id/regenerate
```

#### اعتبارسنجی کلید API
```
POST /api/subscriptions/validate
```

**Body:**
```json
{
  "apiKey": "miral:1234567890:abcdef123456"
}
```

#### دریافت آمار اشتراک‌ها
```
GET /api/subscriptions/stats/overview
```

### سایر Endpoints

#### بررسی وضعیت سرویس
```
GET /health
```

#### صفحه اصلی
```
GET /
```

## ساختار دیتابیس

### جدول users

| فیلد | نوع | توضیحات |
|------|-----|---------|
| id | INT | شناسه یکتا (Auto Increment) |
| userName | VARCHAR(255) | نام کاربری (یکتا) |
| userPassword | VARCHAR(255) | رمز عبور (رمزگذاری شده) |
| isBanned | BOOLEAN | وضعیت مسدودیت |
| dateJoined | TIMESTAMP | تاریخ عضویت |

### جدول subscriptions

| فیلد | نوع | توضیحات |
|------|-----|---------|
| id | INT | شناسه یکتا (Auto Increment) |
| selectedUser | INT | شناسه کاربر (Foreign Key) |
| selectedAPI | ENUM | نوع API (Fragment, Item2, Item3) |
| selectedSubscribe | ENUM | نوع اشتراک (Trial, 1 Month, 3 Month, 1 Year) |
| apiKey | VARCHAR(255) | کلید API (یکتا) |
| dateCreated | TIMESTAMP | تاریخ ایجاد |
| dateRevoked | TIMESTAMP | تاریخ لغو (NULL = فعال) |

## نمونه پاسخ‌ها

### موفقیت‌آمیز
```json
{
  "success": true,
  "message": "کاربر با موفقیت ثبت شد",
  "data": {
    "id": 1,
    "userName": "testuser",
    "isBanned": false
  }
}
```

### خطا
```json
{
  "success": false,
  "message": "نام کاربری قبلاً وجود دارد"
}
```

## تست API

### با curl

#### ثبت نام:
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"userName": "testuser", "userPassword": "123456"}'
```

#### ورود:
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"userName": "testuser", "userPassword": "123456"}'
```

#### دریافت همه کاربران:
```bash
curl http://localhost:3000/api/users
```

#### ایجاد اشتراک:
```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"selectedUser": 1, "selectedAPI": "Fragment", "selectedSubscribe": "Trial"}'
```

#### اعتبارسنجی کلید API:
```bash
curl -X POST http://localhost:3000/api/subscriptions/validate \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "miral:1234567890:abcdef123456"}'
```

#### دریافت آمار اشتراک‌ها:
```bash
curl http://localhost:3000/api/subscriptions/stats/overview
```

## نکات مهم

- رمز عبور به صورت خودکار رمزگذاری می‌شود
- نام کاربری باید یکتا باشد
- حداقل طول نام کاربری: ۳ کاراکتر
- حداقل طول رمز عبور: ۶ کاراکتر
- توکن JWT برای ۲۴ ساعت معتبر است

## کاربر پیش‌فرض

پس از راه‌اندازی دیتابیس، یک کاربر پیش‌فرض ایجاد می‌شود:
- نام کاربری: `admin`
- رمز عبور: `password`

## پورت پیش‌فرض

سرور روی پورت ۳۰۰۰ اجرا می‌شود. برای تغییر، فایل `config.env` را ویرایش کنید. 