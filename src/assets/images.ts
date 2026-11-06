// โหลดรูปทุกไฟล์ใน src/assets/images (รวมโฟลเดอร์ย่อย) อัตโนมัติ
const files = import.meta.glob("./images/**/*", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

// ชื่อไฟล์ (ไม่รวมนามสกุล) -> path ของรูป
// "./images/hp_1.jpg"        -> images.hp_1
// "./images/icon/clock.svg"  -> images.clock
export const images: Record<string, string> = {};

for (const path in files) {
  const name = path.split("/").pop()!.replace(/\.[^.]+$/, "");

  if (import.meta.env.DEV && name in images) {
    console.warn(`ชื่อไฟล์รูปซ้ำ: "${name}" (${path}) กรุณาเปลี่ยนชื่อไฟล์`);
  }

  images[name] = files[path];
}