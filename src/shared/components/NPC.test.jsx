import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NPC from "./NPC";
import {
  renderWithProviders,
  createMockPlayer,
} from "../../test/renderWithProviders";
import { isSpriteHit } from "../utils/spriteHitTest";

// jsdom can't read image pixels, so tests decide whether the pointer is on the sprite
vi.mock("../utils/spriteHitTest", () => ({ isSpriteHit: vi.fn(() => true) }));

const staticNpc = {
  id: "busker",
  name: "Busker",
  sprite: "busker.png",
  position: { x: "300px", y: "700px" },
};

const animatedNpc = {
  id: "station-worker",
  name: "Station Worker",
  sprite: "derek.png",
  spriteSheet: {
    columns: 16,
    rows: 3,
    width: "12.5rem",
    height: "22.625rem",
    idle: { name: "breathe", row: 0, frames: 8, duration: 1000 },
    actions: [
      { name: "check-watch", row: 1, frames: 16, duration: 2000 },
      { name: "scratch-chin", row: 2, frames: 16, duration: 2000 },
    ],
    idleLoops: [2, 5],
  },
  position: { x: "1125px", y: "773px" },
  talkPosition: { x: "930px", y: "700px" },
};

const getSprite = (name) => screen.getByAltText(name);

// Frank never arrives, so the dialogue modal (and the API behind it) stays closed
const walkingPlayer = () => createMockPlayer({ walkTo: vi.fn() });

describe("NPC", () => {
  it("renders a plain image when there is no sprite sheet", () => {
    renderWithProviders(<NPC npc={staticNpc} />);
    expect(getSprite("Busker")).toHaveAttribute("src", "busker.png");
    expect(getSprite("Busker")).not.toHaveClass("npc__sprite--sheet");
  });

  it("talk walks to the NPC position by default, keeping the way Frank walked in", async () => {
    const { player } = renderWithProviders(<NPC npc={staticNpc} />, {
      player: walkingPlayer(),
    });
    await userEvent.click(getSprite("Busker"));
    await userEvent.click(screen.getByRole("button"));
    expect(player.walkTo).toHaveBeenCalledWith(
      "300px",
      "700px",
      expect.any(Function),
      { face: undefined },
    );
  });

  it("talk walks to talkPosition and turns Frank to face the NPC", async () => {
    const { player } = renderWithProviders(<NPC npc={animatedNpc} />, {
      player: walkingPlayer(),
    });
    await userEvent.click(getSprite("Station Worker"));
    await userEvent.click(screen.getByRole("button"));
    expect(player.walkTo).toHaveBeenCalledWith(
      "930px",
      "700px",
      expect.any(Function),
      { face: "right" },
    );
  });

  it("faces left when the NPC is to the left of talkPosition", async () => {
    const npc = { ...animatedNpc, talkPosition: { x: "1300px", y: "700px" } };
    const { player } = renderWithProviders(<NPC npc={npc} />, {
      player: walkingPlayer(),
    });
    await userEvent.click(getSprite("Station Worker"));
    await userEvent.click(screen.getByRole("button"));
    expect(player.walkTo).toHaveBeenCalledWith(
      "1300px",
      "700px",
      expect.any(Function),
      { face: "left" },
    );
  });

  describe("clicking the transparent part of the sprite", () => {
    let below;
    let onBelowClick;

    beforeEach(() => {
      isSpriteHit.mockReturnValue(false);
      below = document.createElement("div");
      onBelowClick = vi.fn();
      below.addEventListener("click", onBelowClick);
      below.addEventListener("dblclick", onBelowClick);
      document.body.appendChild(below);
      // jsdom has no layout, so say what is stacked under the pointer
      document.elementsFromPoint = vi.fn(() => [getSprite("Busker"), below]);
    });

    afterEach(() => {
      isSpriteHit.mockReturnValue(true);
      below.remove();
      delete document.elementsFromPoint;
    });

    it("passes the click to whatever is underneath instead of opening the menu", () => {
      renderWithProviders(<NPC npc={staticNpc} />);
      fireEvent.click(getSprite("Busker"), { clientX: 320, clientY: 640 });

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(onBelowClick).toHaveBeenCalledOnce();
      expect(onBelowClick.mock.calls[0][0]).toMatchObject({
        type: "click",
        clientX: 320,
        clientY: 640,
      });
    });

    it("passes double clicks through too", () => {
      renderWithProviders(<NPC npc={staticNpc} />);
      fireEvent.doubleClick(getSprite("Busker"), { clientX: 320, clientY: 640 });
      expect(onBelowClick.mock.calls[0][0]).toMatchObject({
        type: "dblclick",
        clientX: 320,
        clientY: 640,
      });
    });

    it("closes an open menu", () => {
      isSpriteHit.mockReturnValue(true);
      renderWithProviders(<NPC npc={staticNpc} />);
      fireEvent.click(getSprite("Busker"));
      expect(screen.getByRole("button")).toBeInTheDocument();

      isSpriteHit.mockReturnValue(false);
      fireEvent.click(getSprite("Busker"));
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("only shows the pointer cursor over the drawn sprite", () => {
      renderWithProviders(<NPC npc={staticNpc} />);
      const npc = getSprite("Busker").closest(".npc");

      fireEvent.mouseMove(npc);
      expect(npc).not.toHaveClass("npc--hovered");

      isSpriteHit.mockReturnValue(true);
      fireEvent.mouseMove(npc);
      expect(npc).toHaveClass("npc--hovered");

      fireEvent.mouseLeave(npc);
      expect(npc).not.toHaveClass("npc--hovered");
    });
  });

  describe("sprite sheet animation", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("starts on the idle row, sized to one frame", () => {
      renderWithProviders(<NPC npc={animatedNpc} />);
      const sprite = getSprite("Station Worker");
      expect(sprite).toHaveAttribute("data-animation", "breathe");
      expect(sprite.style.getPropertyValue("--row")).toBe("0");
      expect(sprite.style.getPropertyValue("--frames")).toBe("8");
      expect(sprite.style.getPropertyValue("--duration")).toBe("1000ms");
      expect(sprite.parentElement).toHaveStyle({
        width: "12.5rem",
        height: "22.625rem",
      });
    });

    it("cuts to an action after a few idle loops, then returns to idle", () => {
      // random 0 -> fewest idle loops (2) and the first action
      vi.spyOn(Math, "random").mockReturnValue(0);
      renderWithProviders(<NPC npc={animatedNpc} />);

      act(() => vi.advanceTimersByTime(1999));
      expect(getSprite("Station Worker")).toHaveAttribute(
        "data-animation",
        "breathe",
      );

      act(() => vi.advanceTimersByTime(1));
      expect(getSprite("Station Worker")).toHaveAttribute(
        "data-animation",
        "check-watch",
      );
      expect(getSprite("Station Worker").style.getPropertyValue("--row")).toBe(
        "1",
      );

      act(() => vi.advanceTimersByTime(2000));
      expect(getSprite("Station Worker")).toHaveAttribute(
        "data-animation",
        "breathe",
      );
    });

    it("picks between the actions at random", () => {
      // random just under 1 -> most idle loops (5) and the last action
      vi.spyOn(Math, "random").mockReturnValue(0.999);
      renderWithProviders(<NPC npc={animatedNpc} />);

      act(() => vi.advanceTimersByTime(5000));
      expect(getSprite("Station Worker")).toHaveAttribute(
        "data-animation",
        "scratch-chin",
      );
    });
  });
});
