import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import {
  JOBS_EVENT,
  clearJobs,
  deleteJob,
  getJobs,
  updateJobStatus,
} from "../jobs";
import type { Job, JobStatus } from "../jobs";

const STATUS_LABEL: Record<JobStatus, string> = {
  pending: "รอดำเนินการ",
  working: "กำลังดำเนินการ",
  complete: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

const statusStyle = (s: JobStatus) =>
  s === "cancelled" ? { background: "#eee", color: "#666" } : undefined;

type View = "dashboard" | "jobs" | "customers";

const formatDate = (t: number) =>
  new Date(t).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });

// อ่านงานจาก localStorage และอัปเดตเองเมื่อมีงานใหม่ (ทั้งแท็บเดียวกันและต่างแท็บ)
function useJobs() {
  const [jobs, setJobs] = useState<Job[]>(getJobs);

  useEffect(() => {
    const sync = () => setJobs(getJobs());
    window.addEventListener("storage", sync);
    window.addEventListener(JOBS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(JOBS_EVENT, sync);
    };
  }, []);

  return jobs;
}

function Info({ label, value }: { label: string; value?: ReactNode }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "6px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <span style={{ width: 130, color: "#777", flexShrink: 0 }}>{label}</span>
      <span style={{ flex: 1, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

function JobsTable({
  jobs,
  onSelect,
}: {
  jobs: Job[];
  onSelect: (id: string) => void;
}) {
  if (jobs.length === 0) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: "#888" }}>
        ยังไม่มีงาน เมื่อลูกค้ากดส่งที่หน้าเรียกช่าง งานจะแสดงที่นี่
      </div>
    );
  }

  return (
    <div className="jobs-table">
      <div className="table-header">
        <span>รหัสงาน</span>
        <span>ลูกค้า</span>
        <span>ประเภทงาน</span>
        <span>สถานที่</span>
        <span>สถานะ</span>
      </div>

      {jobs.map((j) => (
        <div
          key={j.id}
          className="job-row"
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
          onClick={() => onSelect(j.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSelect(j.id);
          }}
        >
          <strong>#{j.id}</strong>

          <div>
            <strong>{j.name}</strong>
            <small>{j.phone}</small>
          </div>

          <span>{j.itemName}</span>

          <span>{[j.district, j.province].filter(Boolean).join(", ")}</span>

          <span className={`status ${j.status}`} style={statusStyle(j.status)}>
            {STATUS_LABEL[j.status]}
          </span>
        </div>
      ))}
    </div>
  );
}

function Admin() {
  const jobs = useJobs();
  const [view, setView] = useState<View>("dashboard");
  const [filter, setFilter] = useState<JobStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);

  const selected = jobs.find((j) => j.id === selectedId) ?? null;

  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const count = (s: JobStatus) => jobs.filter((j) => j.status === s).length;
  const todayCount = jobs.filter((j) => j.createdAt >= startOfToday).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (filter !== "all" && j.status !== filter) return false;
      if (!q) return true;
      return [j.id, j.name, j.phone, j.itemName, j.address, j.district, j.province]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [jobs, filter, search]);

  const customers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; phone: string; lineId: string; count: number; last: number }
    >();
    for (const j of jobs) {
      const key = j.phone.replace(/\D/g, "");
      const c = map.get(key);
      if (c) {
        c.count += 1;
      } else {
        // jobs เรียงใหม่สุดก่อน จึงได้ข้อมูลล่าสุดของลูกค้าคนนั้น
        map.set(key, {
          name: j.name,
          phone: j.phone,
          lineId: j.lineId,
          count: 1,
          last: j.createdAt,
        });
      }
    }
    return Array.from(map.values());
  }, [jobs]);

  const go = (v: View) => {
    setView(v);
    setSelectedId(null);
  };

  const titles: Record<View, { h: string; p: string }> = {
    dashboard: { h: "Dashboard", p: "ภาพรวมการให้บริการของวันนี้" },
    jobs: { h: "รายการงาน", p: "จัดการงานที่ลูกค้าแจ้งเข้ามาทั้งหมด" },
    customers: { h: "ลูกค้า", p: "ข้อมูลลูกค้าที่เคยแจ้งงาน" },
  };

  const filterTabs: { key: JobStatus | "all"; label: string }[] = [
    { key: "all", label: `ทั้งหมด (${jobs.length})` },
    { key: "pending", label: `รอดำเนินการ (${count("pending")})` },
    { key: "working", label: `กำลังดำเนินการ (${count("working")})` },
    { key: "complete", label: `เสร็จสิ้น (${count("complete")})` },
    { key: "cancelled", label: `ยกเลิก (${count("cancelled")})` },
  ];

  return (
    <div className="admin-page">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="logo admin-logo">
          <span className="logo-icon">🔧</span>
          <span>test01</span>
        </div>

        <div className="admin-menu">

          <a
            href="#dashboard"
            className={`menu-item ${view === "dashboard" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              go("dashboard");
            }}
          >
            <span>▣</span>
            Dashboard
          </a>

          <a
            href="#jobs"
            className={`menu-item ${view === "jobs" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              go("jobs");
            }}
          >
            <span>📋</span>
            รายการงาน
          </a>

          <a
            href="#customers"
            className={`menu-item ${view === "customers" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              go("customers");
            }}
          >
            <span>👥</span>
            ลูกค้า
          </a>

        </div>

        <div className="sidebar-bottom">
          <Link to="/" className="back-home">
            ← กลับหน้าเว็บไซต์
          </Link>
        </div>

      </aside>


      {/* Main */}
      <main className="admin-main">

        {/* Header */}
        <header className="admin-header">
          <div>
            <span className="admin-label">ADMIN PANEL</span>

            <h1>{titles[view].h}</h1>

            <p>{titles[view].p}</p>
          </div>

          <div className="admin-profile">
            <div className="profile-avatar">A</div>

            <div>
              <strong>Administrator</strong>
              <span>เจ้าของเว็บไซต์</span>
            </div>
          </div>
        </header>


        {/* Dashboard */}
        {view === "dashboard" && (
          <>
            <section className="stats-grid">

              <div className="stat-card">
                <div className="stat-icon blue">📋</div>
                <div>
                  <span>งานทั้งหมด</span>
                  <strong>{jobs.length}</strong>
                </div>
                <small>วันนี้ {todayCount} งาน</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">⏳</div>
                <div>
                  <span>รอดำเนินการ</span>
                  <strong>{count("pending")}</strong>
                </div>
                <small>ต้องจัดการ</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">🔧</div>
                <div>
                  <span>กำลังดำเนินการ</span>
                  <strong>{count("working")}</strong>
                </div>
                <small>ช่างกำลังทำงาน</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">✓</div>
                <div>
                  <span>เสร็จสิ้น</span>
                  <strong>{count("complete")}</strong>
                </div>
                <small>งานสำเร็จทั้งหมด</small>
              </div>

            </section>


            <section className="jobs-section" id="jobs">

              <div className="section-title">
                <div>
                  <span>RECENT JOBS</span>
                  <h2>รายการแจ้งงานล่าสุด</h2>
                </div>

                <button className="view-all" onClick={() => go("jobs")}>
                  ดูทั้งหมด →
                </button>
              </div>

              <JobsTable jobs={jobs.slice(0, 5)} onSelect={setSelectedId} />

            </section>


            <section className="quick-section">

              <h2>จัดการด่วน</h2>

              <div className="quick-grid">

                <button onClick={() => go("jobs")}>
                  <span>📋</span>
                  <strong>ดูงานทั้งหมด</strong>
                  <small>จัดการรายการแจ้งงาน</small>
                </button>

                <button onClick={() => go("customers")}>
                  <span>👥</span>
                  <strong>ลูกค้า</strong>
                  <small>ดูข้อมูลลูกค้า</small>
                </button>

                <button
                  onClick={() => {
                    if (confirm("ลบข้อมูลงานทั้งหมด? การลบนี้ย้อนกลับไม่ได้")) {
                      clearJobs();
                    }
                  }}
                >
                  <span>🗑️</span>
                  <strong>ล้างข้อมูลทดสอบ</strong>
                  <small>ลบงานทั้งหมดในระบบ</small>
                </button>

              </div>

            </section>
          </>
        )}


        {/* Jobs */}
        {view === "jobs" && (
          <section className="jobs-section">

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              {filterTabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilter(t.key)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: "1px solid #ddd",
                    background: filter === t.key ? "#f97316" : "#fff",
                    color: filter === t.key ? "#fff" : "#333",
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <input
              type="search"
              placeholder="ค้นหา รหัสงาน ชื่อ เบอร์โทร สิ่งของ หรือที่อยู่"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #ddd",
                marginBottom: 16,
              }}
            />

            <JobsTable jobs={filtered} onSelect={setSelectedId} />

          </section>
        )}


        {/* Customers */}
        {view === "customers" && (
          <section className="jobs-section">

            {customers.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#888" }}>
                ยังไม่มีข้อมูลลูกค้า
              </div>
            ) : (
              <div className="jobs-table">
                <div className="table-header">
                  <span>ชื่อ</span>
                  <span>เบอร์โทร</span>
                  <span>LINE ID</span>
                  <span>จำนวนงาน</span>
                  <span>แจ้งล่าสุด</span>
                </div>

                {customers.map((c) => (
                  <div key={c.phone} className="job-row">
                    <strong>{c.name}</strong>
                    <span>
                      <a href={`tel:${c.phone}`}>{c.phone}</a>
                    </span>
                    <span>{c.lineId || "-"}</span>
                    <span>{c.count} งาน</span>
                    <span>{formatDate(c.last)}</span>
                  </div>
                ))}
              </div>
            )}

          </section>
        )}

      </main>


      {/* Job detail modal */}
      {selected && (
        <div
          onClick={() => setSelectedId(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            padding: "40px 16px",
            overflowY: "auto",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              color: "#222",
              borderRadius: 12,
              width: "100%",
              maxWidth: 640,
              padding: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>#{selected.id}</h2>
                <small style={{ color: "#777" }}>
                  แจ้งเมื่อ {formatDate(selected.createdAt)}
                </small>
              </div>

              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="ปิด"
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "#555",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ margin: "16px 0" }}>
              <label style={{ display: "block", marginBottom: 6, color: "#555" }}>
                สถานะงาน
              </label>
              <select
                value={selected.status}
                onChange={(e) =>
                  updateJobStatus(selected.id, e.target.value as JobStatus)
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                }}
              >
                {(Object.keys(STATUS_LABEL) as JobStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>

            <h3 style={{ margin: "20px 0 4px" }}>ข้อมูลสิ่งของ</h3>
            <Info label="สิ่งของ" value={selected.itemName} />
            <Info label="ประเภท" value={selected.itemType} />
            <Info label="ขนาด" value={selected.size} />
            <Info label="น้ำหนัก" value={selected.weight} />
            <Info label="รายละเอียด" value={selected.detail} />

            <h3 style={{ margin: "20px 0 4px" }}>สถานที่</h3>
            <Info label="ที่อยู่" value={selected.address} />
            <Info
              label="เขต / จังหวัด"
              value={[selected.district, selected.province]
                .filter(Boolean)
                .join(", ")}
            />
            <Info label="อาคาร / คอนโด" value={selected.building} />
            <Info label="ชั้น / ห้อง" value={selected.floor} />
            <Info
              label="พิกัด"
              value={
                selected.lat && selected.lng ? (
                  <>
                    {selected.lat}, {selected.lng}{" "}
                    <a
                      href={`https://www.google.com/maps?q=${selected.lat},${selected.lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      เปิดแผนที่
                    </a>
                  </>
                ) : null
              }
            />

            <h3 style={{ margin: "20px 0 4px" }}>ข้อมูลติดต่อ</h3>
            <Info label="ชื่อ" value={selected.name} />
            <Info
              label="เบอร์โทร"
              value={<a href={`tel:${selected.phone}`}>{selected.phone}</a>}
            />
            <Info label="LINE ID" value={selected.lineId} />

            {selected.photos.length > 0 && (
              <>
                <h3 style={{ margin: "20px 0 8px" }}>
                  รูปภาพ ({selected.photos.length})
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                    gap: 10,
                  }}
                >
                  {selected.photos.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`รูปที่ ${i + 1}`}
                      onClick={() => setZoom(src)}
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        cursor: "zoom-in",
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            <div style={{ marginTop: 24, textAlign: "right" }}>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`ลบงาน #${selected.id} ?`)) {
                    deleteJob(selected.id);
                    setSelectedId(null);
                  }
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #d93025",
                  background: "#fff",
                  color: "#d93025",
                  cursor: "pointer",
                }}
              >
                ลบงานนี้
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Photo zoom */}
      {zoom && (
        <div
          onClick={() => setZoom(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            cursor: "zoom-out",
          }}
        >
          <img
            src={zoom}
            alt="รูปขยาย"
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8 }}
          />
        </div>
      )}

    </div>
  );
}

export default Admin;