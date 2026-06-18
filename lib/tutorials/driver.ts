import { driver } from "driver.js";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { TourDefinition, TourStep } from "./types";

const ROUTE_SETTLE_MS = 400;

export function waitForElement(
  selector: string,
  timeoutMs = 12000
): Promise<Element> {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    const poll = () => {
      const el = document.querySelector(selector);
      if (el) {
        resolve(el);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Tour target not found: ${selector}`));
        return;
      }
      requestAnimationFrame(poll);
    };

    poll();
  });
}

function waitForRoute(target: string, timeoutMs = 12000): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    const poll = () => {
      const path = window.location.pathname;
      if (path === target || path.startsWith(`${target}/`)) {
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Tour route not reached: ${target}`));
        return;
      }
      requestAnimationFrame(poll);
    };

    poll();
  });
}

async function ensureStepVisible(
  step: TourStep,
  router: AppRouterInstance
): Promise<void> {
  if (step.route) {
    const path = window.location.pathname;
    const target = step.route;
    if (path !== target && !path.startsWith(`${target}/`)) {
      router.push(target);
      await waitForRoute(target);
      await new Promise((r) => setTimeout(r, ROUTE_SETTLE_MS));
    }
  }
  await waitForElement(step.element);
}

export type TourRunResult = "completed" | "dismissed";

function showStep(
  step: TourStep,
  index: number,
  total: number
): Promise<"next" | "prev" | "dismiss"> {
  return new Promise((resolve) => {
    let settled = false;
    const isFirst = index === 1;
    const isLast = index === total;

    const settle = (value: "next" | "prev" | "dismiss") => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const stepButtons: Array<"next" | "previous" | "close"> = isFirst
      ? ["next", "close"]
      : ["previous", "next", "close"];

    const driverObj = driver({
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayOpacity: 0.55,
      popoverClass: "hrm-tour-popover",
      showButtons: stepButtons,
      showProgress: true,
      nextBtnText: isLast ? "Finish" : "Next",
      prevBtnText: "Back",
      steps: [
        {
          element: step.element,
          popover: {
            title: step.title,
            description: step.description,
            side: step.side ?? "bottom",
            align: step.align ?? "start",
            showButtons: stepButtons,
            showProgress: true,
            progressText: `${index} of ${total}`,
            nextBtnText: isLast ? "Finish" : "Next",
            prevBtnText: "Back",
          },
        },
      ],
      onNextClick: (_el, _step, { driver: d }) => {
        settle("next");
        d.destroy();
      },
      onPrevClick: (_el, _step, { driver: d }) => {
        settle("prev");
        d.destroy();
      },
      onCloseClick: (_el, _step, { driver: d }) => {
        settle("dismiss");
        d.destroy();
      },
      onDestroyed: () => {
        if (!settled) settle("dismiss");
      },
    });

    driverObj.drive();
  });
}

export async function runGuidedTour(
  tour: TourDefinition,
  router: AppRouterInstance
): Promise<TourRunResult> {
  let index = 0;

  while (index < tour.steps.length) {
    const step = tour.steps[index];

    try {
      await ensureStepVisible(step, router);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[tour] Skipping step ${index + 1}/${tour.steps.length}:`,
          step.element,
          err
        );
      }
      index += 1;
      continue;
    }

    const result = await showStep(step, index + 1, tour.steps.length);
    if (result === "dismiss") return "dismissed";
    if (result === "prev") {
      index = Math.max(0, index - 1);
      continue;
    }
    index += 1;
  }

  return "completed";
}
