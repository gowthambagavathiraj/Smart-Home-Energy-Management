# 🏠 Smart Home Energy Management System

A full-stack web application for managing home energy devices with real-time monitoring, JWT authentication, Google OAuth2, and secure password management with OTP email verification.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18, React Router v6 |
| Backend | Java 17, Spring Boot 3.2 |
| Database | MySQL 8.x |
| Auth | JWT (JJWT 0.11.5), Google OAuth2, BCrypt |
| Email | Spring Mail + Gmail SMTP |
| Security | Spring Security 6 |

---

## ✅ Features Implemented

- **Registration**: First name, last name, email, password (letters+numbers only)
- **Login**: Email/password with JWT token response
- **Sign in with Google**: OAuth2 via Google Cloud
- **Forgot Password**: Sends 6-digit OTP to real email
- **Reset Password**: Verify OTP → enter new password
- **JWT Protection**: All dashboard routes protected
- **Password validation**: Letters and numbers only enforced on both frontend and backend
- **Dashboard**: Smart home device controls, energy usage chart, real-time stats

---

## ⚙️ Setup Instructions

### Step 1: MySQL Database

```bash
mysql -u root -p
```
```sql
CREATE DATABASE smarthome_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Spring Boot will auto-create tables via `spring.jpa.hibernate.ddl-auto=update`.

### Step 2: Configure Backend

Edit `backend/src/main/resources/application.properties`:

```properties
# Change these values:
spring.datasource.password=YOUR_MYSQL_ROOT_PASSWORD

spring.mail.username=your_gmail@gmail.com
spring.mail.password=your_16char_app_password   # From Google App Passwords

app.jwt.secret=YourLongRandomSecretKeyMinimum32Characters

spring.security.oauth2.client.registration.google.client-id=YOUR_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_SECRET
```

### Step 3: Gmail App Password

1. Enable 2FA on your Google Account
2. Visit: https://myaccount.google.com/apppasswords
3. Generate password for "Mail"
4. Use the 16-character code in `spring.mail.password`

### Step 4: Google OAuth2

1. Go to https://console.cloud.google.com/
2. Create Project → APIs & Services → Credentials → Create OAuth 2.0 Client ID
3. Application type: **Web application**
4. Authorized redirect URIs: `http://localhost:8080/login/oauth2/code/google`
5. Copy Client ID and Secret to `application.properties`

### Step 5: Run Backend

```bash
cd backend
mvn clean install -DskipTests
mvn spring-boot:run
# Starts on http://localhost:8080
```

### Step 6: Run Frontend

```bash
cd frontend
npm install
npm start
# Starts on http://localhost:3000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Sign in, get JWT | No |
| POST | `/api/auth/forgot-password` | Send OTP to email | No |
| POST | `/api/auth/verify-reset-code` | Verify 6-digit code | No |
| POST | `/api/auth/reset-password` | Set new password | No |
| GET | `/api/user/profile` | Current user profile | Yes (Bearer JWT) |

---

## 🔐 Password Reset Flow

```
[User clicks Forgot Password]
  → Enter email
  → Backend checks email exists in DB
  → Generates 6-digit SecureRandom code
  → Saves code with 10-minute expiry to DB
  → Sends HTML email via Gmail SMTP
  → User enters 6-digit code
  → Backend verifies (valid, not expired, not used)
  → Marks code as "verified"
  → User enters new password
  → Backend sets new BCrypt hash
  → Marks token as "used"
  → Redirect to login
```

---

## 🔒 Security Details

- JWT tokens expire in 24 hours
- Passwords hashed with BCrypt (strength 10)
- OTP codes are 6-digit, expire in 10 minutes, single-use
- Passwords must match `^[a-zA-Z0-9]+$` (validated on both frontend and backend)
- Google OAuth users cannot use password login
- Expired tokens cleaned up hourly via @Scheduled

---

## 🎨 UI Design

The authentication pages feature:
- **Dark futuristic theme** (deep navy/black + cyan accents)
- **Animated particle field** floating in background
- **Moving circuit grid** overlay
- **Glowing orbs** for atmospheric depth
- **Split-panel layout**: branding left, form right
- **Password strength indicator** on registration
- **OTP grid input** (6 boxes, auto-focus, paste support)
- **Smooth animations** on page load
- Google Sign-In on both Login and Register pages
