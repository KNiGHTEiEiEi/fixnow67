import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router";
import Header from "../components/header";
import Footer from "../components/footer";
import { addJob, fileToDataUrl } from "../jobs";
import type { Job } from "../jobs";
import { images } from "../assets/images";

const PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น",
  "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย",
  "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม",
  "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน",
  "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี",
  "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก",
  "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร",
  "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี",
  "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล",
  "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี",
  "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู",
  "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี",
  "อื่น ๆ",
];

const ITEM_TYPES = [
  "ซ่อม",
  "ย้ายสิ่งของ",
  "ยกขึ้น / ลง",
  "นำออกจากพื้นที่",
  "อื่น ๆ",
];

const emptyForm = {
  itemName: "",
  itemType: "",
  size: "",
  weight: "",
  detail: "",
  address: "",
  province: "",
  district: "",
  building: "",
  floor: "",
  lat: "",
  lng: "",
  name: "",
  phone: "",
  lineId: "",
};
type FormState = typeof emptyForm;

const REQUIRED: Partial<Record<keyof FormState, string>> = {
  itemName: "กรุณาระบุสิ่งของที่ต้องการให้ช่วย",
  itemType: "ต้องการให้ช่วยเรื่องอะไร",
  address: "กรุณากรอกที่อยู่",
  province: "กรุณาเลือกจังหวัด",
  district: "กรุณากรอกเขต / อำเภอ",
  name: "กรุณากรอกชื่อผู้ติดต่อ",
  phone: "กรุณากรอกเบอร์โทรศัพท์",
};

type Status = "idle" | "loading" | "success" | "error";
type Photo = { id: string; file: File; url: string };

const MAX_PHOTOS = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const cleanPrefix = (text: string = "") =>
  text.replace(/^(จังหวัด|อำเภอ|เขต|แขวง|ตำบล)\s*/, "").trim();

function Request() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState<Job | null>(null);

  // เก็บว่าผู้ใช้แก้ช่องไหนเองแล้วบ้าง เพื่อไม่ให้ระบบเขียนทับ
  const touched = useRef<Set<string>>(new Set());

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // เก็บค่าล่าสุดไว้ใช้ตอนปิดหน้า เพื่อคืนหน่วยความจำของรูป
  const photosRef = useRef<Photo[]>([]);
  photosRef.current = photos;
  useEffect(() => {
    return () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
  }, []);

  const showError = (name: string) =>
    errors[name] ? (
      <small style={{ display: "block", marginTop: 4, color: "#d93025" }}>
        {errors[name]}
      </small>
    ) : null;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    touched.current.add(name);
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const errs: string[] = [];
    const accepted: Photo[] = [];
    const room = MAX_PHOTOS - photos.length;

    for (const file of Array.from(fileList)) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        errs.push(`${file.name}: รองรับเฉพาะ JPG และ PNG`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        errs.push(`${file.name}: ขนาดเกิน 10 MB`);
        continue;
      }
      if (accepted.length >= room) {
        errs.push(`เพิ่มได้สูงสุด ${MAX_PHOTOS} รูป`);
        break;
      }
      accepted.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
      });
    }

    setPhotos((prev) => [...prev, ...accepted]);
    setPhotoError(errs.join(" • "));
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
    setPhotoError("");
  };

  // force = true เมื่อกดปุ่ม (เขียนทับทุกช่อง), false เมื่อโหลดหน้า (ไม่ทับที่ผู้ใช้พิมพ์)
  const fetchLocation = (force: boolean) => {
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง กรุณากรอกที่อยู่เอง");
      return;
    }

    setStatus("loading");
    setMessage("กำลังค้นหาตำแหน่งของคุณ...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&accept-language=th&addressdetails=1`
          );
          if (!res.ok) throw new Error("reverse geocode failed");

          const data = await res.json();
          const a = data.address ?? {};

          const province = cleanPrefix(a.state || a.province || a.city || "");
          const district = cleanPrefix(
            a.city_district || a.county || a.district || a.town || ""
          );

          const street = a.road || a.pedestrian || a.footway || a.path || "";
          const area =
            a.village || a.hamlet || a.neighbourhood || a.quarter || "";
          const subdistrict = a.suburb || "";

          let address = Array.from(
            new Set([a.house_number, street, area, subdistrict].filter(Boolean))
          ).join(" ");

          // ถ้า OSM ไม่มีข้อมูลถนน/หมู่บ้านเลย ใช้ชื่อสถานที่หรือชื่อเต็มแทน
          if (!address) {
            address =
              data.name ||
              (data.display_name ?? "").split(",").slice(0, 2).join(" ").trim();
          }

          const filled: Record<string, string> = {
            address,
            province: PROVINCES.includes(province) ? province : "อื่น ๆ",
            district,
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
          };

          setForm((prev) => {
            const next = { ...prev };
            for (const key of Object.keys(filled)) {
              // โหลดหน้าครั้งแรก: ข้ามช่องที่ผู้ใช้แก้เองแล้ว
              if (force || !touched.current.has(key)) {
                (next as Record<string, string>)[key] = filled[key];
              }
            }
            return next;
          });

          if (force) touched.current.clear();

          setStatus("success");
          setMessage("กรอกตำแหน่งให้แล้ว หากไม่ตรงสามารถแก้ไขได้เอง");
        } catch {
          // ได้พิกัดแต่แปลงเป็นที่อยู่ไม่ได้
          setForm((prev) => ({
            ...prev,
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
          }));
          setStatus("error");
          setMessage("ได้พิกัดแล้ว แต่ดึงที่อยู่ไม่สำเร็จ กรุณากรอกที่อยู่เอง");
        }
      },
      (err) => {
        setStatus("error");
        setMessage(
          err.code === err.PERMISSION_DENIED
            ? "ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง กรุณากรอกที่อยู่เอง"
            : "ไม่สามารถระบุตำแหน่งได้ กรุณากรอกที่อยู่เอง"
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ดึงตำแหน่งอัตโนมัติตอนเปิดหน้า
  useEffect(() => {
    fetchLocation(false);
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    for (const key of Object.keys(REQUIRED) as (keyof FormState)[]) {
      if (!form[key].trim()) errs[key] = REQUIRED[key] as string;
    }
    if (!errs.phone && !/^0\d{8,9}$/.test(form.phone.replace(/\D/g, ""))) {
      errs.phone = "เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)";
    }
    return errs;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const errs = validate();
    setErrors(errs);

    const first = Object.keys(errs)[0];
    if (first) {
      const el = document.querySelector<HTMLElement>(`[name="${first}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const photoData = await Promise.all(
        photos.map((p) => fileToDataUrl(p.file))
      );

      const clean = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v.trim()])
      ) as FormState;

      const job = addJob({ ...clean, photos: photoData });

      photos.forEach((p) => URL.revokeObjectURL(p.url));
      setPhotos([]);
      setDone(job);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.name === "QuotaExceededError"
          ? "พื้นที่จัดเก็บเต็ม กรุณาลดจำนวนรูปแล้วลองใหม่"
          : "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setDone(null);
    setForm(emptyForm);
    setErrors({});
    setSubmitError("");
    setStatus("idle");
    setMessage("");
    touched.current.clear();
    fetchLocation(false);
  };

  return (
    <div className="request-page">

      <Header />


      {/* Page title */}
      <section className="request-header">
        <div>
          <span>REQUEST A TECHNICIAN</span>

          <h1>เรียกช่าง</h1>

          <p>
            แจ้งรายละเอียดสิ่งของและสถานที่
            เพื่อให้เราสามารถจัดหาช่างที่เหมาะสมให้คุณ
          </p>
        </div>
      </section>


      {done ? (
        /* หน้าสำเร็จ */
        <main className="request-container" style={{ display: "block" }}>
          <div
            className="form-section"
            style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}
          >
            <div style={{ fontSize: 56 }}>✅</div>
            <h2>ส่งคำขอเรียบร้อยแล้ว</h2>
            <p>
              รหัสงานของคุณคือ <strong>#{done.id}</strong>
            </p>
            <p>
              เจ้าหน้าที่จะติดต่อกลับที่เบอร์ <strong>{done.phone}</strong>{" "}
              เพื่อยืนยันรายละเอียดงาน
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
                marginTop: 24,
              }}
            >
              <button type="button" className="submit-button" onClick={resetAll}>
                แจ้งงานใหม่
              </button>
              <Link to="/" className="nav-button">
                กลับหน้าหลัก
              </Link>
            </div>
          </div>
        </main>
      ) : (
        <main className="request-container">

          <form className="request-form" onSubmit={handleSubmit} noValidate>

            {/* Step 1 */}
            <div className="form-section">

              <div className="form-title">
                <div className="form-number">01</div>

                <div>
                  <span>ITEM INFORMATION</span>
                  <h2>ข้อมูลสิ่งของ</h2>
                </div>
              </div>


              <div className="form-group">
                <label>
                  สิ่งของที่ต้องการให้ช่วย
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="itemName"
                  placeholder="เช่น ตู้เย็น, ตู้เสื้อผ้า, โซฟา"
                  value={form.itemName}
                  onChange={handleChange}
                />
                {showError("itemName")}
              </div>


              <div className="form-group">
                <label>
                  ต้องการให้ช่วยเรื่องอะไร
                  <span>*</span>
                </label>

                <select
                  name="itemType"
                  value={form.itemType}
                  onChange={handleChange}
                >
                  <option value="">ต้องการให้ช่วยเรื่องอะไร</option>
                  {ITEM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {showError("itemType")}
              </div>

              <div className="form-group">
                <label>รายละเอียดเพิ่มเติม</label>

                <textarea
                  name="detail"
                  rows={5}
                  placeholder="อธิบายลักษณะของสิ่งของ ปัญหาที่พบ หรือรายละเอียดที่ต้องการแจ้งให้ช่างทราบ"
                  value={form.detail}
                  onChange={handleChange}
                />
              </div>

            </div>


            {/* Step 2 */}
            <div className="form-section">

              <div className="form-title">
                <div className="form-number">02</div>

                <div>
                  <span>LOCATION</span>
                  <h2>สถานที่ให้บริการ</h2>
                </div>
              </div>


              <div className="location-box">

                <div className="location-icon">
                  <img src={images.map} alt="" />
                </div>

                <div className="location-content">

                  <h3>ระบุตำแหน่งปัจจุบัน</h3>

                  <p>
                    ใช้ตำแหน่งจากอุปกรณ์ของคุณ
                    เพื่อกรอกที่อยู่โดยอัตโนมัติ
                  </p>

                  <button
                    type="button"
                    className="location-button"
                    onClick={() => fetchLocation(true)}
                    disabled={status === "loading"}
                  >
                    {status === "loading"
                      ? "⏳ กำลังค้นหา..."
                      : "📍 ใช้ตำแหน่งปัจจุบัน"}
                  </button>

                  {message && (
                    <small
                      style={{
                        display: "block",
                        marginTop: 8,
                        color: status === "error" ? "#d93025" : "#188038",
                      }}
                    >
                      {message}
                    </small>
                  )}

                </div>

              </div>


              <div className="location-divider">
                <span>หรือกรอกที่อยู่ด้วยตัวเอง</span>
              </div>


              <div className="form-group">
                <label>
                  ที่อยู่
                  <span>*</span>
                </label>

                <textarea
                  name="address"
                  rows={3}
                  placeholder="บ้านเลขที่ ถนน ซอย"
                  value={form.address}
                  onChange={handleChange}
                />
                {showError("address")}
              </div>


              <div className="form-row">

                <div className="form-group">
                  <label>
                    จังหวัด
                    <span>*</span>
                  </label>

                  <select
                    name="province"
                    value={form.province}
                    onChange={handleChange}
                  >
                    <option value="">เลือกจังหวัด</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {showError("province")}
                </div>


                <div className="form-group">
                  <label>
                    เขต / อำเภอ
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="district"
                    placeholder="เขต / อำเภอ"
                    value={form.district}
                    onChange={handleChange}
                  />
                  {showError("district")}
                </div>

              </div>


              <div className="form-row">

                <div className="form-group">
                  <label>อาคาร / คอนโด</label>

                  <input
                    type="text"
                    name="building"
                    placeholder="ชื่ออาคาร / คอนโด"
                    value={form.building}
                    onChange={handleChange}
                  />
                </div>


                <div className="form-group">
                  <label>ชั้น / ห้อง</label>

                  <input
                    type="text"
                    name="floor"
                    placeholder="เช่น ชั้น 12 ห้อง 1205"
                    value={form.floor}
                    onChange={handleChange}
                  />
                </div>

              </div>

            </div>


            {/* Step 3 */}
            <div className="form-section">

              <div className="form-title">
                <div className="form-number">03</div>

                <div>
                  <span>PHOTO</span>
                  <h2>รูปภาพสิ่งของ</h2>
                </div>
              </div>


              <div
                className="upload-box"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  addFiles(e.dataTransfer.files);
                }}
                style={dragging ? { outline: "2px dashed #f97316" } : undefined}
              >

                <div className="upload-icon">📷</div>

                <h3>เพิ่มรูปภาพสิ่งของ</h3>

                <p>
                  รูปภาพจะช่วยให้ช่างประเมินลักษณะงาน
                  ได้แม่นยำมากขึ้น (ลากรูปมาวางตรงนี้ได้)
                </p>

                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg"
                  multiple
                  hidden
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = ""; // ให้เลือกไฟล์เดิมซ้ำได้
                  }}
                />

                <button
                  type="button"
                  className="upload-button"
                  onClick={() => fileInput.current?.click()}
                  disabled={photos.length >= MAX_PHOTOS}
                >
                  + เพิ่มรูปภาพ ({photos.length}/{MAX_PHOTOS})
                </button>

                <small>รองรับ JPG, PNG ขนาดไม่เกิน 10 MB</small>

                {photoError && (
                  <small style={{ display: "block", color: "#d93025", marginTop: 8 }}>
                    {photoError}
                  </small>
                )}

                {photos.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                      gap: 12,
                      marginTop: 16,
                    }}
                  >
                    {photos.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          position: "relative",
                          aspectRatio: "1 / 1",
                          borderRadius: 8,
                          overflow: "hidden",
                          border: "1px solid #ddd",
                        }}
                      >
                        <img
                          src={p.url}
                          alt={p.file.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(p.id)}
                          aria-label="ลบรูป"
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            border: "none",
                            background: "rgba(0,0,0,0.65)",
                            color: "#fff",
                            cursor: "pointer",
                            lineHeight: 1,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>


            {/* Step 4 */}
            <div className="form-section">

              <div className="form-title">
                <div className="form-number">04</div>

                <div>
                  <span>CONTACT INFORMATION</span>
                  <h2>ข้อมูลติดต่อ</h2>
                </div>
              </div>


              <div className="form-row">

                <div className="form-group">
                  <label>
                    ชื่อผู้ติดต่อ
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    placeholder="ชื่อ - นามสกุล"
                    value={form.name}
                    onChange={handleChange}
                  />
                  {showError("name")}
                </div>


                <div className="form-group">
                  <label>
                    เบอร์โทรศัพท์
                    <span>*</span>
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    placeholder="08X-XXX-XXXX"
                    value={form.phone}
                    onChange={handleChange}
                  />
                  {showError("phone")}
                </div>

              </div>


              <div className="form-group">
                <label>LINE ID</label>

                <input
                  type="text"
                  name="lineId"
                  placeholder="LINE ID สำหรับติดต่อกลับ"
                  value={form.lineId}
                  onChange={handleChange}
                />
              </div>

            </div>


            {/* Submit */}
            <div className="submit-section">

              <div className="submit-info">
                <strong>ตรวจสอบข้อมูลก่อนส่ง</strong>

                <p>
                  เจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันรายละเอียดงาน
                  และประสานงานกับช่าง
                </p>

                {Object.keys(errors).length > 0 && (
                  <small style={{ display: "block", color: "#d93025", marginTop: 8 }}>
                    กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน
                  </small>
                )}
                {submitError && (
                  <small style={{ display: "block", color: "#d93025", marginTop: 8 }}>
                    {submitError}
                  </small>
                )}
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={submitting}
              >
                {submitting ? "กำลังส่ง..." : "ยืนยันเรียกช่าง"}
                {!submitting && <span>→</span>}
              </button>

            </div>

          </form>


          {/* Side Information */}
          <aside className="request-side">

            <div className="side-card">

              <div className="side-icon">
                <img src={images.wrench} alt="" />
              </div>

              <h3>test01</h3>

              <p>
                บริการช่วยเหลือสำหรับสิ่งของ
                ที่ไม่สามารถเคลื่อนย้ายออกจากบ้าน
                หรือคอนโดได้ด้วยตัวเอง
              </p>

            </div>


            <div className="side-card">

              <h3>ขั้นตอนการทำงาน</h3>

              <div className="side-step">
                <span>01</span>
                <p>ส่งรายละเอียดงาน</p>
              </div>

              <div className="side-step">
                <span>02</span>
                <p>เจ้าหน้าที่ตรวจสอบ</p>
              </div>

              <div className="side-step">
                <span>03</span>
                <p>จัดหาช่าง</p>
              </div>

              <div className="side-step">
                <span>04</span>
                <p>ช่างเข้าดำเนินการ</p>
              </div>

            </div>


            <div className="side-help">

              <span>ต้องการความช่วยเหลือ?</span>

              <strong>ติดต่อเจ้าหน้าที่</strong>

              <p>โทร 08X-XXX-XXXX</p>

            </div>

          </aside>

        </main>
      )}


      <Footer />

    </div>
  );
}

export default Request;