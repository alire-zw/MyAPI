# Fragment Stars Buy API

این سرویس امکان خرید Telegram Stars از طریق Fragment را ارائه می‌دهد.

## ویژگی‌ها

- جستجوی کاربر تلگرام با username
- خرید ستاره برای کاربران
- بررسی موجودی کیف پول
- احراز هویت با API Key
- استفاده از داده‌های کیف پول و Fragment از دیتابیس

## استفاده

### 1. جستجوی کاربر

```bash
POST /search-user
```

Body:
```json
{
    "username": "example_user",
    "quantity": 50
}
```

### 2. خرید ستاره

```bash
POST /buy-stars
```

Body:
```json
{
    "username": "example_user",
    "quantity": 100
}
```

### 3. بررسی موجودی

```bash
GET /wallet-balance
```

## پیش‌نیازها

1. کاربر باید در دیتابیس ثبت شده باشد
2. کاربر باید یک wallet داشته باشد با tonApiKey
3. کاربر باید Fragment data فعال داشته باشد
4. API Key باید معتبر باشد و برای Fragment API باشد

## نصب و راه‌اندازی

```bash
pip install -r requirements.txt
```

سپس main.py را در فولدر اصلی اجرا کنید که endpoint های جدید فعال شوند.
