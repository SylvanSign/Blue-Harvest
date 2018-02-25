(function IIFE() {
  // Initialization
  const SCREEN_NAME = "galactica"
  openSite(`${SCREEN_NAME}.html`)

  // Selectors


  // Logic
  function fetchSites(site) {
    if (site === '') {
      return
    }
    submit.setAttribute("disabled", true)
    submit.textContent = "Thinking..."
    fetch(`/lookup?site=${encodeURIComponent(site)}`).then(response => {
      return response.json()
    }).then(data => {
      openSite(`http://${site}`, SCREEN_NAME)
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

  function openSite(url) {
    const windowRef = window.open(url, SCREEN_NAME, "menubar=0")
    if (windowRef) {
      return windowRef
    } else {
      alert("Are you alive? Please allow popups for this site.")
    }
  }
})()
