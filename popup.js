document.addEventListener("DOMContentLoaded", () => {
    // manifest.json 정보 가져오기
    const manifestData = chrome.runtime.getManifest();
      
    document.getElementById("version").textContent = manifestData.version;
    document.getElementById("name").textContent = manifestData.name;
    document.getElementById("description").textContent = manifestData.description;
  });