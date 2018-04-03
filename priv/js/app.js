'use strict'

const {
  addNode,
  addLink,
  activateNode,
  clearGraph,
} = require('./graph')

const AUTO_ACTIVATION_DELAY = 1500 // ms

let currentSite
let renderer

const siteLabel = document.querySelector("#siteLabel")
const descriptionLabel = document.querySelector("#descriptionLabel")
const icon = document.querySelector("#icon")
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
  siteLabel.textContent = ""
  descriptionLabel.textContent = ""
  icon.hidden = true

  addNode(siteName)

  setTimeout(() => activateNode(siteName), AUTO_ACTIVATION_DELAY)
}

function teleportToSite() {
  reset(siteSearch.value)
  document.querySelector("#mapLabels").hidden = false
  document.querySelector("#landingLabelsContainer").hidden = true
}

function goToLandingPage() {
  document.querySelector("#mapLabels").hidden = true
  document.querySelector("#landingLabelsContainer").hidden = false

  siteSearch.focus()
  siteSearch.value = ""
}

function setSiteLabel(text) {
  siteLabel.href = `http://${text}`
  siteLabel.textContent = text
}

function setDescriptionLabel(text) {
  descriptionLabel.textContent = text
}

function setIcon(image) {
  if (image === "") {
    icon.hidden = true;
  } else {
    icon.hidden = false;
    icon.src = image;
  }
}
