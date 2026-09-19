export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  username?: string;
  role: Role;
  name: string;
}

export interface Student {
  student_id: string;
  name: string;
  class_id: string;
}

export interface Teacher {
  teacher_id: string;
  name: string;
}

export interface Class {
  class_id: string;
  name: string;
}

export interface Subject {
  subject_id: string;
  name: string;
  teacher_id: string;
}

export interface Enrollment {
  student_id: string;
  subject_id: string;
}

export interface Assignment {
  assignment_id: string;
  subject_id: string;
  title: string;
  assign_date: string;
  due_date: string;
  max_score: number;
}

export type SubmissionStatus = 'submitted' | 'late' | 'missing' | 'upcoming';

export interface Submission {
  assignment_id: string;
  student_id: string;
  status: SubmissionStatus;
  score: number | null;
  feedback?: string;
}

export interface Quiz {
  quiz_id: string;
  subject_id: string;
  title: string;
  max_score: number;
}

export interface QuizScore {
  quiz_id: string;
  student_id: string;
  score: number;
}

export interface Midterm {
  student_id: string;
  subject_id: string;
  score: number;
}

export interface FinalExam {
  student_id: string;
  subject_id: string;
  score: number;
}

export interface Behavior {
  student_id: string;
  subject_id: string;
  score: number;
}

export type AttendanceStatus = 'present' | 'late' | 'leave_personal' | 'leave_sick' | 'absent';

export interface Attendance {
  student_id: string;
  subject_id: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
}

export interface Announcement {
  id: string;
  title: string;
  detail: string;
  subject_id?: string;
  class_id?: string;
  date: string;
  due_date?: string;
}

export interface ScoreSettings {
  subject_id: string;
  assignment_weight: number;
  quiz_weight: number;
  midterm_weight: number;
  final_weight: number;
  behavior_weight: number;
}

export interface ScoreSummary {
  student_id: string;
  subject_id: string;
  assignments_score: number;
  quiz_score: number;
  midterm_score: number;
  behavior_score: number;
  final_score: number;
  total_score: number;
}
