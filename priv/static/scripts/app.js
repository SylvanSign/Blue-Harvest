// (function IIFE() {

// Selectors
const controls = {
  up: document.querySelector("#upSite"),
  left: document.querySelector("#leftSite"),
  current: document.querySelector("#currentSite"),
  right: document.querySelector("#rightSite"),
  down: document.querySelector("#downSite"),
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
        controls[dir].textContent = this[dir].name
      }
    })
  }
  move(dir) {
    let nextCurrent = this[dir]
    if (!(nextCurrent instanceof Site)) {
      // make nextCurrent is a proper Site object
      nextCurrent = new Site(nextCurrent, { prev: this, dir: oppositeDirection(dir) })
      // update current site's neighbor reference to hold proper Site object
      this[dir] = nextCurrent
    }
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
controls.current.textContent = siteName
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
