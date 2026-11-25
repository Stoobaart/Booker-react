import { theft, victim } from "./victim";

export const OS_NAME = "Gates";
export const BROWSER_NAME = "Wayfarer";
export const CLOCK = "23:41";

// Newest first. Ordinary reading: the news, and the theft at his work again and again
export const browserHistory = [
  {
    day: "Wednesday 3 March",
    visits: [
      { time: "23:12", title: `${victim.employer} theft: still no arrests, three weeks on`, site: "londonherald.co.uk" },
      { time: "22:58", title: `Police renew appeal over ${victim.employer} raid`, site: "dailycourier.co.uk" },
      { time: "19:30", title: "London weather: rain all week", site: "weatherline.co.uk" },
    ],
  },
  {
    day: "Sunday 28 February",
    visits: [
      { time: "01:44", title: `How was ${theft.amount} taken from a City vault?`, site: "capitalpost.co.uk" },
      { time: "01:20", title: `${victim.employer} raid: what we know so far`, site: "londonherald.co.uk" },
      { time: "00:52", title: "Saturday's football: results and reports", site: "dailycourier.co.uk" },
    ],
  },
  {
    day: "Wednesday 24 February",
    visits: [
      { time: "02:15", title: `${victim.employer} insurers to pay out after vault theft`, site: "capitalpost.co.uk" },
      { time: "02:03", title: `${victim.employer} theft: police question staff`, site: "uknewsnow.com" },
    ],
  },
  {
    day: "Tuesday 16 February",
    visits: [
      { time: "23:47", title: theft.headline, site: "londonherald.co.uk" },
      { time: "23:40", title: `${theft.amount} gone from ${victim.employer} overnight`, site: "uknewsnow.com" },
      { time: "23:31", title: theft.headline, site: "dailycourier.co.uk" },
      { time: "21:05", title: "TV listings: tonight", site: "uknewsnow.com" },
    ],
  },
];
