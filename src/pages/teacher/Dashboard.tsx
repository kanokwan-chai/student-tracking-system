import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CustomSelect } from '../../components/common/CustomSelect';
import { Users, AlertCircle, CalendarX, BarChart2, Search, BookOpen, Layers, X, UserCheck } from 'lucide-react';
import clsx from 'clsx';

interface Subject {
  subject_id: string;
  name: string;
  class_id: string;
}

interface TeacherDashboardData {
  stats: {
    studentCount: number;
    totalMissing: number;
    totalAbsent: number;
    totalLate: number;
    avgScore: number | string;
    maxScore: number;
    minScore: number;
  };
  students: Array<{
    student_id: string;
    name: string;
    missingCount: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    leaveBusinessCount: number;
    leaveSickCount: number;
    totalScore: number | string;
    scoreTasks: any;
    scoreQuizzes: any;
    scoreBehavior: any;
    scoreFinal: any;
    grade: any;
    attendanceDetails?: Array<{ date: string; status: string }>;
    taskDetails?: Array<{ title: string; score: any; isMissing: boolean }>;
  }>;
}

const TeacherDashboard: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'missing' | 'absent'>('all');

  // Modal State
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<any | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'attendance' | 'tasks' | 'grades'>('attendance');

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const data = await api.getTeacherSubjects('teacher1');
        setSubjects(data);
        
        if (data.length > 0) {
          const uniqueSubjectNames: string[] = Array.from(new Set(data.map((s: Subject) => s.name)));
          const defaultSubjName = uniqueSubjectNames[0];
          setSelectedSubject(defaultSubjName);
          
          const classesForSubj = data.filter((s: Subject) => s.name === defaultSubjName).map((s: Subject) => s.class_id);
          setAvailableClasses(classesForSubj);
          if (classesForSubj.length > 0) {
            setSelectedClass(classesForSubj[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load subjects', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // Update available classes when subject changes
  const handleSubjectChange = (subjectName: string) => {
    setSelectedSubject(subjectName);
    const classesForSubj = subjects.filter(s => s.name === subjectName).map(s => s.class_id);
    setAvailableClasses(classesForSubj);
    if (classesForSubj.length > 0) {
      setSelectedClass(classesForSubj[0]);
    } else {
      setSelectedClass('');
    }
  };

  // Fetch dashboard data when subject or class changes
  useEffect(() => {
    let intervalId: number;

    const fetchDashboard = async (isBackground = false) => {
      if (!selectedSubject || !selectedClass) return;
      try {
        if (!isBackground) setLoading(true);
        const data = await api.getTeacherDashboard(selectedSubject, selectedClass);
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    fetchDashboard();

    // Poll every 10 seconds
    intervalId = window.setInterval(() => {
      fetchDashboard(true);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [selectedSubject, selectedClass]);

  const uniqueSubjectNames = Array.from(new Set(subjects.map(s => s.name)));

  const filteredStudents = (dashboardData?.students || []).filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'missing') return student.missingCount > 0;
    if (filterMode === 'absent') return student.absentCount > 0;
    return true;
  });

  const stats = dashboardData?.stats;

  return (
    <div className="space-y-6 w-full max-w-full antialiased">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2 border border-indigo-100">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>แผงควบคุมคุณครูผู้สอน</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">ระบบติดตามผลการเรียน & เช็คชื่อ</h1>
          <p className="text-slate-500 text-xs font-medium mt-1">เลือกวิชาและห้องเรียนเพื่อดูผลคะแนน งานค้าง และประวัติเข้าเรียนรายวัน</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Subject Dropdown */}
          <div className="w-full sm:w-64">
            <CustomSelect
              options={uniqueSubjectNames}
              value={selectedSubject}
              onChange={(val) => handleSubjectChange(val)}
              placeholder="-- เลือกวิชาเรียน --"
              icon={<BookOpen className="w-4 h-4 text-indigo-500" />}
              disabled={uniqueSubjectNames.length === 0}
            />
          </div>

          {/* Class Dropdown */}
          <div className="w-full sm:w-44">
            <CustomSelect
              options={availableClasses}
              value={selectedClass}
              onChange={(val) => setSelectedClass(val)}
              placeholder="-- เลือกห้องเรียน --"
              icon={<Layers className="w-4 h-4 text-purple-500" />}
              disabled={availableClasses.length === 0}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-28 bg-white rounded-3xl border border-slate-100"></div>)}
          </div>
          <div className="h-64 bg-white rounded-3xl border border-slate-100"></div>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards (4 Balanced Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-1">นักเรียนทั้งหมด</span>
                <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stats?.studentCount} <span className="text-xs font-normal text-slate-400">คน</span>
                </p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-1">งานค้างรวม</span>
                <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stats?.totalMissing} <span className="text-xs font-normal text-slate-400">ชิ้น</span>
                </p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-1">ขาดเรียน / สาย</span>
                <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stats?.totalAbsent} <span className="text-xs font-normal text-slate-400">ขาด</span> / {stats?.totalLate} <span className="text-xs font-normal text-slate-400">สาย</span>
                </p>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shrink-0">
                <CalendarX className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-1">คะแนนเฉลี่ยห้อง</span>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats?.avgScore}</p>
                  <p className="text-xs text-slate-400 font-normal">/100</p>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
                <BarChart2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Student Table & Filters */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/60 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-bold text-slate-900 text-sm">รายชื่อนักเรียน ({filteredStudents.length} คน)</h2>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={clsx(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                      filterMode === 'all' ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    )}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    onClick={() => setFilterMode('missing')}
                    className={clsx(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                      filterMode === 'missing' ? "bg-amber-500 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    )}
                  >
                    ⚠️ งานค้าง
                  </button>
                  <button
                    onClick={() => setFilterMode('absent')}
                    className={clsx(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                      filterMode === 'absent' ? "bg-rose-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    )}
                  >
                    🔴 ขาดเรียน
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ค้นหาชื่อ หรือ รหัส..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            
            {/* Clean, Non-overflowing Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[11px] font-bold">
                    <th className="px-4 py-3">รหัส</th>
                    <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                    <th className="px-3 py-3 text-center">งานค้าง</th>
                    <th className="px-3 py-3 text-center">ประวัติการเข้าเรียน</th>
                    <th className="px-3 py-3 text-center">งาน (30%)</th>
                    <th className="px-3 py-3 text-center">สอบ (20%)</th>
                    <th className="px-3 py-3 text-center">จิตพิสัย (20%)</th>
                    <th className="px-3 py-3 text-center">ปลายภาค (30%)</th>
                    <th className="px-3 py-3 text-center bg-indigo-50/50 text-indigo-800 font-extrabold">รวม</th>
                    <th className="px-3 py-3 text-center">เกรด</th>
                    <th className="px-4 py-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-10 text-center text-slate-400 font-medium">
                        ไม่พบข้อมูลนักเรียนที่ตรงตามเงื่อนไข
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student: any) => (
                      <tr key={student.student_id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-500">{student.student_id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900">{student.name}</span>
                          </div>
                        </td>

                        {/* Missing Tasks */}
                        <td className="px-3 py-3 text-center">
                          <span className={clsx(
                            "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold",
                            student.missingCount > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                          )}>
                            {student.missingCount > 0 ? `${student.missingCount} งาน` : 'ครบ'}
                          </span>
                        </td>

                        {/* Combined Attendance Pill Summary */}
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[11px]" title="มาเรียน">
                              มา {student.presentCount}
                            </span>
                            <span className={clsx("px-2 py-0.5 rounded font-bold text-[11px]", student.lateCount > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500")} title="มาสาย">
                              สาย {student.lateCount}
                            </span>
                            {(student.leaveBusinessCount > 0 || student.leaveSickCount > 0) && (
                              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[11px]" title="ลา">
                                ลา {student.leaveBusinessCount + student.leaveSickCount}
                              </span>
                            )}
                            <span className={clsx("px-2 py-0.5 rounded font-bold text-[11px]", student.absentCount > 0 ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-500")} title="ขาดเรียน">
                              ขาด {student.absentCount}
                            </span>
                          </div>
                        </td>

                        {/* 4 Score Components */}
                        <td className="px-3 py-3 text-center font-medium text-slate-600">{student.scoreTasks}</td>
                        <td className="px-3 py-3 text-center font-medium text-slate-600">{student.scoreQuizzes}</td>
                        <td className="px-3 py-3 text-center font-medium text-slate-600">{student.scoreBehavior}</td>
                        <td className="px-3 py-3 text-center font-medium text-slate-600">{student.scoreFinal}</td>

                        {/* Total Score & Grade */}
                        <td className="px-3 py-3 text-center bg-indigo-50/30">
                          <span className="font-extrabold text-indigo-700 text-sm">{student.totalScore}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                            {student.grade}
                          </span>
                        </td>

                        {/* Action Button */}
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => {
                              setSelectedStudentForModal(student);
                              setModalActiveTab('attendance');
                            }}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1 rounded-lg transition-all"
                          >
                            ดูข้อมูล
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 360-Degree Comprehensive Student Profile Modal */}
      {selectedStudentForModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md shrink-0">
                  {selectedStudentForModal.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">{selectedStudentForModal.name}</h3>
                  <p className="text-xs font-semibold text-slate-500">รหัสนักเรียน: <span className="text-slate-800 font-bold">{selectedStudentForModal.student_id}</span> | ห้องเรียน: <span className="text-slate-800 font-bold">{selectedClass}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudentForModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stat Summary Row */}
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-2xl border border-emerald-100">
                <span className="block font-semibold mb-0.5">มาเรียน</span>
                <span className="text-base font-extrabold">{selectedStudentForModal.presentCount}</span>
              </div>
              <div className="bg-amber-50 text-amber-700 p-2.5 rounded-2xl border border-amber-100">
                <span className="block font-semibold mb-0.5">มาสาย</span>
                <span className="text-base font-extrabold">{selectedStudentForModal.lateCount}</span>
              </div>
              <div className="bg-purple-50 text-purple-700 p-2.5 rounded-2xl border border-purple-100">
                <span className="block font-semibold mb-0.5">ลากิจ</span>
                <span className="text-base font-extrabold">{selectedStudentForModal.leaveBusinessCount || 0}</span>
              </div>
              <div className="bg-pink-50 text-pink-700 p-2.5 rounded-2xl border border-pink-100">
                <span className="block font-semibold mb-0.5">ลาป่วย</span>
                <span className="text-base font-extrabold">{selectedStudentForModal.leaveSickCount || 0}</span>
              </div>
              <div className="bg-rose-50 text-rose-700 p-2.5 rounded-2xl border border-rose-100">
                <span className="block font-semibold mb-0.5">ขาดเรียน</span>
                <span className="text-base font-extrabold">{selectedStudentForModal.absentCount}</span>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setModalActiveTab('attendance')}
                className={clsx(
                  "px-4 py-2.5 text-xs font-bold transition-all border-b-2",
                  modalActiveTab === 'attendance'
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                📅 ประวัติเช็คชื่อรายวัน
              </button>
              <button
                onClick={() => setModalActiveTab('tasks')}
                className={clsx(
                  "px-4 py-2.5 text-xs font-bold transition-all border-b-2",
                  modalActiveTab === 'tasks'
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                📝 รายการงานเก็บ ({selectedStudentForModal.taskDetails?.length || 0})
              </button>
              <button
                onClick={() => setModalActiveTab('grades')}
                className={clsx(
                  "px-4 py-2.5 text-xs font-bold transition-all border-b-2",
                  modalActiveTab === 'grades'
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                🏆 องค์ประกอบเกรด
              </button>
            </div>

            {/* Modal Content Panels */}
            {modalActiveTab === 'attendance' && (
              <div className="space-y-3">
                {selectedStudentForModal.attendanceDetails && selectedStudentForModal.attendanceDetails.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                    {selectedStudentForModal.attendanceDetails.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-3 text-xs hover:bg-slate-50">
                        <span className="font-bold text-slate-800">{item.date}</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                          item.status === 'มา' || item.status === 'มาเรียน' ? 'bg-emerald-100 text-emerald-700' :
                          item.status === 'สาย' ? 'bg-amber-100 text-amber-700' :
                          item.status === 'ขาด' ? 'bg-rose-100 text-rose-700' :
                          item.status.includes('ป่วย') ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-6">ไม่มีประวัติการเช็คชื่อเพิ่มเติม</p>
                )}
              </div>
            )}

            {modalActiveTab === 'tasks' && (
              <div className="space-y-3">
                {selectedStudentForModal.taskDetails && selectedStudentForModal.taskDetails.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                    {selectedStudentForModal.taskDetails.map((task: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-3 text-xs hover:bg-slate-50">
                        <span className="font-bold text-slate-800">{task.title}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-slate-900">{task.score}</span>
                          {task.isMissing ? (
                            <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">งานค้าง</span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">ส่งแล้ว</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-6">ไม่มีข้อมูลงานเก็บรายหน่วย</p>
                )}
              </div>
            )}

            {modalActiveTab === 'grades' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                  <span className="text-slate-500 font-semibold block mb-1">คะแนนงานรวม (30%)</span>
                  <span className="text-xl font-extrabold text-slate-900">{selectedStudentForModal.scoreTasks}</span>
                </div>
                <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                  <span className="text-slate-500 font-semibold block mb-1">สอบย่อย (20%)</span>
                  <span className="text-xl font-extrabold text-slate-900">{selectedStudentForModal.scoreQuizzes}</span>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                  <span className="text-slate-500 font-semibold block mb-1">จิตพิสัย (20%)</span>
                  <span className="text-xl font-extrabold text-slate-900">{selectedStudentForModal.scoreBehavior}</span>
                </div>
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <span className="text-slate-500 font-semibold block mb-1">สอบปลายภาค (30%)</span>
                  <span className="text-xl font-extrabold text-slate-900">{selectedStudentForModal.scoreFinal}</span>
                </div>
                <div className="col-span-2 bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-2xl text-white flex justify-between items-center">
                  <div>
                    <span className="text-xs text-indigo-100 block">คะแนนรวมสุทธิ</span>
                    <span className="text-2xl font-extrabold">{selectedStudentForModal.totalScore} / 100</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-indigo-100 block">เกรดที่ได้</span>
                    <span className="text-2xl font-extrabold text-amber-300">{selectedStudentForModal.grade}</span>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={() => setSelectedStudentForModal(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl transition-colors text-xs"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
