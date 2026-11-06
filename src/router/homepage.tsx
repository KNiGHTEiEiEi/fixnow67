import Header from "../components/header";
import Footer from "../components/footer";
import { Link } from "react-router";
import { images } from "../assets/images";

// =========================
// Icon
// =========================

const isImage = (src: string) =>
  src.startsWith("/") || src.startsWith("data:");

function Icon({ src }: { src: string }) {
  return isImage(src) ? <img src={src} alt="" /> : <span>{src}</span>;
}

// ======/===================
// Hero Information
// =========================

const heroInfo = [
  { icon: images.clock, title: "24/7", text: "รับแจ้งงานตลอด 24 ชม." },
  { icon: images.user, title: "มืออาชีพ", text: "ช่างของเราเชี่ยวชาญ" },
  { icon: images.map, title: "GPS", text: "ระบุตำแหน่งแบบเรียลไทม์" },
];


// =========================
// Floating Badges
// =========================

const badges = [
  { pos: "top-left", icon: images.shield, title: "ช่างมืออาชีพ", text: "เชื่อถือได้" },
  { pos: "right", icon: images.truck, title: "อุปกรณ์ครบครัน", text: "ปลอดภัยทุกการขนย้าย" },
  { pos: "bottom", icon: images.map, title: "ถึงที่ไว", text: "ในพื้นที่ของคุณ" },
];

// =========================
// Services
// =========================

const services = [
  {
    icon: images.box,
    title: "ย้ายของชิ้นใหญ่",
    text: "ตู้เย็น ตู้เสื้อผ้า เครื่องซักผ้า ฯลฯ",
  },
  {
    icon: images.sofa,
    title: "ขนย้ายเฟอร์นิเจอร์",
    text: "เตียง โซฟา โต๊ะ ตู้ ฯลฯ",
  },
  {
    icon: images.washing,
    title: "ย้ายเครื่องใช้ไฟฟ้า",
    text: "ทีวี แอร์ ตู้เย็น ฯลฯ",
  },
  {
    icon: images.wrench,
    title: "งานช่วยเหลือทั่วไป",
    text: "ประกอบ ติดตั้ง ยกของ ฯลฯ",
  },
];

// =========================
// Why Choose Us
// =========================

const reasons = [
  {
    icon: images.shield,
    title: "ปลอดภัย ไว้ใจได้",
    text: "มีประกันระหว่างการขนย้าย",
  },
  {
    icon: images.groupuser,
    title: "ทีมงานมืออาชีพ",
    text: "ผ่านการอบรมและมีประสบการณ์",
  },
  {
    icon: images.map,
    title: "เช็คตำแหน่งแบบเรียลไทม์",
    text: "ทราบสถานะการเดินทางตลอดเวลา",
  },
  {
    icon: images.center,
    title: "บริการเป็นมิตร",
    text: "พร้อมดูแลและให้คำปรึกษา",
  },
];

// =========================
// Homepage
// =========================

function Homepage() {
  return (
    <div className="page">

      <Header />

      {/* =========================
          HERO
      ========================= */}

      <section className="hero" id="home">

        <div className="hero-content">

          <div className="hero-badge">
            ● บริการช่างถึงบ้าน
          </div>

          <h1>
            ของชิ้นใหญ่
            <br />
            <span>ย้ายออกไม่ได้?</span>
          </h1>

          <p>
            เรียกช่างมืออาชีพ ให้เข้าช่วยเหลือถึงบ้าน คอนโด
          </p>

          <div className="hero-buttons">

            <Link to="/request" className="primary-button">
              เรียกช่างทันที →
            </Link>

            <a href="#how" className="secondary-button">
              ดูวิธีใช้งาน
            </a>

          </div>

          {/* Hero Info */}

          <div className="hero-info">

            {heroInfo.map((item) => (

              <div className="hero-info-item" key={item.title}>

                <div className="hero-info-icon">
                  <Icon src={item.icon} />
                </div>

                <div className="info-text">
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>

              </div>

            ))}

          </div>

        </div>


        {/* Hero Image + Floating Badges */}

        <div className="hero-visual">

          <img
            className="hero-image"
            src={images.hp_1}
            alt="ช่างกำลังขนย้ายตู้เย็น"
          />

          {badges.map((b) => (

            <div className={`float-badge ${b.pos}`} key={b.title}>

              <div className="badge-icon">
                <Icon src={b.icon} />
              </div>

              <div className="badge-text">
                <strong>{b.title}</strong>
                <span>{b.text}</span>
              </div>

            </div>

          ))}

        </div>

      </section>


      {/* =========================
          SERVICES + WHY US
      ========================= */}

      <section className="info-section" id="service">

        {/* SERVICES */}

        <div className="services-content">

          <div className="block-title">

            <span>OUR SERVICES</span>

            <h2>บริการของเรา</h2>

            <p>
              ครบทุกงานย้าย ช่วยให้เรื่องใหญ่เป็นเรื่องง่าย
            </p>

          </div>


          <div className="service-list">

            {services.map((service) => (

              <Link
                to="/request"
                className="service-card"
                key={service.title}
              >

                <div className="service-icon">
                  <Icon src={service.icon} />
                </div>

                <h3>{service.title}</h3>

                <p>{service.text}</p>

                <span className="service-arrow">
                  →
                </span>

              </Link>

            ))}

          </div>

        </div>


        {/* WHY US */}

        <aside className="why-card">

          <div className="block-title">

            <span>WHY US</span>

            <h2>ทำไมต้องเลือกเรา?</h2>

            <p>
              เพราะเราเข้าใจว่างานของคุณสำคัญ
            </p>

          </div>


          <div className="why-list">

            {reasons.map((reason) => (

              <div className="why-item" key={reason.title}>

                <div className="why-icon">
                  <Icon src={reason.icon} />
                </div>

                <div className="why-text">

                  <strong>{reason.title}</strong>

                  <span>{reason.text}</span>

                </div>

              </div>

            ))}

          </div>

        </aside>

      </section>


      {/* =========================
          HOW IT WORKS
      ========================= */}

      <section className="section how-section" id="how">

        <div className="section-header">

          <span>HOW IT WORKS</span>

          <h2>เรียกช่างง่าย ๆ 3 ขั้นตอน</h2>

          <p>
            แจ้งรายละเอียด ระบุตำแหน่ง
            และรอช่างเข้าช่วยเหลือ
          </p>

        </div>


        <div className="steps">

          <div className="step">

            <div className="step-number">01</div>

            <h3>แจ้งรายละเอียด</h3>

            <p>
              บอกสิ่งของที่ต้องการให้ช่วย
              พร้อมแนบรูปภาพเพื่อให้ช่างประเมินงานได้ง่ายขึ้น
            </p>

          </div>


          <div className="step">

            <div className="step-number">02</div>

            <h3>ระบุตำแหน่ง</h3>

            <p>
              ใช้ GPS เพื่อระบุตำแหน่ง
              หรือกรอกที่อยู่ด้วยตัวเอง
            </p>

          </div>


          <div className="step">

            <div className="step-number">03</div>

            <h3>รอช่างเข้าช่วย</h3>

            <p>
              เจ้าหน้าที่รับงานและประสานงานช่าง
              เพื่อเข้าช่วยเหลือคุณ
            </p>

          </div>

        </div>

      </section>


      {/* =========================
          CTA
      ========================= */}

      <section className="cta" id="contact">

        <div className="cta-dots left" />
        <div className="cta-dots right" />

        <div className="cta-content">

          <span className="cta-eyebrow">NEED A HAND?</span>

          <h2>
            มีของชิ้นใหญ่<span>ที่ย้ายไม่ได้?</span>
          </h2>

          <p>ให้เราช่วยจัดการแทนคุณ</p>

          <Link to="/request">
            เรียกช่างตอนนี้ →
          </Link>

        </div>

      </section>


      <Footer />

    </div>
  );
}

export default Homepage;