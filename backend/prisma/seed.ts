import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import type { AttendanceStatus, Gender, FeeStatus, Role } from '../src/generated/prisma/enums.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required to seed the database');

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const demoPassword = process.env.DEMO_PASSWORD ?? 'SchoolDemo@2026';

const users: {
  name: string;
  email: string;
  role: Role;
  gender: Gender;
  phoneNumber: string;
  active?: boolean;
  assignments?: { grade: string; section: string }[];
}[] = [
  { name: 'Maya Rao', email: 'admin@school.local', role: 'ADMIN', gender: 'FEMALE', phoneNumber: '+91 9876501001' },
  { name: 'Vikram Sethi', email: 'viceprincipal@school.local', role: 'ADMIN', gender: 'MALE', phoneNumber: '+91 9876501002' },
  { name: 'Arun Mehta', email: 'teacher@school.local', role: 'TEACHER', gender: 'MALE', phoneNumber: '+91 9876501003', assignments: [{ grade: '8', section: 'A' }, { grade: '8', section: 'B' }] },
  { name: 'Priya Kapoor', email: 'priya@school.local', role: 'TEACHER', gender: 'FEMALE', phoneNumber: '+91 9876501004', assignments: [{ grade: '9', section: 'A' }, { grade: '9', section: 'B' }] },
  { name: 'Neeraj Verma', email: 'neeraj@school.local', role: 'TEACHER', gender: 'MALE', phoneNumber: '+91 9876501005', assignments: [{ grade: '10', section: 'A' }, { grade: '10', section: 'B' }] },
  { name: 'Anjali Bose', email: 'anjali@school.local', role: 'TEACHER', gender: 'FEMALE', phoneNumber: '+91 9876501006', assignments: [{ grade: '7', section: 'A' }, { grade: '7', section: 'B' }] },
  { name: 'Farhan Ali', email: 'farhan@school.local', role: 'TEACHER', gender: 'MALE', phoneNumber: '+91 9876501007', assignments: [{ grade: '6', section: 'A' }, { grade: '6', section: 'B' }] },
  { name: 'Kavita Sharma', email: 'kavita@school.local', role: 'TEACHER', gender: 'FEMALE', phoneNumber: '+91 9876501008', assignments: [{ grade: '8', section: 'A' }, { grade: '9', section: 'A' }] },
  { name: 'Ritu Malhotra', email: 'inactive.teacher@school.local', role: 'TEACHER', gender: 'FEMALE', phoneNumber: '+91 9876501009', active: false },
];

const studentNames: { name: string; gender: Gender; guardianName: string }[] = [
  { name: 'Aarav Sen', gender: 'MALE', guardianName: 'Riya Sen' },
  { name: 'Diya Nair', gender: 'FEMALE', guardianName: 'Kiran Nair' },
  { name: 'Kabir Shah', gender: 'MALE', guardianName: 'Neha Shah' },
  { name: 'Meera Iyer', gender: 'FEMALE', guardianName: 'Rohan Iyer' },
  { name: 'Rohan Das', gender: 'MALE', guardianName: 'Anita Das' },
  { name: 'Sara Khan', gender: 'FEMALE', guardianName: 'Imran Khan' },
  { name: 'Ishaan Gupta', gender: 'MALE', guardianName: 'Nisha Gupta' },
  { name: 'Anaya Joshi', gender: 'FEMALE', guardianName: 'Prakash Joshi' },
  { name: 'Vivaan Singh', gender: 'MALE', guardianName: 'Pooja Singh' },
  { name: 'Zoya Ahmed', gender: 'FEMALE', guardianName: 'Salma Ahmed' },
  { name: 'Aditya Kumar', gender: 'MALE', guardianName: 'Sunita Kumar' },
  { name: 'Myra Patel', gender: 'FEMALE', guardianName: 'Heena Patel' },
  { name: 'Krishna Yadav', gender: 'MALE', guardianName: 'Deepak Yadav' },
  { name: 'Saanvi Mishra', gender: 'FEMALE', guardianName: 'Rashmi Mishra' },
  { name: 'Reyansh Jain', gender: 'MALE', guardianName: 'Nitin Jain' },
  { name: 'Aisha Siddiqui', gender: 'FEMALE', guardianName: 'Farah Siddiqui' },
  { name: 'Dev Chatterjee', gender: 'MALE', guardianName: 'Mita Chatterjee' },
  { name: 'Tara Menon', gender: 'FEMALE', guardianName: 'Lakshmi Menon' },
  { name: 'Arjun Reddy', gender: 'MALE', guardianName: 'Anil Reddy' },
  { name: 'Kiara Bansal', gender: 'FEMALE', guardianName: 'Preeti Bansal' },
  { name: 'Atharv Kulkarni', gender: 'MALE', guardianName: 'Swati Kulkarni' },
  { name: 'Pari Sinha', gender: 'FEMALE', guardianName: 'Alok Sinha' },
  { name: 'Samar Roy', gender: 'MALE', guardianName: 'Madhuri Roy' },
  { name: 'Navya Pillai', gender: 'FEMALE', guardianName: 'Manoj Pillai' },
  { name: 'Yuvraj Thakur', gender: 'MALE', guardianName: 'Seema Thakur' },
  { name: 'Inaya Qureshi', gender: 'FEMALE', guardianName: 'Asif Qureshi' },
  { name: 'Harsh Vardhan', gender: 'MALE', guardianName: 'Renu Vardhan' },
  { name: 'Riddhi Desai', gender: 'FEMALE', guardianName: 'Pankaj Desai' },
  { name: 'Om Prakash', gender: 'MALE', guardianName: 'Geeta Prakash' },
  { name: 'Alina Fernandes', gender: 'FEMALE', guardianName: 'Maria Fernandes' },
  { name: 'Nikhil Batra', gender: 'MALE', guardianName: 'Sonal Batra' },
  { name: 'Avni Saxena', gender: 'FEMALE', guardianName: 'Rajat Saxena' },
  { name: 'Rudra Pandey', gender: 'MALE', guardianName: 'Shalini Pandey' },
  { name: 'Mahi Arora', gender: 'FEMALE', guardianName: 'Vikas Arora' },
  { name: 'Ayaan Mirza', gender: 'MALE', guardianName: 'Shabnam Mirza' },
  { name: 'Pihu Bhatt', gender: 'FEMALE', guardianName: 'Manisha Bhatt' },
];

const classrooms = [
  ['8', 'A'], ['8', 'A'], ['8', 'A'], ['8', 'A'],
  ['9', 'B'], ['9', 'B'], ['8', 'B'], ['8', 'B'],
  ['9', 'A'], ['9', 'A'], ['10', 'A'], ['10', 'A'],
  ['7', 'A'], ['7', 'A'], ['6', 'A'], ['6', 'A'],
  ['10', 'B'], ['10', 'B'], ['9', 'B'], ['9', 'B'],
  ['7', 'B'], ['7', 'B'], ['6', 'B'], ['6', 'B'],
  ['8', 'A'], ['8', 'B'], ['9', 'A'], ['9', 'B'],
  ['10', 'A'], ['10', 'B'], ['7', 'A'], ['7', 'B'],
  ['6', 'A'], ['6', 'B'], ['8', 'A'], ['9', 'A'],
] as const;

// Preserve original demo students' fee values so existing demo scenarios still work.
const fees: { status: FeeStatus; due: number }[] = [
  { status: 'PAID', due: 0 },
  { status: 'PENDING', due: 4200 },
  { status: 'PARTIALLY_PAID', due: 1800 },
  { status: 'PAID', due: 0 },
  { status: 'PENDING', due: 3600 },
  { status: 'PAID', due: 0 },
];

async function main() {
  const passwordHash = await hash(demoPassword, 12);
  const userByEmail = new Map<string, { id: string }>();
  for (const item of users) {
    const { assignments: _assignments, ...data } = item;
    const user = await db.user.upsert({
      where: { email: data.email },
      update: { ...data, active: data.active ?? true, passwordHash },
      create: { ...data, active: data.active ?? true, passwordHash },
    });
    userByEmail.set(user.email, user);
    if (data.role === 'TEACHER') {
      // Sync only demo teachers' allocations; do not modify other accounts.
      await db.teacherAssignment.deleteMany({ where: { teacherId: user.id } });
      if (item.assignments?.length) {
        await db.teacherAssignment.createMany({
          data: item.assignments.map(({ grade, section }) => ({ teacherId: user.id, grade, section })),
          skipDuplicates: true,
        });
      }
    }
  }

  const adminId = userByEmail.get('admin@school.local')!.id;
  const teacherByClass = new Map<string, string>();
  for (const item of users) {
    if (item.role !== 'TEACHER' || item.active === false) continue;
    const id = userByEmail.get(item.email)!.id;
    for (const assignment of item.assignments ?? []) {
      const key = `${assignment.grade}-${assignment.section}`;
      if (!teacherByClass.has(key)) teacherByClass.set(key, id);
    }
  }

  const savedStudents: { id: string; admissionNumber: string; grade: string; section: string }[] = [];
  for (const [index, student] of studentNames.entries()) {
    const admissionNumber = `SCH-${26001 + index}`;
    const [grade, section] = classrooms[index];
    const fee = fees[index] ?? (index % 5 === 0
      ? { status: 'PENDING' as const, due: 2500 + (index % 4) * 750 }
      : index % 4 === 0
        ? { status: 'PARTIALLY_PAID' as const, due: 500 + (index % 3) * 400 }
        : { status: 'PAID' as const, due: 0 });
    const data = {
      ...student,
      admissionNumber,
      grade,
      section,
      email: `student${String(index + 1).padStart(2, '0')}@school.local`,
      phoneNumber: `98${String(76000001 + index).padStart(8, '0')}`,
      active: index !== 31,
      feeStatus: fee.status,
      amountDue: fee.due,
    };
    const saved = await db.student.upsert({
      where: { admissionNumber },
      update: data,
      create: data,
    });
    savedStudents.push(saved);
  }

  const days = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10'];
  let createdAttendance = 0;
  for (const [dayIndex, day] of days.entries()) {
    const date = new Date(`${day}T00:00:00.000Z`);
    for (const [index, student] of savedStudents.entries()) {
      if (index === 31) continue; // inactive student
      const status: AttendanceStatus = day === '2026-10-10' && index < 2
        ? (index === 0 ? 'PRESENT' : 'LATE')
        : (index + dayIndex * 3) % 13 === 0
          ? 'ABSENT'
          : (index * 2 + dayIndex) % 11 === 0
            ? 'LATE'
            : 'PRESENT';
      const recordedById = teacherByClass.get(`${student.grade}-${student.section}`) ?? adminId;
      // Create new records only: preserve any edits and audit history made through the API.
      const existing = await db.attendance.findUnique({
        where: { studentId_date: { studentId: student.id, date } },
        select: { id: true },
      });
      if (existing) continue;
      const attendance = await db.attendance.upsert({
        where: { studentId_date: { studentId: student.id, date } },
        update: {},
        create: { studentId: student.id, date, status, recordedById },
      });
      await db.attendanceAudit.createMany({
        data: [{ attendanceId: attendance.id, changedById: recordedById, oldStatus: null, newStatus: status }],
        skipDuplicates: false,
      });
      createdAttendance++;
    }
  }

  // The activity log has no unique seed key; don't duplicate seed events on reruns.
  for (const [index, student] of savedStudents.slice(0, 12).entries()) {
    const action = 'STUDENT_SEEDED';
    const exists = await db.activityLog.findFirst({
      where: { actorId: adminId, action, entityType: 'Student', entityId: student.id },
      select: { id: true },
    });
    if (!exists) {
      await db.activityLog.create({
        data: {
          actorId: adminId,
          action,
          entityType: 'Student',
          entityId: student.id,
          summary: `Demo student ${student.admissionNumber} initialized`,
          details: { grade: student.grade, section: student.section, seed: true, demoIndex: index },
        },
      });
    }
  }

  console.log(`Seed complete: ${users.length} users, ${savedStudents.length} students, ${days.length} attendance dates (${createdAttendance} new attendance records).`);
  console.log('Demo login: admin@school.local / teacher@school.local (password: DEMO_PASSWORD or local demo default)');
}

try {
  await main();
} finally {
  await db.$disconnect();
}
