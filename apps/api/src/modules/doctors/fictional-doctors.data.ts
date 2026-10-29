import { DoctorSummary, PracticeType, DoctorStatus } from '../../shared';

export interface FictionalSpecialty {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export const FICTIONAL_SPECIALTIES: FictionalSpecialty[] = [
  {
    id: 'sp-001',
    name: 'General Medicine',
    slug: 'general-medicine',
    description: 'Comprehensive adult health, common illnesses, chronic care, and routine consultations.',
    icon: 'Stethoscope',
  },
  {
    id: 'sp-002',
    name: 'Cardiology',
    slug: 'cardiology',
    description: 'Heart health, hypertension management, preventive cardiovascular care.',
    icon: 'HeartPulse',
  },
  {
    id: 'sp-003',
    name: 'Dermatology',
    slug: 'dermatology',
    description: 'Skin conditions, acne, eczema, hair and nail disorders.',
    icon: 'Sparkles',
  },
  {
    id: 'sp-004',
    name: 'Pediatrics',
    slug: 'pediatrics',
    description: 'Infant, child, and adolescent growth, nutrition, and common pediatric conditions.',
    icon: 'Baby',
  },
  {
    id: 'sp-005',
    name: 'Psychiatry & Mental Health',
    slug: 'psychiatry',
    description: 'Anxiety, depression, sleep disorders, stress management, and mental wellbeing.',
    icon: 'Brain',
  },
  {
    id: 'sp-006',
    name: 'Obstetrics & Gynecology',
    slug: 'gynecology',
    description: "Women's health, reproductive health, hormonal balance, and wellness.",
    icon: 'Activity',
  },
];

export const FICTIONAL_DOCTORS: DoctorSummary[] = [
  {
    id: 'doc-00000000-0000-0000-0000-000000000001',
    userId: 'usr-00000000-0000-0000-0000-000000000001',
    slug: 'dr-aarav-sharma',
    displayName: 'Dr. Aarav Sharma',
    bio: 'Senior Consultant in General Medicine with a focus on chronic disease management, diabetes prevention, and lifestyle medicine. (Fictional profile for platform development).',
    practiceType: PracticeType.INDEPENDENT,
    yearsExperience: 12,
    consultationFeePaise: 50000, // ₹500
    currency: 'INR',
    languages: ['English', 'Hindi', 'Punjabi'],
    acceptsInstant: true,
    status: DoctorStatus.VERIFIED,
    specialties: ['General Medicine'],
    ratingAvg: 4.9,
    ratingCount: 142,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'doc-00000000-0000-0000-0000-000000000002',
    userId: 'usr-00000000-0000-0000-0000-000000000002',
    slug: 'dr-priya-nair',
    displayName: 'Dr. Priya Nair',
    bio: 'Cardiologist with experience in preventive cardiology, hypertension screening, and tele-triage for heart conditions. (Fictional profile for platform development).',
    practiceType: PracticeType.MANAGED,
    yearsExperience: 15,
    consultationFeePaise: 80000, // ₹800
    currency: 'INR',
    languages: ['English', 'Malayalam', 'Hindi'],
    acceptsInstant: true,
    status: DoctorStatus.VERIFIED,
    specialties: ['Cardiology', 'General Medicine'],
    ratingAvg: 4.95,
    ratingCount: 98,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813511-68c1221b023f?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'doc-00000000-0000-0000-0000-000000000003',
    userId: 'usr-00000000-0000-0000-0000-000000000003',
    slug: 'dr-rajesh-mukherjee',
    displayName: 'Dr. Rajesh Mukherjee',
    bio: 'Consultant Dermatologist specializing in clinical dermatology, tele-dermatology diagnosis, allergic reactions, and eczema. (Fictional profile for platform development).',
    practiceType: PracticeType.INDEPENDENT,
    yearsExperience: 9,
    consultationFeePaise: 60000, // ₹600
    currency: 'INR',
    languages: ['English', 'Bengali', 'Hindi'],
    acceptsInstant: false,
    status: DoctorStatus.VERIFIED,
    specialties: ['Dermatology'],
    ratingAvg: 4.8,
    ratingCount: 76,
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'doc-00000000-0000-0000-0000-000000000004',
    userId: 'usr-00000000-0000-0000-0000-000000000004',
    slug: 'dr-ananya-iyer',
    displayName: 'Dr. Ananya Iyer',
    bio: 'Pediatric specialist providing empathetic child healthcare advice, immunization guidance, and childhood illness consultations. (Fictional profile for platform development).',
    practiceType: PracticeType.MANAGED,
    yearsExperience: 11,
    consultationFeePaise: 55000, // ₹550
    currency: 'INR',
    languages: ['English', 'Tamil', 'Hindi'],
    acceptsInstant: true,
    status: DoctorStatus.VERIFIED,
    specialties: ['Pediatrics'],
    ratingAvg: 4.92,
    ratingCount: 115,
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'doc-00000000-0000-0000-0000-000000000005',
    userId: 'usr-00000000-0000-0000-0000-000000000005',
    slug: 'dr-vikram-malhotra',
    displayName: 'Dr. Vikram Malhotra',
    bio: 'Consultant Psychiatrist dedicated to evidence-based mental healthcare, anxiety disorders, depression, and cognitive wellbeing. (Fictional profile for platform development).',
    practiceType: PracticeType.INDEPENDENT,
    yearsExperience: 14,
    consultationFeePaise: 90000, // ₹900
    currency: 'INR',
    languages: ['English', 'Hindi', 'Marathi'],
    acceptsInstant: false,
    status: DoctorStatus.VERIFIED,
    specialties: ['Psychiatry & Mental Health'],
    ratingAvg: 4.88,
    ratingCount: 89,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'doc-00000000-0000-0000-0000-000000000006',
    userId: 'usr-00000000-0000-0000-0000-000000000006',
    slug: 'dr-sunita-deshmukh',
    displayName: 'Dr. Sunita Deshmukh',
    bio: 'Senior Obstetrician and Gynecologist with expertise in reproductive wellness, maternal guidance, and hormonal health. (Fictional profile for platform development).',
    practiceType: PracticeType.MANAGED,
    yearsExperience: 16,
    consultationFeePaise: 75000, // ₹750
    currency: 'INR',
    languages: ['English', 'Marathi', 'Hindi'],
    acceptsInstant: true,
    status: DoctorStatus.VERIFIED,
    specialties: ['Obstetrics & Gynecology'],
    ratingAvg: 4.96,
    ratingCount: 160,
    avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&auto=format&fit=crop&q=80',
  },
];
