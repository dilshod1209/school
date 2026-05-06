import { useState, useEffect } from 'react';
import { db, collection, getDocs, addDoc, serverTimestamp } from '../../lib/firebase';
import { Payment, Student, Group, Enrollment } from '../../types';
import { CreditCard, Plus, Search, AlertCircle, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'debtors'>('history');

  const [formData, setFormData] = useState({
    studentId: '',
    groupId: '',
    amount: 0,
    month: format(new Date(), 'yyyy-MM')
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [paymentsSnap, studentsSnap, groupsSnap] = await Promise.all([
        getDocs(collection(db, 'payments')),
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'groups'))
      ]);

      const pList = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Payment[];
      const sList = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Student[];
      const gList = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Group[];

      // Fetch enrollments for each group
      const allEnrollments: Enrollment[] = [];
      for (const group of gList) {
        const eSnap = await getDocs(collection(db, `groups/${group.id}/enrollments`));
        allEnrollments.push(...eSnap.docs.map(d => d.data() as Enrollment));
      }

      setPayments(pList.sort((a, b) => b.date.seconds - a.date.seconds));
      setStudents(sList);
      setGroups(gList);
      setEnrollments(allEnrollments);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!formData.studentId || !formData.groupId || formData.amount <= 0) {
        alert("Barcha maydonlarni to'ldiring");
        return;
      }
      await addDoc(collection(db, 'payments'), {
        ...formData,
        date: serverTimestamp()
      });
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert((error as Error).message);
    }
  }

  const currentMonth = format(new Date(), 'yyyy-MM');
  
  // Calculate Debtors
  const debtors = enrollments.filter(enrollment => {
    // Check if student has paid for this group for current month
    const hasPaid = payments.some(p => 
      p.studentId === enrollment.studentId && 
      p.groupId === enrollment.groupId && 
      p.month === currentMonth
    );
    return !hasPaid;
  });

  const totalMonthlyIncome = payments
    .filter(p => p.month === currentMonth)
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Joriy oy tushumi</p>
              <h3 className="text-2xl font-bold">{totalMonthlyIncome.toLocaleString()} so'm</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Qarzdorlar soni</p>
              <h3 className="text-2xl font-bold">{debtors.length} talaba</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-6 py-4 font-medium text-sm transition-all border-b-2",
              activeTab === 'history' ? "border-indigo-600 text-indigo-600 bg-indigo-50/10" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            To'lovlar tarixi
          </button>
          <button 
            onClick={() => setActiveTab('debtors')}
            className={cn(
              "px-6 py-4 font-medium text-sm transition-all border-b-2",
              activeTab === 'debtors' ? "border-indigo-600 text-indigo-600 bg-indigo-50/10" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            Qarzdorlar (Bu oy uchun)
          </button>
        </div>

        <div className="p-4 flex justify-between items-center bg-gray-50/50">
          <h4 className="font-bold text-slate-900">
            {activeTab === 'history' ? 'Oxirgi to\'lovlar' : 'To\'lov qilmaganlar'}
          </h4>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={18} />
            To'lov qo'shish
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'history' ? (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-y border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Talaba</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Guruh</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Vaqti</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Miqdor</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Oy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map(p => {
                  const student = students.find(s => s.id === p.studentId);
                  const group = groups.find(g => g.id === p.groupId);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{student?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{group?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{format(p.date.toDate(), 'dd.MM.yyyy HH:mm')}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">{p.amount.toLocaleString()} so'm</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">{p.month}</span>
                      </td>
                    </tr>
                  );
                })}
                {payments.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">To'lovlar mavjud emas</td></tr>}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-y border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Talaba</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Guruh</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Narx</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {debtors.map((d, i) => {
                  const student = students.find(s => s.id === d.studentId);
                  const group = groups.find(g => g.id === d.groupId);
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{student?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{group?.name}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{group?.price.toLocaleString()} so'm</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                          <AlertCircle size={12} />
                          To'lanmagan
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button 
                          onClick={() => {
                            setFormData({
                              studentId: d.studentId,
                              groupId: d.groupId,
                              amount: group?.price || 0,
                              month: currentMonth
                            });
                            setShowModal(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium cursor-pointer"
                        >
                           To'lov olindi
                         </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                   <CreditCard className="text-indigo-600" />
                   Yangi to'lov qo'shish
                </h3>
                <form onSubmit={handleAddPayment} className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium mb-1">Guruh tanlang</label>
                     <select 
                      className="w-full p-2.5 border rounded-xl"
                      value={formData.groupId}
                      onChange={(e) => {
                        const gid = e.target.value;
                        const group = groups.find(g => g.id === gid);
                        setFormData({...formData, groupId: gid, amount: group?.price || 0});
                      }}
                     >
                       <option value="">Guruh...</option>
                       {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.subject})</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium mb-1">Talaba tanlang</label>
                     <select 
                      disabled={!formData.groupId}
                      className="w-full p-2.5 border rounded-xl disabled:bg-gray-50"
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                     >
                       <option value="">Talaba...</option>
                       {enrollments
                         .filter(e => e.groupId === formData.groupId)
                         .map(e => {
                           const s = students.find(s => s.id === e.studentId);
                           return <option key={e.studentId} value={e.studentId}>{s?.name}</option>;
                         })
                       }
                     </select>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Summa (so'm)</label>
                        <input 
                          type="number"
                          className="w-full p-2.5 border rounded-xl"
                          value={formData.amount}
                          onChange={(e) => setFormData({...formData, amount: +e.target.value})}
                        />
                      </div>
                      <div>
                         <label className="block text-sm font-medium mb-1 text-gray-700">Qaysi oy uchun</label>
                         <input 
                          type="month"
                          className="w-full p-2.5 border rounded-xl"
                          value={formData.month}
                          onChange={(e) => setFormData({...formData, month: e.target.value})}
                        />
                      </div>
                   </div>

                   <div className="flex gap-3 pt-4">
                     <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-500 cursor-pointer">Bekor qilish</button>
                     <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:translate-y-[-1px] active:translate-y-0 transition-all cursor-pointer">
                        To'lovni tasdiqlash
                     </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
