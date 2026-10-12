import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BookOpen, CheckCircle, Info, ExternalLink, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

const MASTER_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1-812_fXKZEg3L9SVsi6zx57q5-H6sVRnE5zxKuGrNp0/edit?usp=sharing';

const AdminPage: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getMasterSettings();
      setSubjects(data);
    } catch (err) {
      console.error('Failed to load master settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const isPublished = (status: any) => {
    const s = String(status || '').trim().toLowerCase();
    return s === 'เปิด' || s === 'เผยแพร่' || s === 'ประกาศแล้ว';
  };

  return (
    <div className="space-y-6 w-full max-w-full antialiased">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการระบบ & เปิด-ปิดคะแนน</h1>
          <p className="text-slate-500 text-sm mt-1">ควบคุมสถานะการเผยแพร่ผลการเรียนและรายวิชาจากชีตศูนย์กลาง</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={clsx("w-5 h-5", loading && "animate-spin")} />
          </button>

          <a
            href={MASTER_SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3 px-5 rounded-2xl text-xs shadow-md shadow-indigo-200/50 transition-all hover:scale-[1.02] active:scale-[0.99]"
          >
            <ExternalLink className="w-4 h-4" />
            <span>เปิดชีตจัดการระบบ (Google Sheets)</span>
          </a>
        </div>
      </div>

      {/* Live Status Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/60 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-2xl text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">สถานะปัจจุบันของแต่ละวิชา (Real-time)</h2>
              <p className="text-xs text-slate-500">ดึงข้อมูลสดจากชีตจัดการระบบส่วนกลาง</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[11px] font-bold">
                <th className="px-6 py-4">รหัสวิชา</th>
                <th className="px-6 py-4">ชื่อรายวิชา</th>
                <th className="px-6 py-4 text-center">รหัสห้อง</th>
                <th className="px-6 py-4 text-center">ห้องเรียน</th>
                <th className="px-6 py-4">ครูผู้สอน</th>
                <th className="px-6 py-4 text-center">สถานะการแสดงผลคะแนน</th>
                <th className="px-6 py-4 text-right">ชีตคะแนน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-medium">
                    กำลังโหลดข้อมูลจากชีตจัดการระบบ...
                  </td>
                </tr>
              ) : (
                subjects.map((subj, idx) => {
                  const published = isPublished(subj['สถานะ']);
                  const sheetLink = subj['ลิงก์ชีตคะแนน'] || subj['Link'] || '';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-500">{subj['รหัสรายวิชา'] || '-'}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{subj['ชื่อรายวิชา'] || '-'}</td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-600">{subj['รหัสห้องเรียน'] || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
                          {subj['ห้องเรียน'] || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{subj['ครูผู้สอน'] || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        {published ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span>เปิดเผยแพร่แล้ว (นักเรียนดูคะแนนได้)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <ShieldAlert className="w-4 h-4 text-amber-500" />
                            <span>ปิดซ่อนคะแนน (รออนุมัติ)</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {sheetLink ? (
                          <a
                            href={sheetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold underline text-xs"
                          >
                            <span>เปิดชีต</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="bg-white p-8 rounded-3xl shadow-xs border border-slate-200/60 space-y-6">
        <h2 className="text-lg font-bold text-slate-900">วิธีเปิด-ปิด คะแนนผ่าน Google Sheets ส่วนกลาง</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-emerald-50/60 border border-emerald-100 p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>วิธีเปิดให้นักเรียนเห็นคะแนน:</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              เข้าไปที่ Google Sheets ชีตจัดการระบบ ในคอลัมน์ <span className="font-bold text-indigo-600">"สถานะ"</span> ของวิชานั้นๆ ให้พิมพ์คำว่า <span className="font-bold text-emerald-700">"เปิด"</span> หรือ <span className="font-bold text-emerald-700">"เผยแพร่"</span>
            </p>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <Info className="w-4 h-4 text-amber-600" />
              <span>วิธีปิดซ่อนคะแนน:</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              หากต้องการซ่อนคะแนนวิชานั้นชั่วคราว ให้พิมพ์คำว่า <span className="font-bold text-amber-700">"ปิด"</span> หรือ <span className="font-bold text-amber-700">"ซ่อน"</span> ระบบจะทำการซ่อนคะแนนและเกรดของวิชานั้นจากนักเรียนทันที
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
