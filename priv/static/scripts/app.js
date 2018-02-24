(function IIFE() {
  // Initialization
  const SCREEN_NAME = "galacticas"

  // Selectors
  const input = document.querySelector("#input")
  const test = document.querySelector("#test")
  const siteList = document.querySelector("#site-list")
  const submit = document.querySelector("#submit")

  const sites = []
  const known_sites = []

  resetInput()

  // Logic
  let win
  test.addEventListener("click", () => {
    win = window.open("screen.html", '', "menubar=0")
    // Should establish one-way-only communication from RC to Screen
    win.opener = null
    test.remove()
    input.hidden = false
    submit.hidden = false
  }, { once: true })

  function resetInput() {
    input.select()
    submit.removeAttribute("disabled")
    submit.textContent = "GO"
  }

  function makeXImage() {
    const x = new Image(10, 10)
    x.src = "images/x.png"
    return x
  }

  function createSitelist() {
    siteList.innerHTML = ''
    unknown_sites = sites.filter(site => known_sites.includes(site) === false)
    for (const site of unknown_sites) {
      const item = document.createElement("li")
      const text = document.createTextNode(site)
      item.appendChild(text)
      const x = makeXImage();
      item.appendChild(x)
      siteList.appendChild(item)

      x.onclick = function () {
        item.remove()
        const siteName = text.textContent
        known_sites.push(siteName)
        input.value = siteName
        fetchSites(siteName)
      }
    }
  }

  function fetchSites(site) {
    if (site === '') {
      return
    }
    submit.setAttribute("disabled", true)
    submit.textContent = "Thinking..."
    fetch(`/lookup?site=${encodeURIComponent(site)}`).then(response => {
      return response.json()
    }).then(data => {
      openSite(site)
      const {
        relatedSites
      } = data
      for (const site of relatedSites) {
        if (!sites.includes(site)) {
          sites.push(site)
        }
        sites.sort()
        createSitelist()
      }
    }).catch((err => {
      console.error(err)
    })).then(() => {
      resetInput()
    })
  }

  function openSite(site) {
    win.location = `http://${site}`
  }

  function fetchSitesTextbox() {
    fetchSites(input.value.trim())
  }

  input.addEventListener("keydown", e => {
    if (e.keyCode === 13) {
      fetchSitesTextbox()
    }
  })
  submit.addEventListener("click", fetchSitesTextbox)
})()
