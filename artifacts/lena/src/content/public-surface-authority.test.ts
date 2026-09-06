import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { findStudioProject, publicProjects, STUDIO_PROJECTS } from "./projects";
import { findService, publicServices, LENA_SERVICES } from "./services";
import { findSystem, publicSystems } from "./systems";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("LENA public surface authority", () => {
  it("keeps hidden creative catalogs in the repository without publishing them", () => {
    expect(LENA_SERVICES.length).toBeGreaterThan(0);
    expect(STUDIO_PROJECTS.length).toBeGreaterThan(0);
    expect(publicServices()).toEqual([]);
    expect(publicProjects()).toEqual([]);
    expect(findService("visual-identity")).toBeUndefined();
    expect(findStudioProject("riwaq")).toBeUndefined();
  });

  it("resolves only public systems for public lookups", () => {
    expect(findSystem("property")?.id).toBe("property");
    expect(findSystem("materials")).toBeUndefined();
    expect(publicSystems().every((system) => system.visibility === "public")).toBe(true);
    expect(publicSystems().some((system) => system.id === "property")).toBe(true);
  });

  it("does not publish hidden service or concept-work URLs from public pages", () => {
    const serviceDetails = read("src/pages/ServiceDetails.tsx");
    const projectDetails = read("src/pages/ProjectDetails.tsx");
    const contact = read("src/pages/Contact.tsx");

    expect(serviceDetails).toContain("findService");
    expect(serviceDetails).toContain("findSystem");
    expect(serviceDetails).toContain('to={`/world/${system.id}`}');
    expect(projectDetails).toContain("findStudioProject");
    expect(contact).toContain("findSystem");
    expect(contact).toContain("requestedSystem");
  });

  it("keeps sitemap generation on public visibility, including World Atlas and Command", () => {
    const sitemap = read("scripts/generate-sitemap.mjs");

    expect(sitemap).toMatch(/visibility:\\s\*"public"/);
    expect(sitemap).toContain('path: "/world/command"');
    expect(sitemap).toContain('path: "/world/atlas"');
    expect(sitemap).not.toMatch(/function extractIds\(/);
  });

  it("keeps the operating-intelligence page off the unpublished creative catalog", () => {
    const ai = read("src/pages/AiSolutions.tsx");

    expect(ai).not.toContain("publicProjects");
    expect(ai).not.toContain("ProjectCard");
    expect(ai).not.toContain("findStudioProject");
    expect(ai).not.toContain("DEMO_SIGNALS");
    expect(ai).toContain("publicSystems");
    expect(ai).toContain("useSiteCopy");
    expect(ai).toContain("to={`/world/${system.id}`}");
    expect(ai).toContain('to="/world/command"');
    expect(ai).toContain('to="/world/atlas"');
  });
});
