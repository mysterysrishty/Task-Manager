import React from "react";

const AuthShell = ({ eyebrow, title, subtitle, footer, children }) => {
  return (
    <div className="min-h-screen bg-[var(--bg)] md:px-6 md:py-8">
      <div className="mx-auto flex min-h-screen max-w-6xl items-stretch md:min-h-0 md:items-center">
        <div className="grid w-full overflow-hidden bg-[var(--panel)] md:min-h-[720px] md:grid-cols-[1.02fr_0.98fr] md:rounded-[32px] md:border md:border-[var(--line)] md:shadow-[0_30px_120px_rgba(44,53,70,0.14)]">
          <section className="relative hidden overflow-hidden bg-[#1f7a72] md:flex md:flex-col md:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,248,233,0.28),transparent_26%),radial-gradient(circle_at_22%_28%,rgba(242,143,107,0.38),transparent_28%),linear-gradient(180deg,#1f7a72_0%,#184f5e_100%)]" />
            <div className="relative p-10">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff4df] text-lg font-bold text-[#184f5e]">
                  T
                </div>
                <span>TaskFlow Planner</span>
              </div>
            </div>

            <div className="relative px-10 pb-10">
              <div className="max-w-md">
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#fff4df]">
                  {eyebrow}
                </p>
                <h1 className="text-5xl font-semibold leading-[1.05] text-white">
                  Work that stays visible, calm, and on schedule.
                </h1>
                <p className="mt-5 text-base leading-7 text-white/78">
                  Plan projects, track due dates, and turn your daily task list
                  into something you can explain proudly on a resume.
                </p>
              </div>

              <div className="mt-12 grid max-w-md grid-cols-2 gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                    Focus
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    Priority-aware planning
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                    Clarity
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    Progress you can measure
                  </p>
                </div>
              </div>

              <div className="mt-10 max-w-md rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                  Demo Access
                </p>
                <p className="mt-3 text-sm leading-6 text-white/85">
                  Explore the seeded workspace with{" "}
                  <span className="font-semibold text-[#fff4df]">
                    demo@taskflow.com / demo123
                  </span>
                  .
                </p>
              </div>
            </div>
          </section>

          <section className="auth-grid flex min-h-screen flex-col justify-center px-5 py-8 sm:px-8 md:min-h-0 md:px-10 lg:px-14">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 text-center md:hidden">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1f7a72] text-2xl font-bold text-white shadow-lg shadow-[#1f7a72]/20">
                  T
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                  {eyebrow}
                </p>
              </div>

              <div className="rounded-[28px] border border-[var(--line)] bg-white/85 p-6 shadow-2xl shadow-[rgba(44,53,70,0.08)] backdrop-blur sm:p-8 md:border-none md:bg-transparent md:p-0 md:shadow-none">
                <div className="mb-8">
                  <p className="hidden text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)] md:block">
                    {eyebrow}
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-[var(--ink)]">{title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    {subtitle}
                  </p>
                </div>

                {children}

                {footer ? (
                  <div className="mt-8 border-t border-[var(--line)] pt-5 text-center text-sm text-[var(--muted)]">
                    {footer}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
