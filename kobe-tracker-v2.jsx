import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    CheckCircle2,
    Circle,
    Calendar,
    ShieldCheck,
    BadgeDollarSign,
    Baby,
    Search,
    Info,
    Clock,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    FileText,
    Wallet,
    X
} from 'lucide-react';

const VACCINE_DATA = [
    {
        id: 1, date: '2026-03-26', age: '1 tháng 29 ngày', name: 'Infanrix Hexa (6 trong 1) — Mũi 1', origin: 'Bỉ', disease:
            'Bạch hầu, Ho gà, Uốn ván, Bại liệt, Viêm gan B, Hib', price: 1098000, milestone: 'MỐC 2 THÁNG TUỔI'
    },
    { id: 2, date: '2026-04-02', age: '2 tháng 6 ngày', name: 'Rotateq — Liều uống 1', origin: 'Mỹ', disease: 'Tiêu chảy cấp do Rotavirus', price: 665000, milestone: 'MỐC 2 THÁNG TUỔI' },
    { id: 3, date: '2026-04-09', age: '2 tháng 13 ngày', name: 'Prevenar 13 (Phế cầu) — Mũi 1', origin: 'Bỉ', disease: 'Viêm phổi, Viêm màng não, Viêm tai giữa do phế cầu', price: 1190000, milestone: 'MỐC 2 THÁNG TUỔI' },
    { id: 4, date: '2026-04-16', age: '2 tháng 20 ngày', name: 'Bexsero (Não mô cầu B) — Mũi 1', origin: 'Ý', disease: 'Viêm màng não do não mô cầu nhóm B', price: 1788000, milestone: 'MỐC 2 THÁNG TUỔI' },
    { id: 5, date: '2026-04-23', age: '2 tháng 27 ngày', name: 'Vaxigrip Tetra (Cúm) — Mũi 1', origin: 'Pháp', disease: 'Cúm mùa', price: 385000, milestone: 'MỐC 2 THÁNG TUỔI' },
    {
        id: 6, date: '2026-05-21', age: '3 tháng 25 ngày', name: 'Infanrix Hexa (6 trong 1) — Mũi 2', origin: 'Bỉ', disease:
            'Bạch hầu, Ho gà, Uốn ván, Bại liệt, Viêm gan B, Hib', price: 1098000, milestone: 'MỐC 4 THÁNG TUỔI'
    },
    { id: 7, date: '2026-05-28', age: '4 tháng 2 ngày', name: 'Rotateq — Liều uống 2', origin: 'Mỹ', disease: 'Tiêu chảy cấp do Rotavirus', price: 665000, milestone: 'MỐC 4 THÁNG TUỔI' },
    { id: 8, date: '2026-06-04', age: '4 tháng 9 ngày', name: 'Prevenar 13 (Phế cầu) — Mũi 2', origin: 'Bỉ', disease: 'Viêm phổi, Viêm màng não, Viêm tai giữa do phế cầu', price: 1190000, milestone: 'MỐC 4 THÁNG TUỔI' },
    { id: 9, date: '2026-06-11', age: '4 tháng 16 ngày', name: 'Bexsero (Não mô cầu B) — Mũi 2', origin: 'Ý', disease: 'Viêm màng não do não mô cầu nhóm B', price: 1788000, milestone: 'MỐC 4 THÁNG TUỔI' },
    {
        id: 10, date: '2026-06-18', age: '4 tháng 23 ngày', name: 'Vaxigrip Tetra (Cúm) — Mũi 2', origin: 'Pháp', disease:
            'Cúm mùa (nhắc lại)', price: 385000, milestone: 'MỐC 4 THÁNG TUỔI'
    },
    {
        id: 11, date: '2026-07-23', age: '5 tháng 27 ngày', name: 'Infanrix Hexa (6 trong 1) — Mũi 3', origin: 'Bỉ', disease:
            'Bạch hầu, Ho gà, Uốn ván, Bại liệt, Viêm gan B, Hib', price: 1098000, milestone: 'MỐC 6 THÁNG TUỔI'
    },
    { id: 12, date: '2026-07-30', age: '6 tháng 4 ngày', name: 'Rotateq — Liều uống 3', origin: 'Mỹ', disease: 'Tiêu chảy cấp do Rotavirus', price: 665000, milestone: 'MỐC 6 THÁNG TUỔI' },
    {
        id: 13, date: '2026-08-06', age: '6 tháng 11 ngày', name: 'Prevenar 13 (Phế cầu) — Mũi 3', origin: 'Bỉ', disease:
            'Viêm phổi, Viêm màng não, Viêm tai giữa do phế cầu', price: 1190000, milestone: 'MỐC 6 THÁNG TUỔI'
    },
    {
        id: 14, date: '2026-08-20', age: '6 tháng 25 ngày', name: 'Menactra (Não mô cầu ACYW) — Mũi 1', origin: 'Mỹ', disease:
            'Viêm màng não do não mô cầu A, C, Y, W', price: 1350000, milestone: 'MỐC 6 THÁNG TUỔI'
    },
    {
        id: 15, date: '2026-10-22', age: '8 tháng 26 ngày', name: 'MVVAC (Sởi đơn)', origin: 'Việt Nam', disease: 'Sởi',
        price: 250000, milestone: 'MỐC 9 THÁNG TUỔI'
    },
    {
        id: 16, date: '2026-10-29', age: '9 tháng 3 ngày', name: 'Menactra (Não mô cầu ACYW) — Mũi 2', origin: 'Mỹ', disease:
            'Viêm màng não do não mô cầu A, C, Y, W', price: 1350000, milestone: 'MỐC 9 THÁNG TUỔI'
    },
    {
        id: 17, date: '2026-11-05', age: '9 tháng 10 ngày', name: 'Jevax (Viêm não Nhật Bản) — Mũi 1', origin: 'Việt Nam',
        disease: 'Viêm não Nhật Bản', price: 155000, milestone: 'MỐC 9 THÁNG TUỔI'
    },
    {
        id: 18, date: '2027-01-28', age: '12 tháng 7 ngày', name: 'MMR / Priorix (Sởi-Quai bị-Rubella) — Mũi 1', origin:
            'Mỹ/Bỉ', disease: 'Sởi, Quai bị, Rubella', price: 350000, milestone: 'MỐC 12 THÁNG TUỔI'
    },
    { id: 19, date: '2027-02-04', age: '12 tháng 14 ngày', name: 'Varivax (Thủy đậu) — Mũi 1', origin: 'Mỹ', disease: 'Thủy đậu', price: 985000, milestone: 'MỐC 12 THÁNG TUỔI' },
    {
        id: 20, date: '2027-02-11', age: '12 tháng 21 ngày', name: 'Imojev (Viêm não Nhật Bản) — Mũi 1', origin: 'Thái Lan',
        disease: 'Viêm não Nhật Bản', price: 988000, milestone: 'MỐC 12 THÁNG TUỔI'
    },
    {
        id: 21, date: '2027-02-18', age: '12 tháng 28 ngày', name: 'Prevenar 13 (Phế cầu) — Mũi nhắc', origin: 'Bỉ', disease:
            'Phế cầu (nhắc lại)', price: 1190000, milestone: 'MỐC 12 THÁNG TUỔI'
    },
    {
        id: 22, date: '2027-02-25', age: '13 tháng 5 ngày', name: 'Bexsero (Não mô cầu B) — Mũi nhắc', origin: 'Ý', disease:
            'Não mô cầu B (nhắc lại)', price: 1788000, milestone: 'MỐC 12 THÁNG TUỔI'
    },
    { id: 23, date: '2027-03-04', age: '13 tháng 12 ngày', name: 'MenQuadfi — Mũi nhắc', origin: 'Pháp', disease: 'Não mô cầu ACYW', price: 1350000, milestone: 'MỐC 12 THÁNG TUỔI' },
];



// ============ EMAIL REMINDER HELPERS ============

const formatDateVN = (ds) => new Date(ds + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

const toICSDate = (ds) => {
    const d = new Date(ds + 'T08:00:00');
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

const generateICSFile = (vaccines) => {
    const events = vaccines.map(v => {
        const start = toICSDate(v.date);
        const d = new Date(v.date + 'T09:00:00');
        const end = d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        return `BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:💉 Tiêm chủng bé Kobe: ${v.name}
DESCRIPTION:Phòng bệnh: ${v.disease}\\nXuất xứ: ${v.origin}\\nChi phí: ${new Intl.NumberFormat('vi-VN').format(v.price)} VND\\n\\nNhớ mang sổ tiêm chủng!
LOCATION:VNVC / Long Châu
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Nhắc tiêm chủng bé Kobe ngày mai!
END:VALARM
BEGIN:VALARM
TRIGGER:-PT2H
ACTION:DISPLAY
DESCRIPTION:Tiêm chủng bé Kobe trong 2 giờ nữa!
END:VALARM
END:VEVENT`;
    }).join('\n');

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//KobeTracker//VaccineSchedule//VI
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Lịch tiêm chủng bé Kobe
X-WR-TIMEZONE:Asia/Ho_Chi_Minh
${events}
END:VCALENDAR`;
};

const generateEmailBody = (vaccines, completedIds) => {
    const upcoming = vaccines.filter(v => !completedIds.includes(v.id));
    const done = vaccines.filter(v => completedIds.includes(v.id));

    let body = `📋 LỊCH TIÊM CHỦNG BÉ KOBE (Sinh 26/01/2026)\n`;
    body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    body += `📊 Tiến độ: ${done.length}/${vaccines.length} mũi (${Math.round(done.length / vaccines.length * 100)}%)\n\n`;

    if (upcoming.length > 0) {
        body += `🔔 CÁC MŨI SẮP TỚI:\n\n`;
        let currentMilestone = '';
        upcoming.forEach(v => {
            if (v.milestone !== currentMilestone) {
                currentMilestone = v.milestone;
                body += `\n📅 ${currentMilestone}\n`;
                body += `─────────────────────\n`;
            }
            body += `  ${v.id}. ${formatDateVN(v.date)}\n`;
            body += `     💉 ${v.name} (${v.origin})\n`;
            body += `     🛡️ Phòng: ${v.disease}\n`;
            body += `     💰 ${new Intl.NumberFormat('vi-VN').format(v.price)} VND\n\n`;
        });
    }

    if (done.length > 0) {
        body += `\n✅ ĐÃ TIÊM (${done.length} mũi):\n`;
        done.forEach(v => {
            body += `  ✓ ${v.name} — ${formatDateVN(v.date)}\n`;
        });
    }

    body += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    body += `⚠️ Lưu ý: Mỗi lần đi tiêm chỉ tiêm 1 mũi.\n`;
    body += `Cần bác sĩ khám sàng lọc trước mỗi lần tiêm.\n`;
    body += `Gửi từ: Kobe Vaccine Tracker 👶`;

    return body;
};

// ============ MAIN APP ============

const App = () => {
    const [completedIds, setCompletedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [showSummary, setShowSummary] = useState(true);
    const chatEndRef = useRef(null);

    // Email reminder states
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [emailAddr, setEmailAddr] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [calDownloaded, setCalDownloaded] = useState(false);

    const TOTAL_INITIAL_BUDGET = 27168000;

    useEffect(() => {
        const saved = localStorage.getItem('kobe_vaccine_v4_ai');
        if (saved) setCompletedIds(JSON.parse(saved));
        const savedEmail = localStorage.getItem('kobe_reminder_email');
        if (savedEmail) setEmailAddr(savedEmail);
    }, []);



    const toggleComplete = (id) => {
        const newIds = completedIds.includes(id)
            ? completedIds.filter(i => i !== id)
            : [...completedIds, id];
        setCompletedIds(newIds);
        localStorage.setItem('kobe_vaccine_v4_ai', JSON.stringify(newIds));
    };

    const filteredData = useMemo(() => {
        return VACCINE_DATA.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.disease.toLowerCase().includes(searchTerm.toLowerCase());
            const isDone = completedIds.includes(item.id);
            if (activeTab === 'todo') return matchesSearch && !isDone;
            if (activeTab === 'done') return matchesSearch && isDone;
            return matchesSearch;
        });
    }, [searchTerm, activeTab, completedIds]);

    const spentCost = VACCINE_DATA.filter(i => completedIds.includes(i.id)).reduce((acc, curr) => acc + curr.price, 0);
    const remainingBudget = TOTAL_INITIAL_BUDGET - spentCost;
    const progress = Math.round((completedIds.length / VACCINE_DATA.length) * 100) || 0;
    const nextVaccine = VACCINE_DATA.find(v => !completedIds.includes(v.id));
    const upcomingVaccines = VACCINE_DATA.filter(v => !completedIds.includes(v.id));

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // ===== Email & Calendar Functions =====

    const handleSendEmail = () => {
        if (!emailAddr.trim()) return;
        localStorage.setItem('kobe_reminder_email', emailAddr);
        const subject = encodeURIComponent(`🔔 Lịch tiêm chủng bé Kobe — ${upcomingVaccines.length} mũi sắp tới`);
        const body = encodeURIComponent(generateEmailBody(VACCINE_DATA, completedIds));
        window.open(`mailto:${emailAddr}?subject=${subject}&body=${body}`, '_blank');
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 4000);
    };

    const handleDownloadCalendar = () => {
        const icsContent = generateICSFile(upcomingVaccines);
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kobe-vaccine-schedule.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setCalDownloaded(true);
        setTimeout(() => setCalDownloaded(false), 4000);
    };

    const handleDownloadSingleICS = (vaccine) => {
        const icsContent = generateICSFile([vaccine]);
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kobe-tiem-${vaccine.id}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };



    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
            {/* Dashboard Header */}
            <header
                className="bg-slate-900 text-white p-6 shadow-2xl rounded-b-[40px] sticky top-0 z-50 border-b border-white/10">
                <div className="max-w-xl mx-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
                                <Baby className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight">KOBE <span
                                    className="text-blue-400">TRACKER</span></h1>
                                <p className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mt-1">Sổ tay
                                    tiêm chủng</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsEmailOpen(true)} className="bg-emerald-600/20 text-emerald-400 p-2 rounded-full border border-emerald-400/30" title="Nhắc lịch qua Email">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white/5 rounded-[28px] p-5 border border-white/10 relative overflow-hidden">
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <span
                                        className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Ngân
                                        sách còn lại</span>
                                    <div className="text-3xl font-black">{formatPrice(remainingBudget)}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-neutral-500 italic block">Tổng:
                                        {formatPrice(TOTAL_INITIAL_BUDGET)}</span>
                                    <div className="text-xl font-bold text-green-400 mt-1">{progress}%</div>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-700" style={{
                                width: `${progress}%`
                            }}></div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 mt-8">
                {/* Email Reminder */}
                <div className="grid grid-cols-1 gap-3 mb-8">
                    {/* Email Reminder Quick Button */}
                    <button onClick={() => setIsEmailOpen(true)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-3xl shadow-lg flex items-center justify-between group hover:scale-[1.02] transition-transform">
                        <div className="flex items-center gap-3 text-left">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Nhắc lịch tiêm</p>
                                <p className="text-sm font-black">{upcomingVaccines.length} mũi chưa tiêm</p>
                            </div>
                        </div>
                        <div className="bg-white text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-inner">
                            📧 GỬI MAIL
                        </div>
                    </button>
                </div>

                {/* Filters */}
                <div className="sticky top-[270px] z-40 bg-slate-50/95 backdrop-blur-md pb-4 pt-2">
                    <div className="flex bg-neutral-200/50 p-1.5 rounded-[20px] border border-neutral-200">
                        {['all', 'todo', 'done'].map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2.5 text-[11px] font-black rounded-2xl transition-all ${activeTab === tab ? 'bg-white shadow-md text-blue-600' : 'text-neutral-500 hover:text-neutral-700'
                                    }`}
                            >
                                {tab === 'all' ? 'TẤT CẢ' : tab === 'todo' ? 'CẦN TIÊM' : 'ĐÃ TIÊM'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Schedule List */}
                <div className="mt-6 space-y-8 relative pb-20">
                    <div className="absolute left-[27px] top-8 bottom-8 w-1 bg-neutral-200 rounded-full"></div>

                    {filteredData.map((item, index) => {
                        const isFirstInMilestone = index === 0 || item.milestone !== filteredData[index - 1].milestone;
                        const isCompleted = completedIds.includes(item.id);

                        return (
                            <div key={item.id} className="relative z-10">
                                {isFirstInMilestone && (
                                    <div
                                        className="bg-slate-800 text-white px-5 py-2 rounded-2xl inline-flex items-center gap-3 mb-8 ml-1 shadow-lg">
                                        <Clock className="w-4 h-4 text-blue-400" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{item.milestone}</span>
                                    </div>
                                )}

                                <div className="flex gap-6 group">
                                    <div onClick={() => toggleComplete(item.id)}
                                        className={`w-14 h-14 rounded-[22px] flex items-center justify-center shrink-0 border-4
                        transition-all cursor-pointer shadow-sm ${isCompleted ? 'bg-green-500 border-green-100 scale-110' : 'bg-white border-neutral-100'
                                            }`}
                                    >
                                        {isCompleted ?
                                            <CheckCircle2 className="w-7 h-7 text-white" /> : <span
                                                className="text-base font-black text-neutral-300">{item.id}</span>}
                                    </div>

                                    <div
                                        className={`flex-1 bg-white rounded-[32px] p-6 shadow-sm border border-neutral-100
                        transition-all hover:shadow-xl ${isCompleted ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <div
                                                className="bg-slate-100 text-slate-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase">
                                                {item.age}</div>
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(item.date).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>

                                        {/* Clickable name to toggle */}
                                        <h3 onClick={() => toggleComplete(item.id)} className={`text-lg font-black leading-tight mb-3 cursor-pointer ${isCompleted ? 'line-through' : 'text-slate-800'}`}>{item.name}</h3>

                                        {/* Disease info */}
                                        <p className="text-xs text-slate-400 mb-3 leading-relaxed">🛡️ {item.disease}</p>

                                        <div className="flex justify-between items-center pt-4 border-t border-neutral-50 mt-4">
                                            <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Chi phí</span>
                                            <div className="flex items-center gap-3">
                                                {/* Calendar reminder button for individual vaccine */}
                                                {!isCompleted && (
                                                    <button onClick={(e) => { e.stopPropagation(); handleDownloadSingleICS(item); }}
                                                        className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-100 transition-colors"
                                                        title="Thêm vào lịch">
                                                        📅 Nhắc
                                                    </button>
                                                )}
                                                <span className="text-sm font-black text-slate-800">{formatPrice(item.price)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* ============ EMAIL REMINDER MODAL ============ */}
            {isEmailOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-white">
                    <div className="bg-gradient-to-r from-emerald-700 to-teal-700 p-6 flex justify-between items-center shrink-0 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                            </div>
                            <div>
                                <h2 className="text-white font-black text-lg tracking-tight">NHẮC LỊCH TIÊM</h2>
                                <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest">Email & Lịch điện thoại</p>
                            </div>
                        </div>
                        <button onClick={() => setIsEmailOpen(false)} className="bg-white/10 p-2 rounded-full text-white/50 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center shadow-sm">
                                <div className="text-3xl font-black text-emerald-600">{upcomingVaccines.length}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Mũi chưa tiêm</div>
                            </div>
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center shadow-sm">
                                <div className="text-3xl font-black text-blue-600">{completedIds.length}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Đã hoàn thành</div>
                            </div>
                        </div>

                        {/* Option 1: Email */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-emerald-100 p-2 rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800">Gửi Email nhắc lịch</h3>
                                    <p className="text-[11px] text-slate-400">Gửi toàn bộ lịch tiêm qua email</p>
                                </div>
                            </div>
                            <input
                                type="email"
                                placeholder="Nhập email của bạn..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none mb-3"
                                value={emailAddr}
                                onChange={(e) => setEmailAddr(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
                            />
                            <button onClick={handleSendEmail} disabled={!emailAddr.trim()}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-2xl font-black text-sm disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                                <Send className="w-4 h-4" />
                                Soạn email nhắc lịch
                            </button>
                            {emailSent && (
                                <div className="mt-3 bg-emerald-50 text-emerald-700 text-xs font-bold text-center py-2 rounded-xl border border-emerald-200">
                                    ✅ Đã mở ứng dụng email! Kiểm tra và nhấn Gửi.
                                </div>
                            )}
                        </div>

                        {/* Option 2: Calendar .ics */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-blue-100 p-2 rounded-xl">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800">Thêm vào Lịch điện thoại</h3>
                                    <p className="text-[11px] text-slate-400">Tải file .ics → tự động nhắc trước 1 ngày & 2 giờ</p>
                                </div>
                            </div>
                            <button onClick={handleDownloadCalendar}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-2xl font-black text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                                📅 Tải toàn bộ {upcomingVaccines.length} lịch hẹn
                            </button>
                            {calDownloaded && (
                                <div className="mt-3 bg-blue-50 text-blue-700 text-xs font-bold text-center py-2 rounded-xl border border-blue-200">
                                    ✅ Đã tải file! Mở file .ics để thêm vào Google Calendar / Apple Calendar.
                                </div>
                            )}
                            <p className="text-[10px] text-slate-400 mt-3 text-center italic">
                                Mỗi sự kiện có 2 lời nhắc: trước 1 ngày & trước 2 giờ
                            </p>
                        </div>

                        {/* Upcoming list preview */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                Danh sách mũi sắp tới
                            </h3>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                {upcomingVaccines.map(v => (
                                    <div key={v.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                                        <div className="bg-slate-200 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-slate-500">{v.id}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-700 truncate">{v.name}</p>
                                            <p className="text-[10px] text-slate-400">{formatDateVN(v.date)}</p>
                                        </div>
                                        <button onClick={() => handleDownloadSingleICS(v)}
                                            className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-colors shrink-0">
                                            📅
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}




        </div>
    );
};

export default App;
