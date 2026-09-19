import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Book, Clock, AlertCircle, CheckCircle, CalendarX, UserMinus, Calendar, Filter, Sparkles } from 'lucide-react';
import clsx from 'clsx';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ทั้งหมด');

  useEffect(() => {
    let intervalId: number;

    const fetchData = async (isBackground = false) => {
      try {
        if (user) {
          if (!isBackground) setLoading(true);
          const result = await api.getStudentDashboard(user.id);
          setData(result);
        }
      } catch (err) {
        if (!isBackground) setError('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        if (!isBackground) setLoading(false);
      }
    };
    
    fetchData();

    // Poll every 10 seconds for real-time updates
    intervalId = window.setInterval(() => {
      fetchData(true);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200/60 rounded-3xl w-full"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100"></div>)}
        </div>
      </div>
    );
  }

  if (error) return <div className="text-rose-600 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm font-semibold">{error}</div>;
  if (!data) return null;

  const stats = data.stats || {};
  const studentName = data.name || user?.name || '';
  const studentClass = data.class || '-';

  const statCards = [
    { title: 'วิชาที่เรียน', value: stats.enrolledSubjects || 0, icon: Book, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
    { title: 'งานค้าง', value: stats.missingAssignments || 0, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    { title: 'มาเรียน', value: stats.attendanceRate || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    { title: 'มาสาย', value: stats.lateCount || 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
    { title: 'ลากิจ', value: stats.leaveBusinessCount || 0, icon: UserMinus, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
    { title: 'ลาป่วย', value: stats.leaveSickCount || 0, icon: UserMinus, color: 'text-pink-600', bg: 'bg-pink-50 border-pink-100' },
    { title: 'ขาดเรียน', value: stats.absentCount || 0, icon: CalendarX, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
  ];

  const attendanceDetails = data.attendanceDetails || [];

  const filteredAttendance = attendanceDetails.filter((item: any) => {
    if (!item || !item.status) return false;
    const st = String(item.status).trim();
    if (selectedStatusFilter === 'ทั้งหมด') return true;
    if (selectedStatusFilter === 'ขาดเรียน') return st === 'ขาด';
    if (selectedStatusFilter === 'มาสาย') return st === 'สาย';
    if (selectedStatusFilter === 'มาเรียน') return st === 'มา' || st === 'มาเรียน';
    if (selectedStatusFilter === 'ลากิจ') return st.includes('ลากิจ');
    if (selectedStatusFilter === 'ลาป่วย') return st.includes('ป่วย');
    return st === selectedStatusFilter;
  });

  const getStatusBadge = (rawStatus: any) => {
    const status = String(rawStatus || '').trim();
    if (status === 'มา' || status === 'มาเรียน') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/70 text-emerald-700 border border-emerald-200/50">มาเรียน</span>;
    }
    if (status === 'สาย') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100/70 text-amber-700 border border-amber-200/50">มาสาย</span>;
    }
    if (status === 'ขาด') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100/70 text-rose-700 border border-rose-200/50">ขาดเรียน</span>;
    }
    if (status.includes('ป่วย')) {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-100/70 text-pink-700 border border-pink-200/50">ลาป่วย</span>;
    }
    if (status.includes('ลา')) {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100/70 text-purple-700 border border-purple-200/50">ลากิจ</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{status || '-'}</span>;
  };

  const statusFilters = ['ทั้งหมด', 'ขาดเรียน', 'มาสาย', 'ลากิจ', 'ลาป่วย', 'มาเรียน'];

  return (
    <div className="space-y-6 antialiased">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>แผงควบคุมนักเรียน</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">สวัสดี, {studentName} 👋</h1>
            <p className="text-sm font-medium text-indigo-200/80 mt-1.5">
              รหัสนักเรียน: <span className="text-white font-bold">{user?.id}</span> | ห้องเรียน: <span className="text-white font-bold">{studentClass}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3.5">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white p-3.5 sm:p-5 rounded-2xl shadow-xs border border-slate-200/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className={clsx("w-8 h-8 sm:w-9 sm:h-9 rounded-xl p-1.5 sm:p-2 flex items-center justify-center mb-2.5 sm:mb-3 border", stat.bg)}>
              <stat.icon className={clsx("w-4 h-4 sm:w-5 sm:h-5", stat.color)} />
            </div>
            <div>
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 block">{stat.title}</span>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance History Section */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/60 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-600 border border-indigo-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">ประวัติการเข้าเรียนรายวัน</h2>
              <p className="text-xs font-medium text-slate-500">เรียกดูวันขาดเรียน มาสาย หรือลากิจ/ป่วย ของทุกวิชา</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1 hidden sm:block" />
            {statusFilters.map(filterName => (
              <button
                key={filterName}
                onClick={() => setSelectedStatusFilter(filterName)}
                className={clsx(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0",
                  selectedStatusFilter === filterName
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/70"
                )}
              >
                {filterName}
              </button>
            ))}
          </div>
        </div>

        {filteredAttendance.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm font-medium">
            ไม่พบประวัติการเข้าเรียนตามเงื่อนไขที่เลือก
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70 border-b border-slate-100">
                  <th className="px-5 py-3.5 rounded-l-2xl">วันที่</th>
                  <th className="px-5 py-3.5">วิชาเรียน</th>
                  <th className="px-5 py-3.5 text-right rounded-r-2xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAttendance.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800">{item.date}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{item.subject}</td>
                    <td className="px-5 py-3.5 text-right">{getStatusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
