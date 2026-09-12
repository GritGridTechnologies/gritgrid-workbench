"use client";

import { useState } from "react";

const nav = ["Overview", "Projects", "Inquiries", "Team", "Statistics", "Tasks"];

const stats = [
  ["Queries", "0", "Live enquiries"],
  ["Completed projects", "0", "Awaiting approved updates"],
  ["Live projects", "0", "Currently active"],
  ["Team members", "0", "Internal accounts"]
];

const activities = [
  ["SYSTEM", "Workbench initialized", "Just now"],
  ["SECURITY", "Approval workflow is enabled", "Just now"],
  ["DATABASE", "Neon connection can be configured", "Pending"]
];

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="shell">
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <div className="logo">G</div>
          <div>
            <strong>GritGrid</strong>
            <span>WORKBENCH</span>
          </div>
        </div>

        <nav>
          {nav.map((item) => (
            <button
              key={item}
              className={active === item ? "navItem active" : "navItem"}
              onClick={() => { setActive(item); setMenuOpen(false); }}
            >
              <span className="navDot" />
              {item}
            </button>
          ))}
        </nav>

        <div className="sideBottom">
          <div className="secureBadge"><span /> Internal workspace</div>
          <div className="userMini">
            <div className="avatar">GG</div>
            <div><strong>GritGrid Team</strong><small>Employee access</small></div>
          </div>
        </div>
      </aside>

      {menuOpen && <button className="overlay" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <section className="content">
        <header className="topbar">
          <button className="mobileMenu" onClick={() => setMenuOpen(true)} aria-label="Open menu">☰</button>
          <div>
            <span className="eyebrow">INTERNAL / WORKBENCH</span>
            <h1>{active}</h1>
          </div>
          <div className="topActions">
            <div className="status"><span /> Systems ready</div>
            <button className="profile">GG</button>
          </div>
        </header>

        <div className="page">
          <section className="heroCard">
            <div>
              <span className="eyebrow cyan">GRITGRID TECHNOLOGIES</span>
              <h2>Build. Track. <em>Deliver.</em></h2>
              <p>One internal workspace for projects, enquiries, team activity and company operations.</p>
            </div>
            <div className="orb"><div className="orbCore">G</div><i /><i /></div>
          </section>

          <div className="statsGrid">
            {stats.map(([label, value, note]) => (
              <article className="statCard" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{note}</small>
              </article>
            ))}
          </div>

          <div className="grid2">
            <section className="panel">
              <div className="panelHead">
                <div><span className="eyebrow">WORKFLOW</span><h3>Quick actions</h3></div>
              </div>
              <div className="actions">
                {[
                  ["＋", "New project", "Create a project record"],
                  ["↗", "Record inquiry", "Add a new incoming request"],
                  ["✓", "Update project", "Submit an approved-status change"],
                  ["＋", "Team update", "Add an internal activity"]
                ].map(([icon, title, desc]) => (
                  <button className="action" key={title}>
                    <b>{icon}</b><span><strong>{title}</strong><small>{desc}</small></span><i>→</i>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panelHead">
                <div><span className="eyebrow">SYSTEM FEED</span><h3>Recent activity</h3></div>
                <button className="textButton">View all →</button>
              </div>
              <div className="activity">
                {activities.map(([type, title, time]) => (
                  <div className="activityRow" key={title}>
                    <div className="activityIcon">•</div>
                    <div><strong>{title}</strong><small>{type} · {time}</small></div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="notice">
            <div className="noticeIcon">!</div>
            <div><strong>Production setup</strong><p>This starter is intentionally secure by default. Connect Neon and your authentication provider before enabling employee data, approvals or administrative actions.</p></div>
          </section>

          <footer>GritGrid Technologies · Internal Workbench · <span>workbench.gritgrid.in</span></footer>
        </div>
      </section>
    </main>
  );
}
