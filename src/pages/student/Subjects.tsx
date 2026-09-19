import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { BookOpen, UserCheck, AlertCircle, HelpCircle, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

const StudentSubjects: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    try {
      const data = await api.getStudentSubjects(user.id);
      setSubjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse w-full">
        <div className="h-8 bg-slate-200/60 rounded w-1/4"></div>
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100 w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full antialiased">
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/60 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">วิชาเรียน & ผลการเรียน</h1>
          <p className="text-slate-500 text-sm mt-1">สรุปการตัดเกรดแยกเป็น 4 ส่วนของทุกวิชาที่คุณลงทะเบียน</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3.5 rounded-2xl text-white shadow-sm hidden sm:block">
          <BookOpen className="w-7 h-7" />
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-xs border border-slate-200/60 text-center w-full">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">ยังไม่มีข้อมูลวิชาเรียน</h3>
          <p className="text-slate-400 text-sm">ระบบยังไม่พบรายวิชาที่ลงทะเบียนไว้</p>
        </div>
      ) : (
        <div className="space-y-6 w-full">
          {subjects.map((subj, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-3xl shadow-xs border border-slate-200/60 overflow-hidden w-full transition-shadow hover:shadow-md"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl border border-indigo-200/50 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{subj.subject_name}</h2>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span>ครูผู้สอน: {subj.teacher_name}</span>
                      <span className="text-slate-300">|</span>
                      <span>รหัสวิชา: {subj.subject_id}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!subj.is_published ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      <span>รอครูอนุมัติคะแนน</span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-2xl border border-slate-200/60 shadow-xs">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block">คะแนนรวม</span>
                        <span className="text-xl font-extrabold text-slate-900">{subj.total_score}</span>
                      </div>
                      <div className="h-7 w-px bg-slate-200"></div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block">เกรดที่ได้</span>
                        <span className="text-xl font-extrabold text-indigo-600">{subj.grade}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Component Body */}
              <div className="p-6">
                {!subj.is_published ? (
                  <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-700">คะแนนวิชานี้ยังไม่ถูกเผยแพร่</h4>
                    <p className="text-xs text-slate-400">คุณครูผู้สอนจะทำการอนุมัติและประกาศเกรดในเร็วๆ นี้</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">องค์ประกอบคะแนน 4 ส่วน</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Component 1: Tasks 30% */}
                      <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/60 flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-semibold text-indigo-600 block mb-1">คะแนนงานรวม (30%)</span>
                          <span className="text-2xl font-extrabold text-slate-900">{subj.score_tasks}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-indigo-100/40">
                          <span>เต็ม 30</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                      </div>

                      {/* Component 2: Quizzes 20% */}
                      <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-100/60 flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-semibold text-purple-600 block mb-1">สอบย่อย (20%)</span>
                          <span className="text-2xl font-extrabold text-slate-900">{subj.score_quizzes}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-purple-100/40">
                          <span>เต็ม 20</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                      </div>

                      {/* Component 3: Behavior 20% */}
                      <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/60 flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-semibold text-emerald-600 block mb-1">จิตพิสัย (20%)</span>
                          <span className="text-2xl font-extrabold text-slate-900">{subj.score_behavior}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-emerald-100/40">
                          <span>เต็ม 20</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                      </div>

                      {/* Component 4: Final Exam 30% */}
                      <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100/60 flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-semibold text-blue-600 block mb-1">สอบปลายภาค (30%)</span>
                          <span className="text-2xl font-extrabold text-slate-900">{subj.score_final}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-blue-100/40">
                          <span>เต็ม 30</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentSubjects;
