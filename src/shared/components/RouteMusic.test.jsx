import { describe, it, expect, vi, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, Outlet } from "react-router-dom";
import RouteMusic from "./RouteMusic";
import { musicForPath } from "../data/routeMusic";

const renderAt = (path) => {
  const router = createMemoryRouter(
    [{
      element: <><RouteMusic /><Outlet /></>,
      children: ["/", "/great-portland-street", "/great-portland-street-ticket-hall", "/great-portland-street-exterior", "/residential-street", "/victims-flat-hallway", "/victims-flat-kitchen", "/beginnings"]
        .map((p) => ({ path: p, element: <div /> })),
    }],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

describe("musicForPath", () => {
  it("gives the platform and ticket hall the same track", () => {
    const track = musicForPath("/great-portland-street");
    expect(track).not.toBeNull();
    expect(musicForPath("/great-portland-street-ticket-hall")).toBe(track);
  });

  it("gives the station exterior and residential street their own shared track", () => {
    const track = musicForPath("/great-portland-street-exterior");
    expect(track).not.toBeNull();
    expect(track).not.toBe(musicForPath("/great-portland-street"));
    expect(musicForPath("/residential-street")).toBe(track);
  });

  it("gives all the flat's rooms one shared track of their own", () => {
    const track = musicForPath("/victims-flat-hallway");
    expect(track).not.toBeNull();
    expect(track).not.toBe(musicForPath("/residential-street"));
    for (const room of ["/victims-flat-living-room", "/victims-flat-kitchen", "/victims-flat-bedroom"]) {
      expect(musicForPath(room)).toBe(track);
    }
  });

  it("gives other scenes no track", () => {
    expect(musicForPath("/")).toBeNull();
    expect(musicForPath("/beginnings")).toBeNull();
  });
});

describe("RouteMusic", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps each track playing across its scenes, switching tracks between them", async () => {
    const play = vi.spyOn(window.HTMLMediaElement.prototype, "play");
    const pause = vi.spyOn(window.HTMLMediaElement.prototype, "pause");
    const tracks = () => play.mock.contexts.map((audio) => audio.src.split("/").pop());
    const router = renderAt("/great-portland-street");
    expect(tracks()).toEqual([expect.stringMatching(/^thriller/)]);

    await act(() => router.navigate("/great-portland-street-ticket-hall"));
    expect(play).toHaveBeenCalledTimes(1);
    expect(pause).not.toHaveBeenCalled();

    await act(() => router.navigate("/great-portland-street-exterior"));
    expect(pause).toHaveBeenCalledTimes(1);
    expect(tracks()).toEqual([expect.stringMatching(/^thriller/), expect.stringMatching(/^noir/)]);

    await act(() => router.navigate("/residential-street"));
    expect(play).toHaveBeenCalledTimes(2);
    expect(pause).toHaveBeenCalledTimes(1);

    await act(() => router.navigate("/victims-flat-hallway"));
    expect(pause).toHaveBeenCalledTimes(2);
    expect(tracks().at(-1)).toMatch(/^cold-dark-abandoned/);

    await act(() => router.navigate("/victims-flat-kitchen"));
    expect(play).toHaveBeenCalledTimes(3);
    expect(pause).toHaveBeenCalledTimes(2);

    await act(() => router.navigate("/beginnings"));
    expect(pause).toHaveBeenCalledTimes(3);
    expect(play).toHaveBeenCalledTimes(3);
  });

  it("plays nothing on a scene without a track", () => {
    const play = vi.spyOn(window.HTMLMediaElement.prototype, "play");
    renderAt("/");
    expect(play).not.toHaveBeenCalled();
  });
});
