// (function IIFE() {

// Selectors
const controls = {
  up: {
    label: document.querySelector("#upSite"),
    button: document.querySelector("#up"),
  },
  left: {
    label: document.querySelector("#leftSite"),
    button: document.querySelector("#left"),
  },
  current: {
    label: document.querySelector("#currentSite"),
    button: document.querySelector("#current"),
  },
  right: {
    label: document.querySelector("#rightSite"),
    button: document.querySelector("#right"),
  },
  down: {
    label: document.querySelector("#downSite"),
    button: document.querySelector("#down"),
  },
}

// Siteroom stuff
const DIRECTIONS = ["left", "right", "up", "down"]
function oppositeDirection(direction) {
  switch (direction) {
    case "left":
      return "right";
    case "right":
      return "left";
    case "up":
      return "down";
    case "down":
      return "up";
  }
}
class Site {
  constructor(name, { prev, direction } = {}) {
    this.name = name
    if (direction) {
      this[direction] = prev
    }
    this.setRelatedSites()
  }
  setRelatedSites() {
    fetchSites(this.name).then(sites => {
      sites = sites.filter(s => Site.addSite(s))
      for (const direction of DIRECTIONS) {
        this[direction] = this[direction] || { name: sites.pop() }
        controls[direction].label.textContent = this[direction].name
        controls[direction].button.hidden = !this[direction].name
      }
    })
  }
  move(moveDirection) {
    let nextCurrent = this[moveDirection]
    if (!(nextCurrent instanceof Site)) {
      // make nextCurrent is a proper Site object
      nextCurrent = new Site(nextCurrent.name, { prev: this, direction: oppositeDirection(moveDirection) })
      // update current site's neighbor reference to hold proper Site object
      this[moveDirection] = nextCurrent
    } else {
      for (const direction of DIRECTIONS) {
        const name = nextCurrent[direction].name
        controls[direction].label.textContent = name
        controls[direction].button.hidden = !name
      }
    }
    controls.current.label.textContent = nextCurrent.name
    return nextCurrent
  }
  static addSite(name) {
    if (Site.sites.has(name)) {
      return false
    }
    Site.sites.add(name)
    return true
  }
}
Site.sites = new Set()

// Initialization
const siteName = location.hash && location.hash.slice(1) || "google.com"
Site.addSite(siteName)
let currentLocation = new Site(siteName)
controls.current.label.textContent = siteName
// Setup control button click handlers
for (const direction of DIRECTIONS) {
  controls[direction].button.addEventListener("click", () => {
    currentLocation = currentLocation.move(direction)
  })
}

// Logic
function fetchSites(site) {
  if (site === '') {
    return
  }
  return fetch(`/lookup?site=${encodeURIComponent(site)}`).then(response => {
    return response.json()
  }).then(({ relatedSites }) => {
    return relatedSites;
  })
}
// })()
