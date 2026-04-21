import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useParams: () => ({}),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...p }: Record<string, unknown>) =>
    Object.assign(document.createElement("img"), { src, alt, ...p }),
}));

// js-cookie no existe en jsdom — mock mínimo
vi.mock("js-cookie", () => ({
  default: {
    get: vi.fn(() => undefined),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));
