import React from 'react';
import { BookOpen, CheckCircle, Info } from 'lucide-react';

const AdminPage: React.FC = () => {
  return (
    <div className="space-y-6 w-full max-w-full antialiased">
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/60 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">การตั้งค่าการเผยแพร่คะแนน</h1>
          <p className="text-slate-500 text-sm mt-1">คำแนะนำการเปิด-ปิด เผยแพร่ผลการเรียนแก่นักเรียน</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xs border border-slate-200/60 space-y-6">
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
          <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-2xl text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">ควบคุมการเผยแพร่ผลการเรียนผ่าน Google Sheets</h2>
            <p className="text-xs text-slate-500">จัดการเปิดหรือปิดซ่อนคะแนนรายวิชาจากไฟล์ชีตหลักได้ทันที</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-emerald-50/60 border border-emerald-100 p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>วิธีเปิดให้นักเรียนเห็นคะแนน (เผยแพร่):</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              เข้าไปที่ Google Sheets แท็บ <span className="font-bold text-slate-900">"รวมรายวิชา"</span> ในคอลัมน์ <span className="font-bold text-indigo-600">"สถานะ"</span> ของวิชานั้นๆ ให้พิมพ์คำว่า <span className="font-bold text-emerald-700">"เผยแพร่"</span> หรือ <span className="font-bold text-emerald-700">"ประกาศแล้ว"</span>
            </p>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <Info className="w-4 h-4 text-amber-600" />
              <span>วิธีปิดซ่อนคะแนน (รออนุมัติ):</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              หากต้องการซ่อนคะแนนวิชานั้นชั่วคราว ให้ลบคำว่าเผยแพร่ออก หรือพิมพ์คำว่า <span className="font-bold text-amber-700">"ปิด"</span> หรือ <span className="font-bold text-amber-700">"รอประกาศ"</span> แทน ระบบจะทำการซ่อนคะแนนและเกรดของวิชานั้นจากนักเรียนทันที
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
