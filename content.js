;(() => {
  const header = document.querySelector('.c-upfCI')
  if (header === undefined) {
    return
  } else {
    fetchDataFunction()
  }

  // element 생성
  function createElement(tag, options = {}) {
    const { content, attributes = {} } = options
    const element = document.createElement(tag)

    // 설정
    if (content) element.innerHTML = content
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value)
    })

    return element
  }

  function fetchDataFunction() {
    const html = document.documentElement.outerHTML

    waitForSectionElement().then(() => {
      const hasEmailInput =
        document.querySelector('input[type="email"]') !== null
      const hasGoogleLoginText = html.includes('Google 계정으로 로그인')
      const requiresLogin = hasEmailInput || hasGoogleLoginText

      // 로그인 여부 판단
      if (requiresLogin) {
        chrome.runtime.sendMessage({ requiresLogin: true })
      } else {
        waitForSectionElement().then(() => {
          const updateTime = new Date().toISOString()

          const rawData = document.documentElement.outerHTML
          //console.log('rawData:', rawData);

          const workStatus = getPathWithClass()

          const todayWorkTime = getElementsWithClass('div.c-klJrXp')

          const totalWorkDoneTime = getElementsWithClass('span.c-hotmRC')
          const totalWorkDoneTimeFormatting = totalWorkDoneTime.split(':')
          const totalWorkDoneTimeHour = Number(totalWorkDoneTimeFormatting[0])
          const totalWorkDoneTimeMin = Number(totalWorkDoneTimeFormatting[1])

          if (totalWorkDoneTime === 'N/A') {
            return
          } else {
            // 휴가 검색용 클래스 필터값
            const className = 'c-ePuMfZ-lgczji-color-purple'
            const leaveDays = countElementsWithClass(className)

            // 토, 일, 공휴일 검색용 클래스 필터값
            const parentClass = 'c-hPMBFa' // div의 클래스
            const childClass = 'c-icjrvK-fmLUio-isHoliday-true'
            const findObj = extractSpanTextFromDiv(parentClass, childClass)
            const childNodesArray = findObj.parantObj

            // 평일에 해당하는 공휴일 계산
            const weekdayHolidays = findObj.childObj.filter((day) => {
              // 요일 데이터
              const dayOfWeek = day.slice(-1) // 마지막 문자 추출 (예: "수", "토")

              // 평일 요일만 포함 ("월", "화", "수", "목", "금")
              return ['월', '화', '수', '목', '금'].includes(dayOfWeek)
            })

            const result =
              calculateMonthlyWeekdaysAndEffectiveDays(weekdayHolidays)

            const totalWeekdays = result.totalWeekdays
            const workdoneDayCount = result.effectiveWeekdays
            const totalEffectiveWeekdays = result.totalEffectiveWeekdays

            // 계산 실행
            const averageResult = calculateAverageDailyWorkTime(
              todayWorkTime,
              totalWorkDoneTime,
              workdoneDayCount,
            )

            const averageWorkTime = averageResult.averageDailyWorkHours
            const totalMinutesWorked = averageResult.totalMinutesWorked

            const restEffectiveWeekdays =
              totalEffectiveWeekdays - workdoneDayCount
            let restNeedTime =
              totalEffectiveWeekdays * 7 * 60 - totalMinutesWorked
            if (restNeedTime <= 0) {
              restNeedTime = 0
            }

            const restNeedWorkTimePerDay = (
              restNeedTime /
              restEffectiveWeekdays /
              60
            ).toFixed(2)
            const restNeedWorkTimePerDayFormatting =
              restNeedWorkTimePerDay.split('.')
            const restNeedWorkTimePerDayHour = Math.floor(
              restNeedWorkTimePerDay,
            )
            const restNeedWorkTimePerDayMin = Math.round(
              (restNeedWorkTimePerDay - restNeedWorkTimePerDayHour) * 60,
            )

            // 업데이트된 시간 표시
            const timestampString = formatTimestampToKST(updateTime)
            const workdayCount = `${workdoneDayCount} 일` || 'N/A'

            // 데이터 확인용
            //console.log(`당월 총 일 배열: ${childNodesArray}`);
            //console.log(`당월 주말 포함 공휴일 배열: ${findObj.childObj}`);
            //console.log(`평일중 공휴일 배열: ${weekdayHolidays}`);
            //console.log(`오늘까지의 평일 갯수: ${totalWeekdays}`);

            // 상시 획득 가능 값
            // console.log(`근무 상태: ${workStatus}`)
            // console.log(`금일 근로시간: ${todayWorkTime}`)
            //console.log(`당월 신청한 연월차 수: ${leaveDays}`);
            //console.log(`당월 일일 총 개수: ${findObj.parantObj.length}`);
            //console.log(`금일까지의 근로 가능일: ${workdoneDayCount} 일`);
            //console.log(`당월 총 근로시간: ${totalWorkDoneTime}`);
            //console.log(`당월 총 근로 가능 일 갯수: ${totalEffectiveWeekdays}`);
            //console.log(`당월 잔여 근무 일: ${restEffectiveWeekdays}`);
            //console.log(`당월 잔여 근무 시간: ${restNeedTime} 분`);
            //console.log(`당월 잔여 근무 시간 / 일: ${restNeedWorkTimePerDay} 시간`);

            // 획득값 출력 예시)
            // 근무 상태: 근무중
            // 당월 신청한 연월차 수: 1
            // 당월 일일 총 개수: 31
            // 금일까지의 근로 가능일: 13 일
            // 금일 근로시간: 10시간 34분
            // 당월 총 근로시간: 100:49
            // 당월 총 근로 가능 일 갯수: 18
            // 당월 잔여 근무 일: 5
            // 당월 잔여 근무 시간: 877 분
            // 당월 잔여 근무 시간 / 일: 2.92 시간

            // text 생성
            const monthHours = totalEffectiveWeekdays * 7
            const compareTime =
              totalWorkDoneTimeHour * 60 + totalWorkDoneTimeMin
            const timePercentage = (compareTime / (monthHours * 60)) * 100
            function createText(type) {
              let text
              switch (type) {
                case 'working_day':
                  text = `
                    <span class="custom-ui__title-wrap">
                      <span class="custom-ui__title">근무일</span>
                      <span class="custom-ui__tooltip">휴가일을 포함하여 근무일이 계산됩니다.<br/>(현재 근무일 / 당월 의무 근무일)</span>
                    </span>
                    <span class="today">${workdoneDayCount}일</span>
                    <span class="total">${totalEffectiveWeekdays}일</span>
                  `
                  break
                case 'working_time':
                  text = `
                    <span class="custom-ui__title-wrap">
                      <span class="custom-ui__title">근무시간</span>
                      <span class="custom-ui__tooltip">휴가일을 포함하여 근무시간이 계산됩니다.<br/>(현재 총 근무시간 / 당월 의무 근무시간 (달성률))</span>
                    </span>
                    <span class="today">${totalWorkDoneTimeHour}시간 ${totalWorkDoneTimeMin}분</span>
                    <span class="total">${monthHours}시간</span>
                    <span class="percent">(${timePercentage.toFixed(2)}%)</span>
                  `
                  break
                case 'working_leftover':
                  text = `
                    <span class="custom-ui__title-wrap">
                      <span class="custom-ui__title">잔여시간</span>
                      <span class="custom-ui__tooltip">휴가일을 포함하여 잔여 근무시간이 계산됩니다.<br/>잔여 근무시간 (잔여 일당 최소 근무시간)</span>
                    </span>
                     <span class="today">${Math.floor(restNeedTime / 60)}시간 ${
                    restNeedTime % 60
                  }분 (${restNeedWorkTimePerDayHour}시간 ${restNeedWorkTimePerDayMin}분)</span>
                  `
                  break
                case 'working_holiday':
                  text = `
                    <span class="custom-ui__title-wrap">
                      <span class="custom-ui__title">휴가사용</span>
                    </span>
                    <span class="today">${leaveDays}일
                  `
                  break
              }
              return text
            }
            console.log('restNeedWorkTimePerDay', restNeedWorkTimePerDay)

            // 표출 부.
            const section = document.querySelector('.c-dHHzzw > *')
            const wrapper = document.querySelector('.custom-ui-wrap')
            const customUiWrap = createElement('div', {
              attributes: { class: 'custom-ui-wrap' },
            })
            const customUiItemWrap = createElement('div', {
              attributes: { class: 'custom-ui' },
            })
            // 표출 부 - 근무일
            const workingDay = createElement('div', {
              attributes: {
                class: 'custom-ui__item',
              },
              content: createText('working_day'),
            })
            // 표출 부 - 근무시간
            const workingTime = createElement('div', {
              attributes: {
                class: 'custom-ui__item',
              },
              content: createText('working_time'),
            })
            // 표출 부 - 잔여 근무시간
            const workingLeftoverTime = createElement('div', {
              attributes: {
                class: 'custom-ui__item',
              },
              content: createText('working_leftover'),
            })
            // 표출 부 - 휴가사용
            const workingHoliday = createElement('div', {
              attributes: {
                class: 'custom-ui__item custom-ui__item--holiday',
              },
              content: createText('working_holiday'),
            })
            if (wrapper) {
              workingDay.innerHTML = createText('working_day')
              workingTime.innerHTML = createText('working_time')
              workingLeftoverTime.innerHTML = createText('working_leftover')
              workingHoliday.innerHTML = createText('working_holiday')
            } else {
              section.insertBefore(customUiWrap, section.firstChild)
              customUiWrap.appendChild(customUiItemWrap)
              customUiItemWrap.appendChild(workingDay)
              customUiItemWrap.appendChild(workingTime)
              customUiItemWrap.appendChild(workingLeftoverTime)
              customUiItemWrap.appendChild(workingHoliday)
            }
          }
        })
      }
    })
  }
})()

function countWeekdaysUntilToday() {
  // 현재 날짜를 기준으로 오늘 날짜 구하기
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth() + 1 // 월은 0부터 시작하므로 1을 더함
  const currentYear = today.getFullYear()

  let weekdayCount = 0

  // 입력된 연도와 월의 첫날과 마지막 날 계산
  const startDate = new Date(currentYear, currentMonth - 1, 1) // month - 1: 월은 0부터 시작
  const endDate = new Date(currentYear, currentMonth, currentDay) // 해당 월의 마지막 날

  // 1일부터 오늘까지 반복하며 평일만 카운트
  for (
    let day = startDate;
    day <= today && day <= endDate;
    day.setDate(day.getDate() + 1)
  ) {
    // 요일을 확인 (0: 일요일, 1: 월요일, ..., 6: 토요일)
    const weekday = day.getDay()
    // 평일은 1 (월요일)부터 5 (금요일)까지
    if (weekday >= 1 && weekday <= 5) {
      weekdayCount++
    }
  }

  return weekdayCount
}

function calculateMonthlyWeekdaysAndEffectiveDays(holidays) {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() // 월 (0부터 시작)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate() // 해당 월의 마지막 날

  let totalWeekdays = 0 // 총 평일 수
  let effectiveWeekdays = 0 // 공휴일 제외 평일 수
  let holidaysUntilToday = 0 // 금일까지 공휴일 수
  let totalEffectiveWeekdays = 0 // 총 평일 중 공휴일 제외 일자

  // 1일부터 마지막 날까지 반복
  for (let day = 1; day <= lastDayOfMonth; day++) {
    const date = new Date(currentYear, currentMonth, day)
    const dayOfWeek = date.getDay()

    // 평일 확인 (월~금)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      totalWeekdays++ // 총 평일 수 증가

      // 공휴일 확인
      const holidayFound = holidays.some((holiday) => {
        const [holidayDay, holidayDayOfWeek] = [
          parseInt(holiday),
          holiday.slice(-1),
        ]
        return (
          holidayDay === day &&
          ['월', '화', '수', '목', '금'].includes(holidayDayOfWeek)
        )
      })

      if (!holidayFound) {
        // 공휴일이 아니라면 유효한 평일로 계산
        totalEffectiveWeekdays++
        if (day <= today.getDate()) {
          effectiveWeekdays++
        }
      } else if (day <= today.getDate()) {
        // 금일까지의 공휴일 수 증가
        holidaysUntilToday++
      }
    }
  }

  return {
    totalWeekdays, // 금번 달 총 평일 수
    totalEffectiveWeekdays, // 총 평일 중 공휴일 제외 일자
    effectiveWeekdays, // 금일까지 공휴일 제외 평일 수
    holidaysUntilToday, // 금일까지의 공휴일 수
  }
}

function calculateAverageDailyWorkTime(
  dailyWorkTime,
  totalWorkDoneTime,
  weekdaysUntilToday,
) {
  if (dailyWorkTime === 'N/A') {
    dailyWorkTime = '0시간 0분'
  }

  if (totalWorkDoneTime === 'N/A') {
    totalWorkDoneTime = '0:00'
  }

  if (weekdaysUntilToday === 0) {
    return 0
  } else {
    // 오늘 근무 시간 (시간, 분으로 변환)
    const dailyWorkParts = dailyWorkTime
      .split('시간')
      .map((item) => item.trim())
      .filter(Boolean)
    const dailyHours = parseInt(dailyWorkParts[0])
    const dailyMinutes = dailyWorkParts[1]
      ? parseInt(dailyWorkParts[1].replace('분', '').trim())
      : 0
    const dailyWorkMinutes = dailyHours * 60 + dailyMinutes

    // 당월 근무 총시간 (시:분 형식)
    const totalWorkParts = totalWorkDoneTime.split(':')
    const totalWorkHours = parseInt(totalWorkParts[0])
    const totalWorkMinutes = parseInt(totalWorkParts[1])
    const totalWorkMinutesTotal = totalWorkHours * 60 + totalWorkMinutes

    // 오늘까지의 총 근무 시간 (오늘 근무 시간 + 당월 근무 시간)
    const totalMinutesWorked = dailyWorkMinutes + totalWorkMinutesTotal

    // 일당 평균 근로시간 계산 (총 근무 시간 ÷ 평일 수)
    const averageDailyWorkMinutes = totalMinutesWorked / weekdaysUntilToday

    // 평균 근로시간을 시간 단위로 변환 (소수점 2자리까지)
    const averageDailyWorkHours = (averageDailyWorkMinutes / 60).toFixed(2)

    return {
      averageDailyWorkHours,
      totalMinutesWorked,
    }
  }
}

function formatTimestampToKST(timestamp) {
  const date = new Date(timestamp)

  // 대한민국 표준시 (UTC+9)로 변환
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Seoul',
    hour12: false, // 24시간 형식으로 출력
  }

  // 날짜 형식 맞추기
  const formattedDate = date.toLocaleString('ko-KR', options)

  // 년-월-일 시:분:초 포맷으로 리턴
  return formattedDate
}

function formatTimeString(timeString) {
  if (timeString === 'N/A') {
    return timeString
  } else {
    // ":"을 기준으로 분리
    const [hours, minutes] = timeString.split(':')

    // hours와 minutes가 숫자인지 확인
    const hoursValid = !isNaN(hours) && hours.trim() !== ''
    const minutesValid = !isNaN(minutes) && minutes.trim() !== ''

    // 유효하지 않으면 "N/A" 출력
    if (!hoursValid || !minutesValid) {
      return 'N/A'
    }

    // 결과 문자열 반환
    return `${hours}시간 ${minutes}분`
  }
}

function dataParserFromHtml(htmlContent) {
  const displayNameRegex = /"displayName":\s*"([^"]+)"/
  const emailRegex = /"email":\s*"([^"]+)"/

  const displayNameMatch = htmlContent.match(displayNameRegex)
  const emailMatch = htmlContent.match(emailRegex)

  var returndisplayName = ''
  var returnemail = ''

  if (displayNameMatch) {
    //console.log('displayName:', displayNameMatch[1]);
    returndisplayName = displayNameMatch[1]
  } else {
    //console.log('displayName을 찾을 수 없습니다.');
  }

  if (emailMatch) {
    //console.log('email:', emailMatch[1]);
    returnemail = emailMatch[1]
  } else {
    //console.log('email을 찾을 수 없습니다.');
  }

  return {
    displayName: returndisplayName,
    email: returnemail,
    offDay: returnOffDay,
  }
}

function waitForSectionElement() {
  return new Promise((resolve) => {
    const timeout1 = setTimeout(() => reject('Timeout reached'), 5 * 1000) // 최대 5초 대기
    const checkSection = () => {
      const sectionElement = document.querySelector(
        'section[data-scope="page"][data-part="content"]',
      )
      if (sectionElement) {
        clearTimeout(timeout1) // 타임아웃 해제
        resolve(true) // 조건이 충족되면 완료
      } else {
        setTimeout(checkSection, 500) // 조건을 만족할 때까지 반복 확인
      }
    }
    checkSection()
  })
}

function getPathWithClass() {
  const allDivs = document.querySelectorAll('div.c-fsOyXD')

  const pathAttributes = [] // 결과를 저장할 배열

  allDivs.forEach((parent) => {
    const child = parent.querySelector('path') // path 요소를 선택
    if (child) {
      // path 요소의 fill과 d 속성을 가져옴
      const fill = child.getAttribute('fill')
      const d = child.getAttribute('d')

      // 객체로 저장
      pathAttributes.push({ fill, d })
    }
  })

  if (pathAttributes.length === 0) {
    return 'N/A' // 결과가 없으면 N/A 반환
  } else {
    if (pathAttributes[0].fill === '#09bb1b') {
      // #09bb1b
      // "M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10c0 .673-.066 1.33-.193 1.966a2.661 2.661 0 0 0-3.431.281l-1.032 1.032c-.307.307-.46.46-.59.534l-.06.033c-.057.034-.085.05-.116.06a.727.727 0 0 1-.13.026l-.066.01c-.148.024-.694-.038-1.784-.163a2.66 2.66 0 0 0-2.185 4.525l1.511 1.511c-.623.121-1.266.185-1.924.185-5.523 0-10-4.477-10-10Zm10.917-5.505a.917.917 0 1 0-1.835 0V12c0 .348.197.665.508.82l3.43 1.715a.917.917 0 1 0 .82-1.64l-2.923-1.462V6.495Z"
      return '근무 완료'
    } else if (pathAttributes[0].fill === '#09bb1b') {
      // #61666a
      // "M8.527 5.166A.982.982 0 0 0 7 5.983v12.034a.982.982 0 0 0 1.527.817l9.036-6.017a.98.98 0 0 0 0-1.633L8.527 5.166Z"
      return ''
    } else {
      // console.log('Path Attributes.fill:', pathAttributes[0].fill)
      //console.log('Path Attributes.d:', pathAttributes[0].d);
      return '-'
    }
  }
}

function getElementsWithClass(findTargetClassName) {
  const allDivs = document.querySelectorAll(findTargetClassName)

  const textArray = []

  allDivs.forEach((div) => {
    textArray.push(div.textContent.trim()) // 각 div의 텍스트를 배열에 추가
  })

  if (textArray.length === 0) {
    return 'N/A'
  } else {
    if (textArray[0] === '근무 시작') {
      return '0분'
    } else {
      return textArray[0]
    }
  }
}

function countElementsWithClass(findTargetClassName) {
  // 모든 div 태그를 가져옴
  const allDivs = document.querySelectorAll('div[type="button"]')

  // 조건에 맞는 div 태그 필터링
  const purpleDivs = Array.from(allDivs).filter((div) => {
    return div.className.includes(findTargetClassName)
  })

  // 필요한 경우 배열 반환
  return purpleDivs.length
}

// 특정 클래스 구조에서 데이터를 추출하는 함수
function extractSpanTextFromDiv(parentClass, childClass) {
  // 부모 클래스에 해당하는 요소를 모두 찾음
  const parentElements = document.querySelectorAll(`.${parentClass}`)
  const resultsDays = []
  const resultsHolidays = []

  parentElements.forEach((parent) => {
    // 각 부모 요소 내부에서 자식 클래스 요소를 찾음
    resultsDays.push(parent.textContent.trim())

    const child = parent.querySelector(`.${childClass}`)
    if (child) {
      // 자식 요소의 텍스트를 저장
      resultsHolidays.push(child.textContent.trim())
    }
  })

  return {
    parantObj: resultsDays,
    childObj: resultsHolidays,
  }
}
