'use strict'

const {
  addNode,
  addLink,
  activateNode,
  clearGraph,
} = require('./graph')

const {
  validateSite,
  fetchSimilarSites,
} = require('./serverApi')

const AUTO_ACTIVATION_DELAY = 500 // ms

window.onLandingPage = true

let currentSite
let renderer

const controlsInfo = document.querySelector("#controls")
const siteSearch = document.querySelector("#siteSearch")
// disable right click menu so it doesn't ruin the immersion
document.querySelector("body").addEventListener('contextmenu', event => event.preventDefault())
document.querySelector("#exploreButton").onclick = teleportToSite
document.querySelector("#backButton").onclick = goToLandingPage


window.addEventListener("keydown", e => {
  const ENTER = 13
  if (siteSearch === document.activeElement) {
    if (e.keyCode === ENTER) {
      teleportToSite()
    }
  }
})

function reset(siteName) {
  clearGraph()
  currentSite = siteName

  addNode(siteName)

  setTimeout(() => activateNode(siteName), AUTO_ACTIVATION_DELAY)
}

async function teleportToSite() {
  let name = siteSearch.value.toLowerCase()
  const validatedSiteName = await validateSite(name)
  if (validatedSiteName === "error") {
    document.querySelector('#helper').hidden = false
  } else {
    reset(validatedSiteName)
    window.onLandingPage = false
    document.querySelector("#mapLabels").hidden = false
    document.querySelector("#landingLabelsContainer").hidden = true
    document.querySelector('#helper').hidden = true
  }
}

function goToLandingPage() {
  document.querySelector("#mapLabels").hidden = true
  document.querySelector("#landingLabelsContainer").hidden = false
  document.querySelector("#infoPopup").hidden = true
  window.onLandingPage = true

  siteSearch.focus()
  siteSearch.value = ""
}
