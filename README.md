# 💼 Airtel Expense Management System

### AI-Powered Enterprise Expense Management Platform

Enterprise expense reimbursement workflow with **AI-powered OCR, employee confirmation, manager approvals, finance verification, and reimbursement tracking**.

---

## ✨ Features

| Module | Description |
|---|---|
| 🤖 **AI OCR** | Extracts receipt details using Tesseract OCR |
| 🧠 **Gemini AI** | AI-powered expense processing |
| 👤 **Employee Portal** | Submit and track expense claims |
| 👨‍💼 **Manager Dashboard** | Approve or reject submitted claims |
| 💰 **Finance Dashboard** | Final verification and reimbursement |
| 🔔 **Notifications** | Approval, rejection and workflow alerts |
| 📊 **Analytics** | Expense statistics and reports |
| 📄 **Receipt Upload** | Upload bills and receipts |
| 📷 **Camera Capture** | Capture bills directly from mobile devices |
| 🔐 **JWT Authentication** | Secure role-based access |
| 🐳 **Docker Support** | Fully containerized application |
| ☁️ **AWS EC2** | Linux-based cloud deployment |

---

## 🏗️ Tech Stack

| Frontend | Backend | AI / OCR | Database | DevOps |
|---|---|---|---|---|
| React + Vite | Node.js | Gemini API | MongoDB Atlas | Docker |
| Axios | Express.js | Tesseract OCR | Mongoose | Docker Compose |
| React Router | JWT | Regex Parsing | | AWS EC2 |

---

## 📂 Project Structure

```text
airtel_expense_manager/
│
├── client/
│   ├── src/
│   ├── Dockerfile
│   └── .env
│
├── server/
│   ├── src/
│   ├── uploads/
│   ├── Dockerfile
│   └── .env
│
├── docker-compose.yml
├── .dockerignore
└── .gitignore
```

> `.env` files contain sensitive credentials and are **not committed to GitHub**.  
> Use `.env.example` files for configuration templates.

---

## 🔄 Expense Workflow

```text
Employee
   │
   ▼
Upload / Camera Capture
   │
   ▼
Tesseract OCR
   │
   ▼
AI Processing
   │
   ▼
Employee Verification
   │
   ▼
Manager Review
   │
   ├── Reject → Employee Review & Resubmit
   │
   ▼
Finance Review
   │
   ├── Reject → Manager Review
   │
   ▼
Oracle / ERP Sync
   │
   ▼
Completed
```

---

## 🔔 Notification Workflow

| Role | Notifications |
|---|---|
| 👤 **Employee** | Claim submitted, manager approved/rejected, review & resubmit, synced to Oracle |
| 👨‍💼 **Manager** | Employee submitted claim, sent to finance, pending approval reminder, finance returned claim |
| 💰 **Finance** | Claim received, sent to manager, claim synced to Oracle |

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/<your-username>/airtel-expense-manager.git
cd airtel-expense-manager
```

### Install Dependencies

```bash
cd server
npm install

cd ../client
npm install
```

---

## 🔐 Environment Variables

### Server `.env`

```env
PORT=8000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
GEMINI_API_KEY=your_api_key
OCR_LANG=eng+hin
```

### Client `.env`

For local development:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

For AWS EC2:

```env
VITE_API_URL=http://<EC2_PUBLIC_IP>:8000/api/v1
```

> Never commit actual API keys, database credentials, JWT secrets, or other sensitive values to GitHub.

---

## 🐳 Docker

### Build & Start

```bash
docker compose up -d --build
```

### Check Containers

```bash
docker compose ps
```

### View Logs

```bash
docker compose logs server --tail=50
docker compose logs client --tail=50
```

### Stop

```bash
docker compose down
```

---

## ☁️ AWS Deployment

The application is currently deployed on **AWS EC2** using Docker Compose.

| Service | Port |
|---|---:|
| Frontend | `5174` |
| Backend | `8000` |
| Database | MongoDB Atlas |

### Deployment Architecture

```text
AWS EC2
│
├── Docker
│   ├── React + Vite Client
│   └── Node.js + Express Server
│
└── MongoDB Atlas
```

The application is designed to run on **Linux servers using Docker**, making it suitable for enterprise server environments.

---

## 🌐 API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | User Login |
| POST | `/auth/register` | User Registration |
| POST | `/expense` | Submit Expense |
| GET | `/expense` | View Expenses |
| PUT | `/manager` | Manager Approval |
| PUT | `/finance` | Finance Approval |

---

## 🔒 Security

- JWT Authentication
- Role-Based Authorization
- Environment Variable Protection
- Sensitive credentials excluded from Git
- Local OCR processing
- Data masking before AI processing
- Token-efficient AI requests
- MongoDB Atlas network access controls
- Dockerized Linux deployment

---

## 🚀 Future Improvements

- [ ] 🛡️ AI-based Fraud Detection
- [ ] 🧾 Bulk Receipt Upload & Processing
- [ ] 🔄 ERP Integration (SAP / Oracle)
- [ ] ☸️ Kubernetes Deployment
- [ ] ⚙️ CI/CD Pipeline
- [ ] 🌐 Domain + HTTPS

---

## 👩‍💻 Author

**Shrishti Gaur**

B.Tech CSE • DevOps & Full Stack Developer

[GitHub](https://github.com/shrishti-gaur)

---

<div align="center">

⭐ **If you found this project useful, consider giving it a star!**

</div>
