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
const DIRS = ['left', 'right', 'up', 'down']
function oppositeDirection(dir) {
  switch (dir) {
    case 'left':
      return 'right';
    case 'right':
      return 'left';
    case 'up':
      return 'down';
    case 'down':
      return 'up';
  }
}
class Site {
  constructor(name, { prev, dir } = {}) {
    this.name = name
    if (dir) {
      this[dir] = prev
    }
    this.setRelatedSites()
  }
  setRelatedSites() {
    fetchSites(this.name).then(sites => {
      sites = sites.filter(s => Site.addSite(s))
      for (const dir of DIRS) {
        this[dir] = this[dir] || { name: sites.pop() }
        controls[dir].label.textContent = this[dir].name
        controls[dir].button.hidden = !this[dir].name
      }
    })
  }
  move(dir) {
    let nextCurrent = this[dir]
    if (!(nextCurrent instanceof Site)) {
      // make nextCurrent is a proper Site object
      nextCurrent = new Site(nextCurrent.name, { prev: this, dir: oppositeDirection(dir) })
      // update current site's neighbor reference to hold proper Site object
      this[dir] = nextCurrent
    } else {
      for (const dir of DIRS) {
        const name = nextCurrent[dir].name
        controls[dir].label.textContent = name
        controls[dir].button.hidden = !name
      }
    }
    controls.current.label.textContent = nextCurrent.name
    openSite(`http://${nextCurrent.name}`)
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
const SCREEN_NAME = "galactica"
const siteName = location.hash && location.hash.slice(1) || "google.com"
Site.addSite(siteName)
let currentLocation = new Site(siteName)
controls.current.label.textContent = siteName
// Setup control button click handlers
for (const dir of DIRS) {
  controls[dir].button.addEventListener("click", () => {
    currentLocation = currentLocation.move(dir)
  })
}
openSite(`http://${siteName}`)

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

function openSite(url) {
  const windowRef = window.open(url, SCREEN_NAME, "menubar=0")
  if (windowRef) {
    return windowRef
  } else {
    alert("Are you alive? Please allow popups for this site.")
  }
}
// })()
