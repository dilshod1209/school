import { useState, useEffect } from 'react';
import { db, collection, getDocs, setDoc, doc, getDoc } from '../../lib/firebase';
import { Group, Student, Enrollment, Attendance as AttendanceType } from '../../types';
import { Calendar, CheckCircle2, ChevronRight, Users, Info } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export default function Attendance() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendedIds, setAttendedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [groupsSnap, studentsSnap] = await Promise.all([
        getDocs(collection(db, 'groups')),
        getDocs(collection(db, 'students'))
      ]);
      setGroups(groupsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Group[]);
      setStudents(studentsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Student[]);

      // For simplicity, we'll fetch enrollments when group is selected
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupEnrollments();
      fetchExistingAttendance();
    }
  }, [selectedGroup, date]);

  async function fetchGroupEnrollments() {
    if (!selectedGroup) return;
    try {
      const snap = await getDocs(collection(db, `groups/${selectedGroup.id}/enrollments`));
      setEnrollments(snap.docs.map(d => d.data() as Enrollment));
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchExistingAttendance() {
    if (!selectedGroup || !date) return;
    try {
      const docSnap = await getDoc(doc(db, `groups/${selectedGroup.id}/attendance`, date));
      if (docSnap.exists()) {
        setAttendedIds((docSnap.data() as AttendanceType).attendedIds);
      } else {
        setAttendedIds([]);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handleToggle(studentId: string) {
    setAttendedIds(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  }

  async function handleSave() {
    if (!selectedGroup || !date) return;
    setSaving(true);
    try {
      await setDoc(doc(db, `groups/${selectedGroup.id}/attendance`, date), {
        date,
        attendedIds
      });
      alert("Davomat saqlandi");
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const groupStudents = students.filter(s => enrollments.some(e => e.studentId === s.id));

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Group Selector */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
             <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                Guruhni tanlang
             </h3>
             <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
               {groups.map(group => (
                 <button
                   key={group.id}
                   onClick={() => setSelectedGroup(group)}
                   className={cn(
                     "w-full flex items-center justify-between p-3 rounded-xl transition-all text-left",
                     selectedGroup?.id === group.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                   )}
                 >
                   <div className="overflow-hidden">
                     <p className="font-bold truncate text-sm">{group.name}</p>
                     <p className={cn("text-xs", selectedGroup?.id === group.id ? "text-indigo-100" : "text-gray-500")}>{group.subject}</p>
                   </div>
                   <ChevronRight size={16} />
                 </button>
               ))}
             </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="flex-1">
          {selectedGroup ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold">{selectedGroup.name}</h3>
                  <p className="text-sm text-gray-500">Davomat tizimi</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="relative">
                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                     <input 
                      type="date"
                      className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-sm"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                   </div>
                   <button 
                    disabled={saving}
                    onClick={handleSave}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
                   >
                     {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                   </button>
                </div>
              </div>

              <div className="p-6 bg-amber-50 mx-6 mt-6 rounded-xl border border-amber-100 flex gap-3 text-amber-800 text-sm">
                <Info size={18} className="shrink-0" />
                <p>Talaba darsda qatnashgan bo'lsa, uning ismi yonidagi katakchani belgilang.</p>
              </div>

              <div className="p-6">
                <div className="space-y-2">
                   {groupStudents.length === 0 ? (
                     <div className="py-12 text-center text-gray-400">Bu guruhda talabalar mavjud emas</div>
                   ) : groupStudents.map(student => (
                     <div 
                      key={student.id} 
                      onClick={() => handleToggle(student.id)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group",
                        attendedIds.includes(student.id) ? "border-emerald-200 bg-emerald-50/30" : "border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/10"
                      )}
                    >
                       <div className="flex items-center gap-4">
                         <div className={cn(
                           "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                           attendedIds.includes(student.id) ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                         )}>
                            {student.name.charAt(0)}
                         </div>
                         <div>
                           <p className="font-bold text-slate-900">{student.name}</p>
                           <p className="text-xs text-gray-500">{student.phone}</p>
                         </div>
                       </div>
                       <div className={cn(
                         "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                         attendedIds.includes(student.id) ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-200 text-transparent"
                       )}>
                         <CheckCircle2 size={16} />
                       </div>
                     </div>
                   ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <Calendar size={32} />
               </div>
               <h3 className="text-lg font-bold text-slate-900 mb-1">Davomatni boshlash</h3>
               <p className="text-gray-500 max-w-xs mx-auto">Talabalar darsga kelgan-kelmaganligini belgilash uchun chap tomondan guruhni tanlang.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
