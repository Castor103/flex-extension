## 0. ref

- 참조 사이트
    - 오픈소스 참조
        - https://yscho03.tistory.com/103
        - https://github.com/yscho03/sample_chrome_extension
    - 크롬 공식 참조
        - https://developer.chrome.com/docs/extensions/get-started?hl=ko

- 크롬 확장 관리탭
    - chrome://extensions/

## 1. memo

### 1.1 버튼동작 Popup.html -> Popup.js -> Contents.js

- 수행 조건으로 현재 활성화된 탭을 기준으로 content.js가 동작을 수행해야함.

popup.html
```html
<button id="doSomething">불러오기</button>
```

popup.js
```js
document.getElementById("doSomething").addEventListener("click", () => {

    // 활성 탭에서 Content Script 실행
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
            {
                target: { tabId: tabs[0].id },
                files: ["content.js"]
            },
            () => {
            //Content Script 실행 후 메시지 받기
                chrome.runtime.onMessage.addListener((message) => {
                    console.log("OK", message);
                    (...)
                });
            }
        );
    });
});
```

content.js
```js
chrome.runtime.sendMessage({ text_span : Array.from(document.querySelectorAll("span")).map(title => title.textContent.trim()), updateTime: new Date().toISOString() }, (response) => {
    if (chrome.runtime.lastError) {
        console.error("Message send failed:", chrome.runtime.lastError);
    } else {
        console.log("Message sent successfully", response);
    }
});
```


### 1.2 버튼동작 Popup.html -> Popup.js -> Background.js

- 단순 버튼 클릭 이벤트에 의한 background.js에서의 동작 수행.

popup.html
```html
<button id="doSomething">불러오기</button>
```

popup.js
```js
document.getElementById("doSomething").addEventListener("click", () => {
    // Background Script에 메시지 보내기
    chrome.runtime.sendMessage({ action: "doSomething" }, (response) => {
    });
});

```

background.js
```js
function doSomethingFunction() {
    (,,,)
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //console.log("message", message);
    if (message.action === "doSomething") {
        console.log("OK to doSomething");
        doSomethingFunction();
        sendResponse({ status: "doSomething started" });
    } else {
        //console.log("Failed to fetch data from the page");
    }
});
```


## A. VSCode 파일별 이종 포멧터 설정

- VSCode 플러그인에서 Prettier - Code formatter 설치
- VSCode의 settings.json 파일을 열기
    - Ctrl+',' or Cmd+',' 에서 settings.json 검색해서 settings.json 열기
- 다음 추가
```json
{
  // 웹 관련 파일에는 Prettier 적용
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // C/C++ 파일에는 기존 포맷터 사용
  "[cpp]": {
    "editor.defaultFormatter": "ms-vscode.cpptools"
  },
  "[c]": {
    "editor.defaultFormatter": "ms-vscode.cpptools"
  },

  // 파일 저장 시 자동 포맷팅
  "editor.formatOnSave": true
}
```    

### A.1 추가전후 예시

- 추가 전
```json
{
    "workbench.colorTheme": "Default Dark+",
    "[python]": {
        "editor.formatOnType": true
    },
    "terminal.integrated.scrollback": 2000,
    "tabnine.experimentalAutoImports": true,
    "git.confirmSync": false,
    "security.workspace.trust.untrustedFiles": "open",
    "logViewer.watch": [

       
    ],
    "diffEditor.ignoreTrimWhitespace": false,
    "terminal.integrated.bellDuration": 3000,
    "plantuml.jar": "/opt/homebrew/Cellar/plantuml/1.2023.12/libexec/plantuml.jar",
    "window.zoomLevel": -1,
    "javascript.updateImportsOnFileMove.enabled": "never",
    "extensions.ignoreRecommendations": true,
    "csharp.experimental.dotnetNewIntegration": false,
    "dotnet.automaticallyCreateSolutionInWorkspace": false,
    "explorer.autoReveal": false,
    "[javascript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "remote.SSH.defaultForwardedPorts": [],
    "remote.SSH.logLevel": "trace",
    "remote.SSH.useExecServer": false,
    "remote.SSH.enableDynamicForwarding": false,
    "codeSight.telemetry.enablement": false,
    "json.schemas": [
        {
            "fileMatch": [
                "*coverity.conf"
            ],
            "url": "file:/home/stbtest1/.vscode-server/extensions/synopsys-coverity.vscode-coverity-conf-2022.5.0/resources/coverity.conf.schema.json"
        }
    ],
    "cmake.pinnedCommands": [
        "workbench.action.tasks.configureTaskRunner",
        "workbench.action.tasks.runTask"
    ],
    "terminal.integrated.commandsToSkipShell": [
        "language-julia.interrupt"
    ],
    "julia.symbolCacheDownload": true,
    "editor.defaultFormatter": "ms-vscode.cpptools",
    "C_Cpp.clang_format_fallbackStyle": "Google",
    "eslint.codeActionsOnSave.rules": null,
    "workbench.settings.applyToAllProfiles": [
    ],
}
```

- 추가 후
```json
{
    "workbench.colorTheme": "Default Dark+",
    "[python]": {
        "editor.formatOnType": true
    },
    "terminal.integrated.scrollback": 2000,
    "tabnine.experimentalAutoImports": true,
    "git.confirmSync": false,
    "security.workspace.trust.untrustedFiles": "open",
    "logViewer.watch": [

       
    ],
    "diffEditor.ignoreTrimWhitespace": false,
    "terminal.integrated.bellDuration": 3000,
    "plantuml.jar": "/opt/homebrew/Cellar/plantuml/1.2023.12/libexec/plantuml.jar",
    "window.zoomLevel": -1,
    "javascript.updateImportsOnFileMove.enabled": "never",
    "extensions.ignoreRecommendations": true,
    "csharp.experimental.dotnetNewIntegration": false,
    "dotnet.automaticallyCreateSolutionInWorkspace": false,
    "explorer.autoReveal": false,
    "[javascript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[typescript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[javascriptreact]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[typescriptreact]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "remote.SSH.defaultForwardedPorts": [],
    "remote.SSH.logLevel": "trace",
    "remote.SSH.useExecServer": false,
    "remote.SSH.enableDynamicForwarding": false,
    "codeSight.telemetry.enablement": false,
    "json.schemas": [
        {
            "fileMatch": [
                "*coverity.conf"
            ],
            "url": "file:/home/stbtest1/.vscode-server/extensions/synopsys-coverity.vscode-coverity-conf-2022.5.0/resources/coverity.conf.schema.json"
        }
    ],
    "cmake.pinnedCommands": [
        "workbench.action.tasks.configureTaskRunner",
        "workbench.action.tasks.runTask"
    ],
    "terminal.integrated.commandsToSkipShell": [
        "language-julia.interrupt"
    ],
    "julia.symbolCacheDownload": true,
    "editor.defaultFormatter": "ms-vscode.cpptools",
    "editor.formatOnSave": true,
    "C_Cpp.clang_format_fallbackStyle": "Google",
    "eslint.codeActionsOnSave.rules": null,
    "workbench.settings.applyToAllProfiles": [
        
    ],
    
}
```