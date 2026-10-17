import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/tutors/")({
  beforeLoad: () => {
    throw redirect({ to: "/cours" });
  },
});
