import React, { useContext, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis,
  LineChart, Line,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';
import { BarChart2, Activity, PieChart as PieIcon, Users as UsersIcon, List, Info } from 'lucide-react';
import { LEAD_STATUSES } from '../config/leadStatuses';



const PIE_COLORS = ['#d4af37', '#ec4899']; // Gold and Pink
const ACCENT_COLOR = '#3b82f6'; // Blue
const PURPLE_COLOR = '#8b5cf6'; // Purple for scatter highlights

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px' }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{label || payload[0].payload.day || payload[0].payload.name}</p>
        <p style={{ margin: 0, color: payload[0].color || 'var(--accent-color)' }}>
          {payload[0].name === 'count' ? 'Danışan/Lead: ' : 'Yoğunluk: '}
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { currentUser, leads, users } = useContext(AppContext);

  if (currentUser.level < 4) {
    return <Navigate to="/leads" />;
  }
  
  // Date Range State
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      label: '1 Ay'
    };
  });

  // Predefined Range Handler
  const setRange = (days, label) => {
    const end = new Date();
    const start = new Date();
    if (days === 'all') {
      setDateRange({ start: '', end: end.toISOString().split('T')[0], label });
    } else {
      start.setDate(end.getDate() - days);
      setDateRange({ 
        start: start.toISOString().split('T')[0], 
        end: end.toISOString().split('T')[0], 
        label 
      });
    }
  };

  // Filtered Leads based on Date Range
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const leadDate = new Date(lead.createdAt).toISOString().split('T')[0];
      const startMatch = !dateRange.start || leadDate >= dateRange.start;
      const endMatch = !dateRange.end || leadDate <= dateRange.end;
      return startMatch && endMatch;
    });
  }, [leads, dateRange]);

  // Dinamik Line Chart verisi (Günlere göre)
  const groupedByDate = filteredLeads.reduce((acc, lead) => {
    const d = new Date(lead.createdAt);
    const dateKey = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth()+1).toString().padStart(2, '0')}.${d.getFullYear()}`;
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {});

  const computedLineData = Object.keys(groupedByDate).sort((a,b) => {
    const [d1, m1, y1] = a.split('.');
    const [d2, m2, y2] = b.split('.');
    return new Date(`${y1}-${m1}-${d1}`) - new Date(`${y2}-${m2}-${d2}`);
  }).map(key => ({
    name: key, count: groupedByDate[key]
  }));

  // Boş state için varsayılan data
  if (computedLineData.length === 0) {
    const today = new Date();
    const dateKey = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth()+1).toString().padStart(2, '0')}.${today.getFullYear()}`;
    computedLineData.push({ name: dateKey, count: 0 });
  }

  // Dinamik Scatter Chart verisi
  const groupedByShortDate = filteredLeads.reduce((acc, lead) => {
    const d = new Date(lead.createdAt);
    const dateKey = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`;
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {});

  const computedScatterData = Object.keys(groupedByShortDate).sort().map((key, index) => ({
    day: key,
    index: index + 1,
    value: 2, // Lead seviyesi -> 2. scatterData'da 2 mor renge denk gelir
    size: groupedByShortDate[key] * 200
  }));

  // Dinamik Pie Chart verisi
  const assignedCount = filteredLeads.filter(l => l.assigneeId).length;
  const unassignedCount = filteredLeads.length - assignedCount;
  
  const computedPieData = filteredLeads.length > 0 ? [
    { name: 'Potansiyel (Atanmamış)', value: unassignedCount },
    { name: 'Aktif (Atanmış)', value: assignedCount }
  ] : [
    { name: 'Veri Yok', value: 1 } // Boş görünüm
  ];

  // Satış Danışmanı Performansı (Bar Chart)
  const salesConsultants = users.filter(u => u.level === 2);
  const leadsPerConsultant = salesConsultants.map(sc => {
    const count = filteredLeads.filter(l => l.assigneeId === sc.id).length;
    return { name: sc.name, count };
  });

  // Süreç Durumları Dağılımı (Bar Chart)
  const statusList = LEAD_STATUSES;
  const leadsPerStatus = statusList.map(status => {
    const count = filteredLeads.filter(l => (l.status || 'Aranmayı Bekliyor') === status).length;
    return { name: status, count };
  });

  // Temsilci Yanıt Süresi Analizi (Lead Assignment to Response)
  const responseTimeData = salesConsultants.map(sc => {
    let totalTime = 0;
    let leadCount = 0;

    filteredLeads.filter(l => l.assigneeId === sc.id).forEach(lead => {
      if (!lead.history || lead.history.length < 2) return;

      // Atama zamanını bul (Sondan başa gitmek daha mantıklı olabilir çünkü son atama önemlidir)
      const assignmentEvent = lead.history.find(h => h.note && h.note.includes('atandı'));
      if (!assignmentEvent) return;

      // Atamadan sonraki İLK danışman eylemini bul (Not veya Durum Değişikliği)
      // Author ismi danışman ismiyle eşleşmeli
      const responseEvent = lead.history.find(h => 
        new Date(h.date) > new Date(assignmentEvent.date) && 
        h.author === sc.name
      );

      if (responseEvent) {
        const diff = (new Date(responseEvent.date) - new Date(assignmentEvent.date)) / (1000 * 60); // Dakika cinsinden
        totalTime += diff;
        leadCount++;
      }
    });

    const avgMinutes = leadCount > 0 ? Math.round(totalTime / leadCount) : 0;
    return { 
      name: sc.name, 
      avgMinutes,
      count: leadCount,
      displayTime: avgMinutes > 60 ? `${(avgMinutes/60).toFixed(1)} sa` : `${avgMinutes} dk`
    };
  });

  return (
    <div className="dashboard-container">
      {/* Welcome Announcement */}
      <div style={{ 
        background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{ background: 'var(--accent-color)', borderRadius: '50%', padding: '8px', display: 'flex', color: 'white' }}>
          <Info size={20} />
        </div>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
          Sistemimiz organik olarak sürekli gelişmektedir. Bu nedenle sistemimiz için; hataları, varsa önerilerinizi ve şikayetlerinizi <strong style={{ color: 'var(--accent-color)' }}>"DESTEK TALEBİ"</strong> bölümünden bildirmeniz bizim için çok önemli.
        </p>
      </div>

      <div className="dashboard-header" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Analiz Paneli</h1>
          <div className="welcome-badge" style={{ color: 'var(--text-secondary)', fontSize: '13px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '20px' }}>{currentUser.name}</div>
        </div>
        
        <div className="dashboard-filters" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
           <div className="filter-group" style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', overflowX: 'auto' }}>
              <button onClick={() => setRange(7, '1 Hafta')} className={`btn btn-sm ${dateRange.label === '1 Hafta' ? 'btn-primary' : 'btn-secondary'}`} style={{fontSize: '11px', padding: '6px 10px', whiteSpace: 'nowrap'}}>1 Hafta</button>
              <button onClick={() => setRange(30, '1 Ay')} className={`btn btn-sm ${dateRange.label === '1 Ay' ? 'btn-primary' : 'btn-secondary'}`} style={{fontSize: '11px', padding: '6px 10px', whiteSpace: 'nowrap'}}>1 Ay</button>
              <button onClick={() => setRange(365, '1 Yıl')} className={`btn btn-sm ${dateRange.label === '1 Yıl' ? 'btn-primary' : 'btn-secondary'}`} style={{fontSize: '11px', padding: '6px 10px', whiteSpace: 'nowrap'}}>1 Yıl</button>
              <button onClick={() => setRange('all', 'Tümü')} className={`btn btn-sm ${dateRange.label === 'Tümü' ? 'btn-primary' : 'btn-secondary'}`} style={{fontSize: '11px', padding: '6px 10px', whiteSpace: 'nowrap'}}>Tümü</button>
           </div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <input 
                type="date" 
                className="form-input" 
                style={{ flex: 1, minWidth: '120px', padding: '4px 8px', fontSize: '12px' }} 
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value, label: 'Özel'})}
              />
              <span style={{color: 'var(--text-secondary)'}}>-</span>
              <input 
                type="date" 
                className="form-input" 
                style={{ flex: 1, minWidth: '120px', padding: '4px 8px', fontSize: '12px' }} 
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value, label: 'Özel'})}
              />
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Lead Response Time Analysis */}
        <div className="card" style={{ padding: '20px', gridColumn: '1 / -1' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '15px' }}>
            <Activity size={18} color="var(--accent-color)" />
            Temsilci Lead Yanıt Süresi Analizi
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Leadin temsilciye atanması ile temsilcinin ilk aksiyonu (not veya durum güncellemesi) arasındaki ortalama süre.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={responseTimeData} layout="vertical" margin={{ left: 40, right: 40 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
                   <XAxis type="number" stroke="var(--text-secondary)" tick={{fontSize: 12}} label={{ value: 'Dakika', position: 'bottom', fill: 'var(--text-secondary)', fontSize: 12 }} />
                   <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 12}} width={100} />
                   <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)'}} />
                   <Bar dataKey="avgMinutes" fill="#10b981" radius={[0, 4, 4, 0]} name="Ort. Yanıt (Dk)" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Temsilci</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>İşlenen Lead</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Ort. Yanıt Süresi</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {responseTimeData.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>{d.name}</td>
                      <td style={{ padding: '12px 8px' }}>{d.count}</td>
                      <td style={{ padding: '12px 8px', color: d.avgMinutes > 120 ? '#ef4444' : d.avgMinutes > 60 ? '#f59e0b' : '#10b981' }}>
                        {d.displayTime}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '10px', 
                          fontSize: '11px',
                          background: d.avgMinutes > 120 ? 'rgba(239, 68, 68, 0.1)' : d.avgMinutes > 60 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: d.avgMinutes > 120 ? '#ef4444' : d.avgMinutes > 60 ? '#f59e0b' : '#10b981'
                        }}>
                          {d.avgMinutes === 0 ? 'Veri Yok' : d.avgMinutes > 120 ? 'Yavaş' : d.avgMinutes > 60 ? 'Orta' : 'Hızlı'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Scatter Chart - Yoğunluk Haritası */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '15px' }}>
            <Activity size={18} color="var(--accent-color)" />
            Yoğunluk haritası
          </h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis type="category" dataKey="day" name="Gün" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                <YAxis type="number" dataKey="value" name="Değer" domain={[0, 4]} stroke="var(--text-secondary)" tick={{fontSize: 12}} tickCount={5} />
                <ZAxis type="number" dataKey="size" range={[50, 800]} name="Büyüklük" />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Danışan" data={computedScatterData.filter(d => d.value <= 1)} fill={ACCENT_COLOR} />
                <Scatter name="Lead" data={computedScatterData.filter(d => d.value > 1 && d.value <= 2)} fill={PURPLE_COLOR} />
                <Scatter name="Satış" data={computedScatterData.filter(d => d.value > 2)} fill={ACCENT_COLOR} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{width: 8, height: 8, borderRadius: '50%', background: ACCENT_COLOR}}></div>Danışan sayısı</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{width: 8, height: 8, borderRadius: '50%', background: '#10b981'}}></div>Randevu sayısı</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{width: 8, height: 8, borderRadius: '50%', background: '#f59e0b'}}></div>Satış sayısı</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{width: 8, height: 8, borderRadius: '50%', background: '#ef4444'}}></div>Teklif sayısı</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{width: 8, height: 8, borderRadius: '50%', background: PURPLE_COLOR}}></div>Lead Sayısı</span>
          </div>
        </div>

        {/* Line Chart - Yeni Danışan ve Lead */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '15px' }}>
            <BarChart2 size={18} color="var(--accent-color)" />
            Yeni Danışan ve Lead sayıları
          </h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={computedLineData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 10, angle: -45, textAnchor: 'end'}} height={50} />
                <YAxis domain={[0, 3]} tickCount={4} stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="linear" dataKey="count" stroke={ACCENT_COLOR} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-secondary)', stroke: ACCENT_COLOR }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Danışan Tipleri Dağılımı */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '15px' }}>
            <PieIcon size={18} color="var(--accent-color)" />
            Danışan tipleri dağılımı
          </h3>
          <div style={{ height: '250px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={computedPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {computedPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={leads.length > 0 ? PIE_COLORS[index % PIE_COLORS.length] : 'var(--bg-secondary)'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-primary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ textAlign: 'center', marginTop: '-30px', fontWeight: 'bold', fontSize: '14px', zIndex: 10, position: 'relative', pointerEvents: 'none' }}>
             
          </div>
        </div>

        {/* Consultant Performance Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '15px' }}>
            <UsersIcon size={18} color="var(--accent-color)" />
            Temsilci Atanan Lead Dağılımı
          </h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsPerConsultant} margin={{ left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 10}} />
                <YAxis allowDecimals={false} stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)'}} />
                <Bar dataKey="count" fill="var(--accent-color)" radius={[4, 4, 0, 0]} name="Lead Sayısı" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '15px' }}>
            <List size={18} color="var(--accent-color)" />
            Süreç Durumları Dağılımı
          </h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsPerStatus} margin={{ left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 9, angle: -45, textAnchor: 'end'}} height={80} interval={0} />
                <YAxis allowDecimals={false} stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)'}} />
                <Bar dataKey="count" fill={PURPLE_COLOR} radius={[4, 4, 0, 0]} name="Sayı" barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Dashboard;
