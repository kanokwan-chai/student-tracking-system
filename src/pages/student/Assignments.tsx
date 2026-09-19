import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ClipboardList, CheckCircle2, AlertCircle, Filter, HelpCircle, BookOpen } from 'lucide-react';
import clsx from 'clsx';

const StudentAssignments: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'missing' | 'submitted'>('all');

  const loadData = async () => {
    if (!user) return;
    try {
      const data = await api.getStudentAssignments(user.id);
      setAssignments(data);
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

  const filteredAssignments = assignments.filter((item) => {
    if (filter === 'missing') return item.status === 'missing';
    if (filter === 'submitted') return item.status === 'submitted';
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse w-full">
        <div className="h-8 bg-slate-200/60 rounded w-1/4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full antialiased">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/60 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">งานของฉัน</h1>
          <p className="text-slate-500 text-sm mt-1">รายการภาระงานและคะแนนเก็บรายหน่วยทุกรายวิชา</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3.5 rounded-2xl text-white shadow-sm hidden sm:block">
          <ClipboardList className="w-7 h-7" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1 hidden sm:block" />
        <button
          onClick={() => setFilter('all')}
          className={clsx(
            "px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap",
            filter === 'all'
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
          )}
        >
          ทั้งหมด ({assignments.length})
        </button>
        <button
          onClick={() => setFilter('missing')}
          className={clsx(
            "px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap",
            filter === 'missing'
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
          )}
        >
          งานค้าง ({assignments.filter(a => a.status === 'missing').length})
        </button>
        <button
          onClick={() => setFilter('submitted')}
          className={clsx(
            "px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap",
            filter === 'submitted'
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
          )}
        >
          ส่งแล้ว ({assignments.filter(a => a.status === 'submitted').length})
        </button>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-xs border border-slate-200/60 text-center w-full">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">ไม่พบรายการงาน</h3>
          <p className="text-slate-400 text-sm">ไม่มีงานที่ตรงตามเงื่อนไขที่เลือกในขณะนี้</p>
        </div>
      ) : (
        <div className="space-y-3.5 w-full">
          {filteredAssignments.map((item) => (
            <div
              key={item.assignment_id}
              className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/60 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className={clsx(
                  "p-2.5 rounded-xl shrink-0 mt-0.5",
                  item.status === 'missing' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                )}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-600 block mb-0.5">{item.subject}</span>
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">คะแนนที่ได้</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {item.score !== null ? `${item.score} / ${item.max_score}` : `- / ${item.max_score}`}
                  </span>
                </div>

                <div>
                  {item.status === 'missing' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>งานค้าง</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>ส่งแล้ว</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
