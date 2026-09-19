import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Award, BookOpen, CheckCircle2, HelpCircle } from 'lucide-react';

const StudentQuizzes: React.FC = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    try {
      const data = await api.getStudentQuizzes(user.id);
      setQuizzes(data);
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
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="h-56 bg-white rounded-2xl border border-gray-100 w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">คะแนนสอบย่อย</h1>
          <p className="text-gray-500 text-sm mt-1">สรุปคะแนนสอบย่อยรายหน่วย (คิดเป็น 20% ของวิชา)</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3.5 rounded-2xl text-white shadow-sm hidden sm:block">
          <Award className="w-7 h-7" />
        </div>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-xs border border-gray-100 text-center w-full">
          <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-700 mb-1">ยังไม่มีข้อมูลคะแนนสอบย่อย</h3>
          <p className="text-gray-400 text-sm">เมื่อครูผู้สอนบันทึกคะแนนสอบย่อย ข้อมูลจะอัปเดตอัตโนมัติ</p>
        </div>
      ) : (
        <div className="space-y-6 w-full">
          {quizzes.map((subj, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden w-full transition-shadow hover:shadow-md">
              <div className="p-6 border-b border-gray-100 bg-gray-50/60 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{subj.subject_name}</h2>
                    <p className="text-xs text-gray-500">ครูผู้สอน: {subj.teacher_name}</p>
                  </div>
                </div>
                <div className="text-right bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-400 block font-medium">คะแนนรวม 20%</span>
                  <span className="text-2xl font-extrabold text-purple-600">{subj.weightedScore}</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">คะแนนรายหน่วย</h3>
                {subj.units && subj.units.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 w-full">
                    {subj.units.map((unit: any, uIdx: number) => (
                      <div key={uIdx} className="bg-purple-50/40 hover:bg-purple-50 p-4 rounded-xl border border-purple-100/50 transition-colors flex flex-col justify-between">
                        <span className="text-xs text-gray-600 font-medium truncate mb-3">{unit.title}</span>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-extrabold text-gray-900">{unit.score}</span>
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic py-2">ยังไม่มีข้อมูลรายหน่วย</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentQuizzes;
