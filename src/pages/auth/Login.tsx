import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { CustomSelect } from '../../components/common/CustomSelect';
import { BookOpen, UserCheck, ArrowRight, UserCog, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjectsList, setSubjectsList] = useState<string[]>([]);
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [teacherPassword, setTeacherPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const list = await api.getAvailableSubjectsForLogin();
        setSubjectsList(list);
        if (list.length > 0) {
          setSelectedSubject(list[0]);
        }
      } catch (err) {
        console.error('Failed to load subjects for login dropdown', err);
      }
    };

    loadSubjects();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isTeacherMode) {
        await login('teacher1', teacherPassword);
      } else {
        await login(studentId, selectedSubject);
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 p-4 relative overflow-hidden antialiased">
      {/* Soft Ambient Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white/80 p-8 sm:p-10 relative z-10 transition-all">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-24 h-24 mb-4 drop-shadow-md transition-transform hover:scale-105 p-1 rounded-2xl bg-white border border-slate-100 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain rounded-xl" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">ระบบติดตามผลการเรียนรายบุคคล</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {isTeacherMode ? 'เข้าสู่ระบบสำหรับคุณครูผู้สอน' : 'เลือกวิชาเรียนและกรอกรหัสประจำตัวเพื่อดูผลการเรียน'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-xs font-semibold mb-6 flex items-center gap-2.5 shadow-xs">
            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></div>
            {error}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          {!isTeacherMode ? (
            <>
              {/* Subject Selection Custom Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  เลือกวิชาเรียน
                </label>
                <CustomSelect
                  options={subjectsList}
                  value={selectedSubject}
                  onChange={(val) => setSelectedSubject(val)}
                  placeholder="-- เลือกวิชาเรียน --"
                  icon={<BookOpen className="w-4 h-4 text-indigo-500" />}
                />
              </div>

              {/* Student ID Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  รหัสประจำตัวนักเรียน
                </label>
                <div className="relative">
                  <UserCheck className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                    placeholder="กรอกรหัสนักเรียน เช่น 69001"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-center space-y-1">
                <UserCog className="w-7 h-7 text-indigo-600 mx-auto" />
                <p className="text-xs font-bold text-indigo-900">โหมดคุณครูผู้สอน</p>
                <p className="text-[11px] text-slate-500">กรอกรหัสผ่านเพื่อเข้าสู่แผงควบคุมระบบ</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  รหัสผ่านครูผู้สอน
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400"
                    placeholder="กรอกรหัสผ่านครูผู้สอน"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-indigo-200/70 active:scale-[0.99] disabled:opacity-70 flex justify-center items-center gap-2 group text-sm"
          >
            {loading ? (
              <span>กำลังตรวจสอบข้อมูล...</span>
            ) : (
              <>
                <span>{isTeacherMode ? 'เข้าสู่ระบบครูผู้สอน' : 'เข้าสู่ระบบ'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode for Teacher */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsTeacherMode(!isTeacherMode);
              setError('');
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors underline underline-offset-4"
          >
            {isTeacherMode ? '← กลับสู่หน้าเข้าสู่ระบบสำหรับนักเรียน' : 'เข้าสู่ระบบสำหรับคุณครูผู้สอน'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
