import { JobsOfficeScene, type JobsSceneJob } from "./jobs-office-scene";
import type { JobsPageData } from "@/sanity/lib/fetch-jobs-page";

// Feature-branch listing; the shared Sanity dataset is deliberately untouched.
const OPEN_JOBS: JobsSceneJob[] = [
  {
    key: "project-manager-nyc",
    title: "Project Manager",
    starColor: "yellow",
    team: "Production",
    location: "NYC · 3+ days in person",
    employmentType: "Full time",
    summary: [
      "Our work is unserious. Our timelines aren’t.",
      "Turn ambitious ideas into comedy series, microsites, IRL stunts and whatever the group chat dreams up next. You’ll own production, budgets and the beautiful chaos from first brief to final delivery.",
      "Bring 5+ years of experience, a sharp creative opinion and your best ‘I am the one who knocks’ energy.",
      "$85k–$105k + new-business commission, medical/dental/vision, PTO, a Williamsburg workspace and free PATHETIC drops. Memes, obviously.",
    ].join("\n\n"),
    applyUrl: "https://www.linkedin.com/company/pathetic/jobs/",
    applyLabel: "See the role on LinkedIn",
  },
];

export default function JobsPage({ data: _data }: { data: JobsPageData }) {
  return (
    <div className="h-[100dvh] overflow-hidden bg-black">
      <JobsOfficeScene jobs={OPEN_JOBS} />
    </div>
  );
}
