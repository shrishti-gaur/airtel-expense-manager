<div align="center">

# 💼 Airtel Expense Management System

### AI-Powered Enterprise Expense Management Platform

![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express)

Enterprise expense reimbursement workflow with **AI-powered OCR**, **manager approvals**, **finance verification**, and **real-time notifications**.

</div>

---

# ✨ Features

| Module | Description |
|---------|-------------|
| 🤖 AI OCR | Extracts receipt details automatically using Tesseract OCR |
| 👤 Employee Portal | Submit and track expense claims |
| 👨‍💼 Manager Dashboard | Approve or reject submitted claims |
| 💰 Finance Dashboard | Final verification & reimbursement |
| 🔔 Notifications | Approval/rejection alerts |
| 📊 Analytics | Expense statistics and reports |
| 📄 PDF Upload | Upload bills and receipts |
| 🔐 JWT Authentication | Secure role-based access |
| 🐳 Docker Support | Fully containerized application |

---

# 🏗️ Tech Stack

| Frontend | Backend | Database | DevOps |
|----------|----------|----------|---------|
| React + Vite | Node.js | MongoDB Atlas | Docker |
| Axios | Express.js | Mongoose | Docker Compose |
| React Router | JWT | | |

---

# 📂 Project Structure

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

---

# 🔄 Workflow

```text
Employee
    │
Upload Receipt
    │
AI OCR extracts data
    │
Employee confirms
    │
Manager Approval
    │
Finance Verification
    │
Reimbursement
```

---

# ⚙️ Installation

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

# 🔐 Environment Variables

### Server (.env)

```env
PORT=8000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
GEMINI_API_KEY=your_api_key
OCR_LANG=eng+hin
```

### Client (.env)

```env
VITE_API_URI=http://localhost:8000/api/v1
```

---

# 🐳 Docker

Build and run everything with one command:

```bash
docker compose up --build
```

Stop:

```bash
docker compose down
```

---

# 🌐 API

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | /auth/login | User Login |
| POST | /auth/register | User Registration |
| POST | /expense | Submit Expense |
| GET | /expense | View Expenses |
| PUT | /manager | Manager Approval |
| PUT | /finance | Finance Approval |

---

# 🔒 Security

- JWT Authentication
- Role-Based Authorization
- Environment Variable Protection
- Secure API Access
- Dockerized Deployment

---

# 🚀 Future Improvements

- [ ] ☁️ Deploy on AWS (EC2)
- [ ] 🛡️ AI-based Fraud Detection
- [ ] 🧾 Bulk Receipt Upload & Processing
- [ ] 🔄 ERP Integration (SAP / Oracle)
- [ ] ☸️ Kubernetes Deployment
- [ ] ⚙️ CI/CD Pipeline

---

# 👩‍💻 Author

**Shrishti Gaur**

B.Tech CSE • DevOps & Full Stack Developer

GitHub: https://github.com/shrishti-gaur

---

<div align="center">

⭐ If you found this project useful, consider giving it a star!

</div>
