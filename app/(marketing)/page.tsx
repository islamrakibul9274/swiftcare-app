import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui";
export default function Home() {
  return (
    <div className="white-landing">
      <section className="white-hero">
        <div className="hero-label">
          <span />
          The connected workspace for ABA teams <Icon name="arrow" size={12} />
        </div>
        <h1>
          Care in focus.
          <br />
          <span>Everything connected.</span>
        </h1>
        <p>
          One thoughtfully designed workspace for sessions, clinical
          documentation, and the people behind every moment of progress.
        </p>
        <div className="row hero-actions">
          <Link className="button primary large" href="/login">
            Open your workspace <Icon name="arrow" size={16} />
          </Link>
          <Link className="button secondary large" href="#features">
            Explore the product
          </Link>
        </div>
        <div className="hero-byline">
          For behavior technicians, clinical directors, and practice teams.
        </div>
        <div className="product-frame">
          <div className="product-frame-bar">
            <span className="frame-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              <Icon name="shield" size={12} />
              SwiftCare workspace
            </span>
            <span>PRODUCT PREVIEW</span>
          </div>
          <Image
            src="/workspace-preview.png"
            width={1440}
            height={1000}
            sizes="(max-width: 767px) 94vw, 1100px"
            alt="SwiftCare’s white clinical dashboard, showing a synthetic demo caseload, session schedule, and behavior progress chart."
            preload
            className="product-screen"
          />
        </div>
        <p className="product-caption">
          An actual SwiftCare workspace with clearly labeled synthetic demo
          records. No real patient information.
        </p>
      </section>
      <section id="features" className="white-section">
        <div className="white-section-heading">
          <p className="eyebrow">Your day, connected</p>
          <h2>
            Built around the way
            <br />
            your team delivers care.
          </h2>
          <p>
            Less context switching. Clearer handoffs. The details you need,
            exactly where you expect them.
          </p>
        </div>
        <div className="white-feature-grid">
          {[
            {
              n: "01",
              icon: "clock",
              title: "Capture the moment.",
              text: "Live session timers, large observation controls, and saved drafts keep data collection close to care.",
              tags: ["Frequency & duration", "Interval & ABC data"],
            },
            {
              n: "02",
              icon: "note",
              title: "Review with context.",
              text: "Turn recorded observations into a draft, refine your documentation, and keep clinical approval with your BCBA.",
              tags: ["Assistive AI drafts", "Review & revision workflow"],
            },
            {
              n: "03",
              icon: "chart",
              title: "See what comes next.",
              text: "Connect client goals, approved behavior trends, care schedules, and practice operations in one place.",
              tags: ["Client-level insights", "Practice operations"],
            },
          ].map((item) => (
            <article key={item.n} className="white-feature">
              <div className="row-between">
                <Icon name={item.icon} size={23} />
                <span>{item.n}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <div>
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section id="workflow" className="white-section workflow-section">
        <div className="white-section-heading">
          <p className="eyebrow">One shared picture</p>
          <h2>
            Every role has a place.
            <br />
            Every handoff has context.
          </h2>
        </div>
        <div className="workflow-rows">
          {[
            {
              role: "RBT",
              title: "Stay present during care.",
              text: "Find assigned sessions, record observations, and finish documentation with a clear path to review.",
              icon: "play",
            },
            {
              role: "BCBA",
              title: "Make the next decision clearer.",
              text: "Review notes, manage treatment goals, and explore observations across your assigned caseload.",
              icon: "chart",
            },
            {
              role: "Admin",
              title: "Keep the practice connected.",
              text: "Manage team access, credential dates, claim records, and an accountable history of sensitive activity.",
              icon: "shield",
            },
          ].map((item) => (
            <div className="workflow-row" key={item.role}>
              <span className="workflow-icon">
                <Icon name={item.icon} size={21} />
              </span>
              <span className="workflow-role">{item.role}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <Icon name="arrow" size={16} />
            </div>
          ))}
        </div>
      </section>
      <section id="care" className="white-section white-cta">
        <div>
          <p className="eyebrow">A clearer place to do meaningful work</p>
          <h2>
            Your team brings the care.
            <br />
            We keep the day connected.
          </h2>
          <p>
            Sign in to your clinic workspace, or use the secure invitation
            provided by your administrator.
          </p>
        </div>
        <Link className="button primary large" href="/login">
          Enter your workspace <Icon name="arrow" size={16} />
        </Link>
      </section>
    </div>
  );
}
