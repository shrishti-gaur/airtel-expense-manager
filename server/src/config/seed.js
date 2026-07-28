import { Employee } from '../models/Employee.js';
import { ExpenseClaim } from '../models/ExpenseClaim.js';
import { Notification } from '../models/Notification.js';

export const seedDB = async () => {
  try {
    console.log('[Seed] Checking if database requires seeding...');

    // 1. Seed Employees
    const seedEmployees = [
      {
        employeeId: 'emp_123',
        name: 'John Employee',
        role: 'Employee',
        email: 'john.employee@airtel.com',
        department: 'Engineering',
        costCenter: 'CC-ENG-402'
      },
      {
        employeeId: 'emp_jane',
        name: 'Jane Dev',
        role: 'Employee',
        email: 'jane.dev@airtel.com',
        department: 'Engineering',
        costCenter: 'CC-ENG-402'
      },
      {
        employeeId: 'mgr_456',
        name: 'Sarah Manager',
        role: 'Manager',
        email: 'sarah.manager@airtel.com',
        department: 'Engineering',
        costCenter: 'CC-ENG-402'
      },
      {
        employeeId: 'fin_789',
        name: 'David Finance',
        role: 'Finance',
        email: 'david.finance@airtel.com',
        department: 'Finance',
        costCenter: 'CC-FIN-102'
      },
      {
        employeeId: 'fin_sam',
        name: 'Sam Finance',
        role: 'Finance',
        email: 'sam.finance@airtel.com',
        department: 'Finance',
        costCenter: 'CC-FIN-102'
      }
    ];

    for (const emp of seedEmployees) {
      await Employee.findOneAndUpdate(
        { employeeId: emp.employeeId },
        emp,
        { upsert: true, new: true }
      );
    }
    console.log('[Seed] Employee profiles synced.');

    // 2. Seed Expense Claims if none exist
    const claimsCount = await ExpenseClaim.countDocuments();
    if (claimsCount === 0) {
      console.log('[Seed] No expense claims found. Seeding initial claims...');
      const seedClaims = [
        {
          id: 'EXP-2026-101',
          employeeId: 'emp_123',
          employeeName: 'John Employee',
          title: 'Airtel Broadband Office Link',
          status: 'Submitted',
          amount: 1499,
          invoiceDate: new Date('2026-07-20'),
          submissionDate: new Date('2026-07-20T12:00:00Z'),
          merchant: 'Airtel Broadband Services',
          invoiceNumber: 'INV-AIR-8821',
          currency: 'INR',
          tax: 228.66,
          category: 'Internet & Communications',
          department: 'Engineering',
          costCenter: 'CC-ENG-402',
          projectCode: 'PROJ-AIR-5G',
          expenseType: 'Reimbursable',
          description: 'Monthly broadband billing for home office connectivity.',
          receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
          fileName: 'receipt_document.png',
          fileType: 'image/png',
          fileSize: 154200,
          ocrOverallScore: 94,
          ocrTimestamp: new Date('2026-07-20T12:00:00Z'),
          ocrConfidence: { merchant: 98, invoiceNumber: 90, amount: 96, tax: 92, date: 95, category: 94 },
          employeeNotes: 'Charging for broadband allowance.',
          managerComments: '',
          financeComments: '',
          history: [{ action: 'SUBMITTED', user: 'emp_123', timestamp: new Date('2026-07-20T12:00:00Z') }]
        },
        {
          id: 'EXP-2026-102',
          employeeId: 'emp_123',
          employeeName: 'John Employee',
          title: 'Client Onsite Cab Fare',
          status: 'Reimbursed',
          amount: 700,
          invoiceDate: new Date('2026-07-18'),
          submissionDate: new Date('2026-07-18T16:00:00Z'),
          merchant: 'Ola Cabs Fleet',
          invoiceNumber: 'INV-OLA-9923',
          currency: 'INR',
          tax: 35.0,
          category: 'Travel',
          department: 'Sales',
          costCenter: 'CC-SLS-101',
          projectCode: 'PROJ-IND-CLIENT',
          expenseType: 'Reimbursable',
          description: 'Travel from office to client site for project review.',
          receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
          fileName: 'receipt_document.png',
          fileType: 'image/png',
          fileSize: 154200,
          ocrOverallScore: 89,
          ocrTimestamp: new Date('2026-07-18T16:00:00Z'),
          ocrConfidence: { merchant: 92, invoiceNumber: 85, amount: 95, tax: 80, date: 90, category: 88 },
          employeeNotes: 'Attaching fare invoice.',
          managerComments: 'Approved travel claim.',
          financeComments: 'Ledger settled and paid via corporate account.',
          oracleRefId: 'ORACLE-EXP-1721805624',
          history: [
            { action: 'SUBMITTED', user: 'emp_123', timestamp: new Date('2026-07-18T16:00:00Z') },
            { action: 'APPROVED', user: 'mgr_456', timestamp: new Date('2026-07-18T18:00:00Z') },
            { action: 'REIMBURSED', user: 'fin_789', timestamp: new Date('2026-07-19T10:00:00Z') }
          ]
        },
        {
          id: 'EXP-2026-103',
          employeeId: 'emp_123',
          employeeName: 'John Employee',
          title: 'Partner Engagement Dinner',
          status: 'Returned',
          amount: 2500,
          invoiceDate: new Date('2026-07-15'),
          submissionDate: new Date('2026-07-15T21:30:00Z'),
          merchant: 'Taj Buffet Lounge',
          invoiceNumber: 'INV-TAJ-7721',
          currency: 'INR',
          tax: 381.35,
          category: 'Meals',
          department: 'Engineering',
          costCenter: 'CC-ENG-402',
          projectCode: 'PROJ-AIR-5G',
          expenseType: 'Reimbursable',
          description: 'Stakeholder meeting buffet dinner.',
          receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
          fileName: 'receipt_document.png',
          fileType: 'image/png',
          fileSize: 154200,
          ocrOverallScore: 74,
          ocrTimestamp: new Date('2026-07-15T21:30:00Z'),
          ocrConfidence: { merchant: 85, invoiceNumber: 52, amount: 89, tax: 45, date: 91, category: 70 },
          employeeNotes: 'Business meals.',
          managerComments: 'The uploaded receipt document is blurry and missing line items. Please re-upload a clean copy and update the tax allocation.',
          financeComments: '',
          history: [
            { action: 'SUBMITTED', user: 'emp_123', timestamp: new Date('2026-07-15T21:30:00Z') },
            { action: 'RETURNED', user: 'mgr_456', timestamp: new Date('2026-07-16T09:00:00Z') }
          ]
        },
        {
          id: 'EXP-2026-104',
          employeeId: 'emp_jane',
          employeeName: 'Jane Dev',
          title: 'IDE Tool License Annual',
          status: 'Submitted',
          amount: 3701,
          invoiceDate: new Date('2026-07-19'),
          submissionDate: new Date('2026-07-19T10:15:00Z'),
          merchant: 'JetBrains s.r.o.',
          invoiceNumber: 'INV-JB-55612',
          currency: 'INR',
          tax: 564.55,
          category: 'Software Licences',
          department: 'Engineering',
          costCenter: 'CC-ENG-402',
          projectCode: 'PROJ-AIR-5G',
          expenseType: 'Reimbursable',
          description: 'Personal subscription renewal for IntelliJ Ultimate IDE.',
          receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
          fileName: 'receipt_document.png',
          fileType: 'image/png',
          fileSize: 154200,
          ocrOverallScore: 78,
          ocrTimestamp: new Date('2026-07-19T10:15:00Z'),
          ocrConfidence: { merchant: 85, invoiceNumber: 74, amount: 92, tax: 68, date: 88, category: 70 },
          employeeNotes: 'Requesting subscription allowance.',
          managerComments: '',
          financeComments: '',
          history: [{ action: 'SUBMITTED', user: 'emp_jane', timestamp: new Date('2026-07-19T10:15:00Z') }]
        },
        {
          id: 'EXP-2026-105',
          employeeId: 'fin_sam',
          employeeName: 'Sam Finance',
          title: 'Testing Mobile handset',
          status: 'Approved',
          amount: 15400,
          invoiceDate: new Date('2026-07-15'),
          submissionDate: new Date('2026-07-15T11:00:00Z'),
          merchant: 'Airtel Corporate Store',
          invoiceNumber: 'INV-ART-4412',
          currency: 'INR',
          tax: 2349.15,
          category: 'Hardware Purchase',
          department: 'Finance',
          costCenter: 'CC-FIN-102',
          projectCode: 'PROJ-CORE-INFRA',
          expenseType: 'Corporate Card',
          description: 'Test devices for network quality audits.',
          receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
          fileName: 'receipt_document.png',
          fileType: 'image/png',
          fileSize: 154200,
          ocrOverallScore: 97,
          ocrTimestamp: new Date('2026-07-15T11:00:00Z'),
          ocrConfidence: { merchant: 99, invoiceNumber: 95, amount: 98, tax: 96, date: 98, category: 97 },
          employeeNotes: 'Approved budget purchase.',
          managerComments: 'Approved.',
          financeComments: '',
          history: [
            { action: 'SUBMITTED', user: 'fin_sam', timestamp: new Date('2026-07-15T11:00:00Z') },
            { action: 'APPROVED', user: 'mgr_456', timestamp: new Date('2026-07-15T15:00:00Z') }
          ]
        },
        {
          id: 'EXP-2026-106',
          employeeId: 'emp_123',
          employeeName: 'John Employee',
          title: 'Cloud Server Sandbox hosting',
          status: 'Draft',
          amount: 1000,
          invoiceDate: new Date('2026-07-10'),
          submissionDate: new Date('2026-07-10T10:00:00Z'),
          merchant: 'Amazon Web Services',
          invoiceNumber: 'INV-AWS-8812',
          currency: 'INR',
          tax: 152.54,
          category: 'Software Licences',
          department: 'Engineering',
          costCenter: 'CC-ENG-402',
          projectCode: 'PROJ-AIR-5G',
          expenseType: 'Reimbursable',
          description: 'Developer sandbox servers charges.',
          receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
          fileName: 'receipt_document.png',
          fileType: 'image/png',
          fileSize: 154200,
          ocrOverallScore: 95,
          ocrTimestamp: new Date('2026-07-10T10:00:00Z'),
          ocrConfidence: { merchant: 99, invoiceNumber: 92, amount: 98, tax: 95, date: 97, category: 96 },
          employeeNotes: 'Developer draft details.',
          managerComments: '',
          financeComments: '',
          history: [{ action: 'DRAFT_SAVED', user: 'emp_123', timestamp: new Date('2026-07-10T10:00:00Z') }]
        }
      ];

      await ExpenseClaim.insertMany(seedClaims);
      console.log('[Seed] Initial expense claims seeded.');
    }

    // 3. Seed Notifications if none exist
    const notificationsCount = await Notification.countDocuments();
    if (notificationsCount === 0) {
      console.log('[Seed] No notifications found. Seeding initial notifications...');
      const seedNotifications = [
        {
          id: 'NOTIF-101',
          userId: 'emp_123',
          title: 'Welcome to Airtel Expense Manager',
          description: 'Your expense workspace is active. Manage, scan, and audit your claims here.',
          timestamp: new Date(Date.now() - 3600000),
          read: false,
          type: 'info'
        },
        {
          id: 'NOTIF-102',
          userId: 'emp_123',
          title: 'System Synced',
          description: 'Successfully established link to Oracle ERP General Ledger.',
          timestamp: new Date(Date.now() - 7200000),
          read: true,
          type: 'success'
        }
      ];

      await Notification.insertMany(seedNotifications);
      console.log('[Seed] Initial notifications seeded.');
    }

    console.log('[Seed] Seeding completion check done.');
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
  }
};
