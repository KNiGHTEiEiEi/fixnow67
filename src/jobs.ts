export type JobStatus = "pending" | "working" | "complete" | "cancelled";

export interface Job {
  id: string;
  createdAt: number;
  status: JobStatus;
  itemName: string;
  itemType: string;
  size: string;
  weight: string;
  detail: string;
  address: string;
  province: string;
  district: string;
  building: string;
  floor: string;
  lat: string;
  lng: string;
  photos: string[]; // เก็บเป็น data URL (ย่อขนาดแล้ว)
  name: string;
  phone: string;
  lineId: string;
}

export type NewJob = Omit<Job, "id" | "createdAt" | "status">;

const KEY = "fixnow_jobs";
export const JOBS_EVENT = "fixnow-jobs-changed";

export function getJobs(): Job[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(jobs: Job[]) {
  localStorage.setItem(KEY, JSON.stringify(jobs));
  // แท็บเดิมไม่ได้รับ event "storage" จึงยิง event เองด้วย
  window.dispatchEvent(new Event(JOBS_EVENT));
}

function nextId(jobs: Job[]) {
  const max = jobs.reduce(
    (m, j) => Math.max(m, parseInt(j.id.replace(/\D/g, ""), 10) || 0),
    1000
  );
  return `FN-${max + 1}`;
}

export function addJob(data: NewJob): Job {
  const jobs = getJobs();
  const job: Job = {
    ...data,
    id: nextId(jobs),
    createdAt: Date.now(),
    status: "pending",
  };
  saveAll([job, ...jobs]); // ใหม่สุดอยู่บนสุด
  return job;
}

export function updateJobStatus(id: string, status: JobStatus) {
  saveAll(getJobs().map((j) => (j.id === id ? { ...j, status } : j)));
}

export function deleteJob(id: string) {
  saveAll(getJobs().filter((j) => j.id !== id));
}

export function clearJobs() {
  saveAll([]);
}

// ย่อรูปก่อนเก็บ เพื่อไม่ให้ localStorage เต็มเร็ว
export function fileToDataUrl(
  file: File,
  maxSize = 800,
  quality = 0.6
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas not supported"));
        return;
      }
      ctx.fillStyle = "#fff"; // PNG โปร่งใส -> พื้นขาว
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load image failed"));
    };

    img.src = url;
  });
}