import { Employee } from '../models/Employee.js';
import { ExpenseClaim } from '../models/ExpenseClaim.js';
import { Notification } from '../models/Notification.js';
import { ExpenseCategory } from '../models/ExpenseCategory.js';
import { hashPassword } from '../utils/hash.util.js';

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
        costCenter: 'CC-ENG-402',
        passwordHash: hashPassword('password123'),
      },
      {
        employeeId: 'emp_jane',
        name: 'Jane Dev',
        role: 'Employee',
        email: 'jane.dev@airtel.com',
        department: 'Engineering',
        costCenter: 'CC-ENG-402',
        passwordHash: hashPassword('password123'),
      },
      {
        employeeId: 'mgr_456',
        name: 'Sarah Manager',
        role: 'Manager',
        email: 'sarah.manager@airtel.com',
        department: 'Engineering',
        costCenter: 'CC-ENG-402',
        passwordHash: hashPassword('password123'),
        allowedCategories: [
          'Conveyance',
          'HR-related Expenses',
          'Imprest Reimbursement',
          'International Tour Expense',
          'Network Maintenance Expense',
          'Network Meeting Expenses',
          'Retail Store Expenses',
          'Relocation Expenses',
          'Sales Meeting Expenses',
          'Tour Bill'
        ],
      },
      {
        employeeId: 'TRAVEL001',
        name: 'Travel Manager',
        role: 'Manager',
        email: 'travel.manager@airtel.com',
        department: 'Travel',
        costCenter: 'CC-TRV-301',
        passwordHash: hashPassword('password123'),
        allowedCategories: [
          'Conveyance',
          'International Tour Expense',
          'Relocation Expenses',
          'Tour Bill'
        ],
      },
      {
        employeeId: 'HR001',
        name: 'HR Manager',
        role: 'Manager',
        email: 'hr.manager@airtel.com',
        department: 'HR',
        costCenter: 'CC-HR-501',
        passwordHash: hashPassword('password123'),
        allowedCategories: [
          'HR-related Expenses',
          'Imprest Reimbursement'
        ],
      },
      {
        employeeId: 'SALES001',
        name: 'Sales Manager',
        role: 'Manager',
        email: 'sales.manager@airtel.com',
        department: 'Sales',
        costCenter: 'CC-SLS-101',
        passwordHash: hashPassword('password123'),
        allowedCategories: [
          'Sales Meeting Expenses',
          'Network Meeting Expenses'
        ],
      },
      {
        employeeId: 'NET001',
        name: 'Network Manager',
        role: 'Manager',
        email: 'network.manager@airtel.com',
        department: 'Network',
        costCenter: 'CC-NET-201',
        passwordHash: hashPassword('password123'),
        allowedCategories: [
          'Network Maintenance Expense',
          'Retail Store Expenses'
        ],
      },
      {
        employeeId: 'fin_789',
        name: 'David Finance',
        role: 'Finance',
        email: 'david.finance@airtel.com',
        department: 'Finance',
        costCenter: 'CC-FIN-102',
        passwordHash: hashPassword('password123'),
      },
      {
        employeeId: 'fin_sam',
        name: 'Sam Finance',
        role: 'Finance',
        email: 'sam.finance@airtel.com',
        department: 'Finance',
        costCenter: 'CC-FIN-102',
        passwordHash: hashPassword('password123'),
      },
    ];

    for (const emp of seedEmployees) {
      await Employee.findOneAndUpdate({ employeeId: emp.employeeId }, emp, {
        upsert: true,
        new: true,
      });
    }
    console.log('[Seed] Employee profiles synced.');

    // 2. Seed Expense Claims if SEED_DB environment variable is set to true
    if (process.env.SEED_DB === 'true') {
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
            category: 'Network Maintenance Expense',
            department: 'Engineering',
            costCenter: 'CC-ENG-402',
            projectCode: 'PROJ-AIR-5G',
            expenseType: 'Reimbursable',
            receiptUrl:
              'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
            fileName: 'receipt_document.png',
            fileType: 'image/png',
            fileSize: 154200,
            ocrOverallScore: 94,
            ocrTimestamp: new Date('2026-07-20T12:00:00Z'),
            ocrConfidence: {
              merchant: 98,
              invoiceNumber: 90,
              amount: 96,
              tax: 92,
              date: 95,
              category: 94,
            },
            employeeNotes: 'Charging for broadband allowance.',
            managerComments: '',
            financeComments: '',
            history: [
              { action: 'SUBMITTED', user: 'emp_123', timestamp: new Date('2026-07-20T12:00:00Z') },
            ],
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
            category: 'Conveyance',
            department: 'Sales',
            costCenter: 'CC-SLS-101',
            projectCode: 'PROJ-IND-CLIENT',
            expenseType: 'Reimbursable',
            receiptUrl:
              'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
            fileName: 'receipt_document.png',
            fileType: 'image/png',
            fileSize: 154200,
            ocrOverallScore: 89,
            ocrTimestamp: new Date('2026-07-18T16:00:00Z'),
            ocrConfidence: {
              merchant: 92,
              invoiceNumber: 85,
              amount: 95,
              tax: 80,
              date: 90,
              category: 88,
            },
            employeeNotes: 'Attaching fare invoice.',
            managerComments: 'Approved travel claim.',
            financeComments: 'Ledger settled and paid via corporate account.',
            oracleRefId: 'ORACLE-EXP-1721805624',
            history: [
              { action: 'SUBMITTED', user: 'emp_123', timestamp: new Date('2026-07-18T16:00:00Z') },
              { action: 'APPROVED', user: 'mgr_456', timestamp: new Date('2026-07-18T18:00:00Z') },
              {
                action: 'REIMBURSED',
                user: 'fin_789',
                timestamp: new Date('2026-07-19T10:00:00Z'),
              },
            ],
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
            category: 'Sales Meeting Expenses',
            department: 'Engineering',
            costCenter: 'CC-ENG-402',
            projectCode: 'PROJ-AIR-5G',
            expenseType: 'Reimbursable',
            receiptUrl:
              'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
            fileName: 'receipt_document.png',
            fileType: 'image/png',
            fileSize: 154200,
            ocrOverallScore: 74,
            ocrTimestamp: new Date('2026-07-15T21:30:00Z'),
            ocrConfidence: {
              merchant: 85,
              invoiceNumber: 52,
              amount: 89,
              tax: 45,
              date: 91,
              category: 70,
            },
            employeeNotes: 'Business meals.',
            managerComments:
              'The uploaded receipt document is blurry and missing line items. Please re-upload a clean copy and update the tax allocation.',
            financeComments: '',
            history: [
              { action: 'SUBMITTED', user: 'emp_123', timestamp: new Date('2026-07-15T21:30:00Z') },
              { action: 'RETURNED', user: 'mgr_456', timestamp: new Date('2026-07-16T09:00:00Z') },
            ],
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
            category: 'Network Meeting Expenses',
            department: 'Engineering',
            costCenter: 'CC-ENG-402',
            projectCode: 'PROJ-AIR-5G',
            expenseType: 'Reimbursable',
            receiptUrl:
              'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
            fileName: 'receipt_document.png',
            fileType: 'image/png',
            fileSize: 154200,
            ocrOverallScore: 78,
            ocrTimestamp: new Date('2026-07-19T10:15:00Z'),
            ocrConfidence: {
              merchant: 85,
              invoiceNumber: 74,
              amount: 92,
              tax: 68,
              date: 88,
              category: 70,
            },
            employeeNotes: 'Requesting subscription allowance.',
            managerComments: '',
            financeComments: '',
            history: [
              {
                action: 'SUBMITTED',
                user: 'emp_jane',
                timestamp: new Date('2026-07-19T10:15:00Z'),
              },
            ],
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
            category: 'HR-related Expenses',
            department: 'Finance',
            costCenter: 'CC-FIN-102',
            projectCode: 'PROJ-CORE-INFRA',
            expenseType: 'Corporate Card',
            receiptUrl:
              'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
            fileName: 'receipt_document.png',
            fileType: 'image/png',
            fileSize: 154200,
            ocrOverallScore: 97,
            ocrTimestamp: new Date('2026-07-15T11:00:00Z'),
            ocrConfidence: {
              merchant: 99,
              invoiceNumber: 95,
              amount: 98,
              tax: 96,
              date: 98,
              category: 97,
            },
            employeeNotes: 'Approved budget purchase.',
            managerComments: 'Approved.',
            financeComments: '',
            history: [
              { action: 'SUBMITTED', user: 'fin_sam', timestamp: new Date('2026-07-15T11:00:00Z') },
              { action: 'APPROVED', user: 'mgr_456', timestamp: new Date('2026-07-15T15:00:00Z') },
            ],
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
            category: 'Tour Bill',
            department: 'Engineering',
            costCenter: 'CC-ENG-402',
            projectCode: 'PROJ-AIR-5G',
            expenseType: 'Reimbursable',
            receiptUrl:
              'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
            fileName: 'receipt_document.png',
            fileType: 'image/png',
            fileSize: 154200,
            ocrOverallScore: 95,
            ocrTimestamp: new Date('2026-07-10T10:00:00Z'),
            ocrConfidence: {
              merchant: 99,
              invoiceNumber: 92,
              amount: 98,
              tax: 95,
              date: 97,
              category: 96,
            },
            employeeNotes: 'Developer draft details.',
            managerComments: '',
            financeComments: '',
            history: [
              {
                action: 'DRAFT_SAVED',
                user: 'emp_123',
                timestamp: new Date('2026-07-10T10:00:00Z'),
              },
            ],
          },
          {
            id: 'EXP-2026-107',
            employeeId: 'emp_jane',
            employeeName: 'Jane Dev',
            title: 'Pantry Supplies Imprest',
            status: 'Submitted',
            amount: 500,
            invoiceDate: new Date('2026-07-22'),
            submissionDate: new Date('2026-07-22T09:00:00Z'),
            category: 'Imprest Reimbursement',
            department: 'Engineering',
            costCenter: 'CC-ENG-402',
            expenseType: 'Reimbursable',
            history: [{ action: 'SUBMITTED', user: 'emp_jane', timestamp: new Date('2026-07-22T09:00:00Z') }]
          },
          {
            id: 'EXP-2026-108',
            employeeId: 'emp_123',
            employeeName: 'John Employee',
            title: 'US Client Visit Lodging',
            status: 'Submitted',
            amount: 12500,
            invoiceDate: new Date('2026-07-23'),
            submissionDate: new Date('2026-07-23T14:00:00Z'),
            category: 'International Tour Expense',
            department: 'Sales',
            costCenter: 'CC-SLS-101',
            expenseType: 'Reimbursable',
            history: [{ action: 'SUBMITTED', user: 'emp_123', timestamp: new Date('2026-07-23T14:00:00Z') }]
          },
          {
            id: 'EXP-2026-109',
            employeeId: 'emp_123',
            employeeName: 'John Employee',
            title: 'Retail Store Consumables',
            status: 'Submitted',
            amount: 2200,
            invoiceDate: new Date('2026-07-24'),
            submissionDate: new Date('2026-07-24T11:00:00Z'),
            category: 'Retail Store Expenses',
            department: 'Sales',
            costCenter: 'CC-SLS-101',
            expenseType: 'Reimbursable',
            history: [{ action: 'SUBMITTED', user: 'emp_123', timestamp: new Date('2026-07-24T11:00:00Z') }]
          },
          {
            id: 'EXP-2026-110',
            employeeId: 'emp_jane',
            employeeName: 'Jane Dev',
            title: 'Relocation Flight Charges',
            status: 'Submitted',
            amount: 8900,
            invoiceDate: new Date('2026-07-25'),
            submissionDate: new Date('2026-07-25T17:00:00Z'),
            category: 'Relocation Expenses',
            department: 'Engineering',
            costCenter: 'CC-ENG-402',
            expenseType: 'Reimbursable',
            history: [{ action: 'SUBMITTED', user: 'emp_jane', timestamp: new Date('2026-07-25T17:00:00Z') }]
          },
          {
            id: 'EXP-2026-111',
            employeeId: 'emp_jane',
            employeeName: 'Jane Dev',
            title: 'Multiple Receipt Relocation Claim',
            status: 'Submitted',
            amount: 8900,
            reimbursementAmount: 8900,
            receiptAmount: 8900,
            invoiceDate: new Date('2026-07-26'),
            submissionDate: new Date('2026-07-26T10:00:00Z'),
            category: 'Relocation Expenses',
            department: 'Engineering',
            costCenter: 'CC-ENG-402',
            expenseType: 'Reimbursable',
            merchant: 'Air India',
            invoiceNumber: 'AI-2026-554',
            receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
            fileName: 'flight_ticket.png',
            fileType: 'image/png',
            fileSize: 180000,
            receiptHash: 'mock-hash-seed-1',
            invoiceFingerprint: 'mock-fingerprint-seed-1',
            receipts: [
              {
                receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
                fileName: 'flight_ticket.png',
                fileType: 'image/png',
                fileSize: 180000,
                amount: 5000,
                tax: 450,
                merchant: 'Air India',
                invoiceNumber: 'AI-2026-554',
                invoiceDate: new Date('2026-07-26'),
                ocrOverallScore: 90,
                ocrTimestamp: new Date('2026-07-26T10:00:00Z'),
                receiptHash: 'mock-hash-seed-1',
                invoiceFingerprint: 'mock-fingerprint-seed-1'
              },
              {
                receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
                fileName: 'luggage_delivery.png',
                fileType: 'image/png',
                fileSize: 120000,
                amount: 3900,
                tax: 350,
                merchant: 'Packers & Movers',
                invoiceNumber: 'PM-9900-2',
                invoiceDate: new Date('2026-07-26'),
                ocrOverallScore: 85,
                ocrTimestamp: new Date('2026-07-26T10:00:00Z'),
                receiptHash: 'mock-hash-seed-2',
                invoiceFingerprint: 'mock-fingerprint-seed-2'
              }
            ],
            history: [{ action: 'SUBMITTED', user: 'emp_jane', timestamp: new Date('2026-07-26T10:00:00Z') }]
          }
        ];

        await ExpenseClaim.insertMany(seedClaims);
        console.log('[Seed] Initial expense claims seeded.');
      }
    }

    // 3. Seed Notifications if SEED_DB environment variable is set to true
    if (process.env.SEED_DB === 'true') {
      const notificationsCount = await Notification.countDocuments();
      if (notificationsCount === 0) {
        console.log('[Seed] No notifications found. Seeding initial notifications...');
        const seedNotifications = [
          {
            id: 'NOTIF-101',
            userId: 'emp_123',
            title: 'Welcome to Airtel Expense Manager',
            description:
              'Your expense workspace is active. Manage, scan, and audit your claims here.',
            timestamp: new Date(Date.now() - 3600000),
            read: false,
            type: 'info',
          },
          {
            id: 'NOTIF-102',
            userId: 'emp_123',
            title: 'System Synced',
            description: 'Successfully established link to Oracle ERP General Ledger.',
            timestamp: new Date(Date.now() - 7200000),
            read: true,
            type: 'success',
          },
        ];

        await Notification.insertMany(seedNotifications);
        console.log('[Seed] Initial notifications seeded.');
      }
    }

    // 4. Seed Expense Categories
    const seedCategories = [
      {
        id: 'Conveyance',
        label: 'Conveyance',
        group: 'Travel & Tours',
        subcategories: ['Auto Charges', 'Taxi Charges'],
        aliases: ['conveyance', 'cab fare', 'taxi fare', 'auto fare', 'travel', 'cab', 'taxi', 'ola', 'uber'],
      },
      {
        id: 'HR-related Expenses',
        label: 'HR-related Expenses',
        group: 'HR & Imprest',
        subcategories: [
          'Communication Expense CFA Limit',
          'Handset',
          'Joining / Recruitment Expense',
          'Pantry Tea and Coffee Expense',
          'Retail Plan Bill',
          'Staff Welfare',
          'Team Engagement Expense'
        ],
        aliases: ['hr expenses', 'hr-related', 'hr related', 'recruitment expense', 'office supplies', 'stationery', 'others'],
      },
      {
        id: 'Imprest Reimbursement',
        label: 'Imprest Reimbursement',
        group: 'HR & Imprest',
        subcategories: [
          'CSE Call Center Engagement Expenses',
          'Meeting Expenses',
          'Pantry Tea and Coffee Expenses',
          'Photocopy Expenses',
          'Postable and Courier Expenses',
          'Printing and Stationery',
          'R&M Office',
          'Rates and Taxes'
        ],
        aliases: ['imprest', 'imprest cash', 'petty cash'],
      },
      {
        id: 'International Tour Expense',
        label: 'International Tour Expense',
        group: 'Travel & Tours',
        subcategories: [
          'Hotel Stay',
          'International Communication Charges',
          'International Conveyance Expenses',
          'Laundry Expenses',
          'Meals',
          'Per Diem on International Travel',
          'Visa Expenses'
        ],
        aliases: ['international tour', 'foreign travel', 'visa expense', 'intl tour'],
      },
      {
        id: 'Network Maintenance Expense',
        label: 'Network Maintenance Expense',
        group: 'Operations',
        subcategories: [
          'Network Liaison Expenses',
          'Network Maintenance Expense',
          'Network Material Transportation',
          'Network Misc. Expenses',
          'Network Regulatory Expenses',
          'Temp Other Route Allocation'
        ],
        aliases: ['network maintenance', 'fiber maintenance', 'mast repair', 'site maintenance', 'maintenance'],
      },
      {
        id: 'Network Meeting Expenses',
        label: 'Network Meeting Expenses',
        group: 'Meetings',
        subcategories: [
          'Network Meeting Expenses'
        ],
        aliases: ['network meeting', 'telecom meeting', 'partner alignment'],
      },
      {
        id: 'Retail Store Expenses',
        label: 'Retail Store Expenses',
        group: 'Operations',
        subcategories: [
          'Conveyance for Store Purpose',
          'Courier Charges',
          'Diesel for Store',
          'Housekeeping Consumables',
          'Kiosk ROL',
          'Minor Store Repairs and Maintenance',
          'Staff Engagement and Refreshments',
          'Stationery',
          'Uniform Stitching Expenses',
          'Water Bill'
        ],
        aliases: ['retail store', 'own retail store', 'retail outlet', 'store maintenance', 'pos expense', 'store'],
      },
      {
        id: 'Relocation Expenses',
        label: 'Relocation Expenses',
        group: 'Travel & Tours',
        subcategories: [
          'Airfare',
          'Laundry Expenses',
          'Meals',
          'Taxi Charges',
          'Train/Bus Travel',
          'Vehicle Registration Expense'
        ],
        aliases: ['relocation', 'moving expense', 'shifter charge', 'brokerage'],
      },
      {
        id: 'Sales Meeting Expenses',
        label: 'Sales Meeting Expenses',
        group: 'Meetings',
        subcategories: [
          'Sales Meeting Expense'
        ],
        aliases: ['sales meeting', 'client pitch', 'deal closure alignment', 'meals', 'entertainment', 'dining'],
      },
      {
        id: 'Tour Bill',
        label: 'Tour Bill',
        group: 'Travel & Tours',
        subcategories: [
          'Air Travel',
          'Auto Charges',
          'Car Rental',
          'Excess Baggage Charges',
          'Insurance Expense for Overseas Tour',
          'International Conveyance Expense',
          'International Loading and Boarding',
          'International Out-of-Pocket',
          'Lodging',
          'Meals etc.',
          'Medical Expenses',
          'Train/Bus Travel'
        ],
        aliases: ['tour bill', 'official tour', 'domestic travel bill'],
      }
    ];

    for (const cat of seedCategories) {
      await ExpenseCategory.findOneAndUpdate({ id: cat.id }, cat, {
        upsert: true,
        new: true,
      });
    }
    console.log('[Seed] Expense Category profiles synced.');

    console.log('[Seed] Seeding completion check done.');
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
  }
};
