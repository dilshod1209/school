import { Timestamp } from 'firebase/firestore';

export interface Student {
  id: string;
  name: string;
  phone: string;
  email: string;
  registeredAt: Timestamp;
  status: 'active' | 'inactive';
}

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  salary: number;
}

export interface Group {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
  startTime: string; // e.g. "14:00"
  days: string[]; // e.g. ["Mon", "Wed", "Fri"]
  price: number;
}

export interface Enrollment {
  studentId: string;
  groupId: string;
  joinedAt: Timestamp;
}

export interface Attendance {
  id: string;
  groupId: string;
  date: string; // YYYY-MM-DD
  attendedIds: string[];
}

export interface Payment {
  id: string;
  studentId: string;
  groupId: string;
  amount: number;
  date: Timestamp;
  month: string; // YYYY-MM
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalGroups: number;
  monthlyRevenue: number;
  debtsCount: number;
}

export interface SystemUser {
  uid: string;
  name: string;
  phone: string;
  role: 'admin' | 'staff';
}
