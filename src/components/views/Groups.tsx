import { useState, useEffect, type FormEvent } from 'react';
import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, query, where, serverTimestamp } from '../../lib/firebase';
import { Group, Teacher, Student, Enrollment } from '../../types';
import { Plus, Clock, Users, BookOpen, X, Edit2, Trash2, UserPlus, CheckCircle2, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEnrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    teacherId: '',
    startTime: '',
    days: [] as string[],
    price: 0
  });

  const weekDays = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [groupsSnap, teachersSnap, studentsSnap, enrollmentsSnap] = await Promise.all([
        getDocs(collection(db, 'groups')),
        getDocs(collection(db, 'teachers')),
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'payments')) // Just to load something for now, actually need total enrollments
      ]);

      setGroups(groupsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Group[]);
      setTeachers(teachersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Teacher[]);
      setStudents(studentsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Student[]);
      
      // Load all enrollments
      const allEnrollments: Enrollment[] = [];
      for (const groupDoc of groupsSnap.docs) {
        const eSnap = await getDocs(collection(db, `groups/${groupDoc.id}/enrollments`));
        allEnrollments.push(...eSnap.docs.map(d => d.data() as Enrollment));
      }
      setEnrollments(allEnrollments);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (selectedGroup) {
        await updateDoc(doc(db, 'groups', selectedGroup.id), formData);
      } else {
        await addDoc(collection(db, 'groups'), formData);
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
       alert((error as Error).message);
    }
  }

  async function handleEnroll(studentId: string) {
    if (!selectedGroup) return;
    try {
      const enrollmentDoc = doc(db, `groups/${selectedGroup.id}/enrollments`, studentId);
      await setDoc(enrollmentDoc, {
        studentId,
        groupId: selectedGroup.id,
        joinedAt: serverTimestamp()
      });
      fetchData();
    } catch (error) {
      alert((error as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => {
            setSelectedGroup(null);
            setFormData({ name: '', subject: '', teacherId: '', startTime: '', days: [], price: 0 });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium cursor-pointer"
        >
          <Plus size={20} />
          Yangi guruh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-400">Yuklanmoqda...</div>
        ) : groups.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400">Guruhlar mavjud emas</div>
        ) : groups.map((group) => {
          const teacher = teachers.find(t => t.id === group.teacherId);
          const studentCount = enrollments.filter(e => e.groupId === group.id).length;

          return (
            <motion.div 
              key={group.id}
              layoutId={group.id}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <BookOpen size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setSelectedGroup(group);
                      setFormData(group);
                      setModalOpen(true);
                    }}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={async () => {
                      if (confirm("Guruhni o'chirmoqchimisiz?")) {
                        await deleteDoc(doc(db, 'groups', group.id));
                        fetchData();
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-1">{group.name}</h3>
              <p className="text-sm text-indigo-600 font-medium mb-4">{group.subject}</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock size={16} className="text-gray-400" />
                  <span>{group.startTime} • {group.days.join(', ')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Users size={16} className="text-gray-400" />
                  <span>{studentCount} talaba</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <GraduationCap size={16} className="text-gray-400" />
                  <span>{teacher?.name || 'O\'qituvchi topilmadi'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                <span className="text-lg font-bold text-slate-900">{group.price.toLocaleString()} so'm</span>
                <button 
                  onClick={() => {
                    setSelectedGroup(group);
                    setEnrollModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                >
                  <UserPlus size={16} />
                  Qo'shish
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Group Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden p-6">
              <h3 className="text-xl font-bold mb-6">{selectedGroup ? 'Guruhni tahrirlash' : 'Yangi guruh'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4 font-sans">
                <div>
                  <label className="block text-sm font-medium mb-1">Guruh nomi</label>
                  <input required className="w-full px-4 py-2 border rounded-xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Fan</label>
                    <input required className="w-full px-4 py-2 border rounded-xl" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">O'qituvchi</label>
                    <select required className="w-full px-4 py-2 border rounded-xl" value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})}>
                      <option value="">Tanlang</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Boshlanish vaqti</label>
                    <input required type="time" className="w-full px-4 py-2 border rounded-xl" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Narxi</label>
                    <input required type="number" className="w-full px-4 py-2 border rounded-xl" value={formData.price} onChange={e => setFormData({...formData, price: +e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Kunlar</label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const days = formData.days.includes(day) ? formData.days.filter(d => d !== day) : [...formData.days, day];
                          setFormData({...formData, days});
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm transition-all cursor-pointer",
                          formData.days.includes(day) ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 border rounded-xl cursor-not-allowed">Bekor qilish</button>
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-medium cursor-pointer">Saqlash</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Enroll Modal */}
      <AnimatePresence>
        {isEnrollModalOpen && selectedGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEnrollModalOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
               <div className="p-6 border-b border-gray-100">
                 <h3 className="text-xl font-bold">Talaba qo'shish</h3>
                 <p className="text-sm text-gray-500">{selectedGroup.name} guruhiga</p>
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-2">
                 {students.map(student => {
                   const isEnrolled = enrollments.some(e => e.studentId === student.id && e.groupId === selectedGroup.id);
                   return (
                     <div key={student.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                       <span className="font-medium text-slate-900">{student.name}</span>
                       <button
                         disabled={isEnrolled}
                         onClick={() => handleEnroll(student.id)}
                         className={cn(
                           "p-2 rounded-lg transition-all",
                           isEnrolled ? "text-emerald-500" : "text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                         )}
                       >
                         {isEnrolled ? <CheckCircle2 /> : <UserPlus />}
                       </button>
                     </div>
                   );
                 })}
               </div>
               <div className="p-6 border-t border-gray-100">
                 <button onClick={() => setEnrollModalOpen(false)} className="w-full py-2 bg-gray-100 rounded-xl font-medium cursor-pointer">Yopish</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
